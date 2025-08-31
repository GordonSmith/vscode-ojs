import * as vscode from "vscode";
import { JSDOM } from "jsdom";
import { v4 as uuidv4 } from "uuid";
import { TextDecoder, TextEncoder } from "util";
import type { ohq } from "@hpcc-js/observablehq-compiler";
import { type Notebook, type Cell, html2notebook, notebook2html } from "../compiler";
import { observable2vscode, vscode2observable } from "../common/types";
import { isObservableNotebook } from "../../util/htmlNotebookDetector";

const { window } = new JSDOM();
globalThis.document = window.document;
globalThis.DOMParser = window.DOMParser;

let serializer: NotebookKitSerializer;

export class NotebookKitSerializer implements vscode.NotebookSerializer {

    private readonly _textDecoder = new TextDecoder();
    private readonly _textEncoder = new TextEncoder();

    protected constructor() { }

    static attach(): NotebookKitSerializer {
        if (!serializer) {
            serializer = new NotebookKitSerializer();
        }
        return serializer;
    }

    async deserializeNotebook(
        content: Uint8Array,
        token: vscode.CancellationToken
    ): Promise<vscode.NotebookData> {
        const contentStr = this._textDecoder.decode(content);
        if (isObservableNotebook(contentStr)) {
            return this.deserializeObservableKitNotebook(contentStr);
        } else {
            return this.deserializeOJSNotebook(contentStr);
        }
    }

    async serializeNotebook(
        data: vscode.NotebookData,
        token: vscode.CancellationToken
    ): Promise<Uint8Array> {
        const htmlContent = this.serializeToObservableKitFormat(data);
        return this._textEncoder.encode(htmlContent);
    }

    private deserializeObservableKitNotebook(content: string): vscode.NotebookData {

        const notebook: Notebook = html2notebook(content);
        const cells: vscode.NotebookCellData[] = [];

        for (const cell of notebook.cells) {
            const cellKind = cell.mode === "md"
                ? vscode.NotebookCellKind.Markup
                : vscode.NotebookCellKind.Code;

            const language = observable2vscode[cell.mode] || "javascript";

            const cellData = new vscode.NotebookCellData(
                cellKind,
                cell.value,
                language
            );

            const metadata: Cell = { ...cell };
            if (metadata.pinned === undefined || metadata.pinned === null) {
                metadata.pinned = false;
            }
            if (metadata.hidden === undefined || metadata.hidden === null) {
                metadata.hidden = false;
            }
            cellData.metadata = metadata;
            cells.push(cellData);
        }

        const notebookData = new vscode.NotebookData(cells);
        notebookData.metadata = notebook;

        return notebookData;
    }

    private serializeToObservableKitFormat(data: vscode.NotebookData): string {
        const cells: Cell[] = [];
        let cellIdCounter = 1;

        for (const cell of data.cells) {
            const cellId = cell.metadata?.id ? parseInt(cell.metadata.id) : cellIdCounter++;
            const mode = vscode2observable[cell.languageId] || "js";
            const pinned = cell.metadata?.pinned ?? false;
            const hidden = cell.metadata?.hidden ?? false;

            cells.push({
                id: cellId,
                value: cell.value,
                mode,
                pinned,
                hidden,
                since: undefined,
            });
        }

        const notebook: Notebook = {
            ...data.metadata as Notebook,
            cells
        };

        return notebook2html(notebook);
    }

    async deserializeOJSNotebook(content: string): Promise<vscode.NotebookData> {

        let notebook: ohq.Notebook;
        try {
            notebook = {
                id: uuidv4(),
                ...JSON.parse(content)
            };
        } catch {
            notebook = {
                id: uuidv4(),
                files: [],
                nodes: []
            } as unknown as ohq.Notebook;
        }

        const cells: vscode.NotebookCellData[] = [];

        notebook.nodes?.forEach(node => {
            let kind: vscode.NotebookCellKind;
            let mode: string;
            switch (node.mode) {
                case "md":
                    kind = vscode.NotebookCellKind.Markup;
                    mode = "markdown";
                    break;
                case "ecl":
                    kind = vscode.NotebookCellKind.Code;
                    mode = "ecl";
                    break;
                case "js":
                    kind = vscode.NotebookCellKind.Code;
                    mode = "ojs";
                    break;
                default:
                    kind = vscode.NotebookCellKind.Code;
                    mode = node.mode;
            }
            const cellData = new vscode.NotebookCellData(node.mode === "md" ?
                vscode.NotebookCellKind.Markup :
                vscode.NotebookCellKind.Code, node.value, mode);

            const metadata = {
                id: node.id,
                value: node.value,
                mode: node.mode as any,
                pinned: false,
                hidden: false
            };

            cellData.metadata = metadata;
            cells.push(cellData);
        });

        const notebookData = new vscode.NotebookData(cells);
        notebookData.metadata = notebook;
        notebookData.metadata.ojs = true;

        return notebookData;
    }

}
