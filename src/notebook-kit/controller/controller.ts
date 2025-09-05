import * as vscode from "vscode";
import { type Notebook, type Cell } from "../compiler";
import { OBSERVABLE_KIT_MIME, vscode2observable, NotebookCell } from "../common/types";
import path from "node:path";

export class NotebookKitController {
    readonly controllerId: string;
    readonly notebookType: string;
    readonly label = "ObservableHQ Notebook";
    readonly supportedLanguages = Object.keys(vscode2observable);

    private readonly _controller: vscode.NotebookController;
    private _executionOrder = 0;

    constructor(notebookType: string) {
        this.controllerId = `${notebookType}-kernel`;
        this.notebookType = notebookType;
        this._controller = vscode.notebooks.createNotebookController(
            this.controllerId,
            this.notebookType,
            this.label
        );

        this._controller.supportedLanguages = this.supportedLanguages;
        this._controller.supportsExecutionOrder = true;
        this._controller.executeHandler = this.execute.bind(this);
    }

    dispose() {
        this._controller.dispose();
    }

    private async execute(
        cells: vscode.NotebookCell[],
        notebook: vscode.NotebookDocument,
        controller: vscode.NotebookController
    ): Promise<void> {
        for (const cell of cells) {
            await this.executeCell(cell, notebook);
        }
    }

    private async executeCell(
        cell: vscode.NotebookCell,
        notebook: vscode.NotebookDocument
    ): Promise<void> {
        const execution = this._controller.createNotebookCellExecution(cell);
        execution.executionOrder = ++this._executionOrder;
        execution.start(Date.now());

        try {
            const output = await this.executeCellContent(cell, notebook);
            if (output) {
                await execution.replaceOutput([output]);
            }
            execution.end(true, Date.now());
        } catch (error) {
            const errorOutput = new vscode.NotebookCellOutput([
                vscode.NotebookCellOutputItem.error(error as Error)
            ]);
            await execution.replaceOutput([errorOutput]);
            execution.end(false, Date.now());
        }
    }

    private async executeCellContent(
        cell: vscode.NotebookCell,
        notebook: vscode.NotebookDocument
    ): Promise<vscode.NotebookCellOutput | undefined> {
        const cellText = cell.document.getText();
        const baseDir = path.dirname(notebook.uri.fsPath);
        const resolvedCellText = this.resolveRelativeImports(cellText, baseDir);
        const outputData: NotebookCell = {
            notebook: notebook.metadata as Notebook,
            cell: cell.metadata as Cell,
            cellText: resolvedCellText
        };
        return new vscode.NotebookCellOutput([
            vscode.NotebookCellOutputItem.json(outputData, OBSERVABLE_KIT_MIME)
        ]);
    }

    /**
     * Find all import/export specifiers in the provided cell text that are relative (start with ./ or ../)
     * and rewrite them to absolute file paths prefixed with the VS Code webview CDN base
     * "https://file+.vscode-resource.vscode-cdn.net/" (normalized with forward slashes).
     * This includes forms:
     *  - import x from "./foo.js";
     *  - import {x} from '../bar';
     *  - import "./side-effect";
     *  - export {x} from './reexport';
     *  - export * from '../reexport-all';
     *  - dynamic import("./foo.js")
     */
    private resolveRelativeImports(cellText: string, baseDir: string): string {
        const CDN_PREFIX = "https://file+.vscode-resource.vscode-cdn.net/";

        const toCdnUrl = (rel: string): string => {
            try {
                const abs = path.resolve(baseDir, rel);
                const normalized = abs.replace(/\\/g, "/");
                return `${CDN_PREFIX}${normalized}`;
            } catch {
                // On any error, return the original relative specifier unchanged
                return rel;
            }
        };

        const transformLine = (line: string): string => {
            if (!/(?:\bimport\b|\bexport\b)/.test(line)) return line;

            const patterns: RegExp[] = [
                /(import\s+[^"'`\n]*?from\s+)(['"])(\.{1,2}\/[^'"`]+)(\2)/, // 0: import X from './rel'
                /(export\s+[^"'`\n]*?from\s+)(['"])(\.{1,2}\/[^'"`]+)(\2)/, // 1: export { X } from './rel'
                /(import\s+)(['"])(\.{1,2}\/[^'"`]+)(\2)/,                  // 2: import './rel'
                /(\bimport\(\s*)(['"])(\.{1,2}\/[^'"`]+)(\2)(\s*\))/     // 3: dynamic import('./rel')
            ];

            patterns.forEach((re, idx) => {
                line = line.replace(re, (m, p1, quote, rel, p4, p5) => {
                    const url = toCdnUrl(rel);
                    if (idx === 3) {
                        return `${p1}${quote}${url}${quote}${p5}`;
                    }
                    return `${p1}${quote}${url}${quote}`;
                });
            });
            return line;
        };

        // Process line-by-line to avoid crossing line boundaries with simple regex
        const lines = cellText.split(/\r?\n/);
        return lines.map(transformLine).join("\n");
    }
}
