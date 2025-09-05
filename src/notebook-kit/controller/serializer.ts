import * as vscode from "vscode";
import { JSDOM } from "jsdom";
import { v4 as uuidv4 } from "uuid";
import { TextDecoder, TextEncoder } from "util";
import type { ohq } from "@hpcc-js/observablehq-compiler";
import { type Notebook, type Cell, html2notebook, notebook2html, notebook2js, js2notebook } from "../compiler";
import { observable2vscode, vscode2observable } from "../common/types";
import { isObservableJSNotebook } from "../common/notebook-detector";

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
        let retVal;
        if (isObservableJSNotebook(contentStr)) {
            retVal = await this.deserializeJSToObservableKit(contentStr);
            retVal.metadata.type = "javascript";
        } else {
            retVal = await this.deserializeObservableKitNotebook(contentStr);
            retVal.metadata.type = "html";
        }
        return retVal;
    }

    async serializeNotebook(
        data: vscode.NotebookData,
        token: vscode.CancellationToken
    ): Promise<Uint8Array> {
        switch (data.metadata?.type) {
            case "html": {
                const htmlContent = this.serializeToObservableKitFormat(data);
                return this._textEncoder.encode(htmlContent);
            }
            case "javascript": {
                const jsContent = this.serializeToObservableKitJS(data);
                return this._textEncoder.encode(jsContent);
            }
            default: {
                // Optionally handle other types or fallback
                return this._textEncoder.encode("");
            }
        }

    }

    private notebook2notebookData(notebook: Notebook): vscode.NotebookData {
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

            cellData.metadata = cell;
            cells.push(cellData);
        }

        const notebookData = new vscode.NotebookData(cells);
        notebookData.metadata = notebook;
        return notebookData;
    }

    private deserializeObservableKitNotebook(content: string): vscode.NotebookData {
        const notebook: Notebook = html2notebook(content);
        return this.notebook2notebookData(notebook);
    }

    private async deserializeJSToObservableKit(content: string): Promise<vscode.NotebookData> {
        const notebook = await js2notebook(content);
        return this.notebook2notebookData(notebook);
    }

    private notebookData2notebook(data: vscode.NotebookData): Notebook {
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

        return notebook;
    }

    private serializeToObservableKitFormat(data: vscode.NotebookData): string {
        const notebook = this.notebookData2notebook(data);
        return notebook2html(notebook);
    }

    private serializeToObservableKitJS(data: vscode.NotebookData): string {
        const notebook = this.notebookData2notebook(data);
        return notebook2js(notebook);
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

            cells.push(cellData);
        });

        const notebookData = new vscode.NotebookData(cells);
        return notebookData;
    }

}
