import * as vscode from "vscode";
import { TextDecoder, TextEncoder } from "util";
import { ohq, NotebookData, Writer } from "@hpcc-js/observablehq-compiler";

export class Serializer implements vscode.NotebookSerializer {
    async deserializeNotebook(content: Uint8Array, _token: vscode.CancellationToken): Promise<vscode.NotebookData> {
        const contents = new TextDecoder("utf-8").decode(content);

        let notebook: ohq.Notebook;
        try {
            notebook = JSON.parse(contents);
        } catch {
            notebook = {
                files: [],
                nodes: []
            } as unknown as ohq.Notebook;
        }

        const cells = notebook.nodes?.map(node => {
            let kind: vscode.NotebookCellKind;
            let mode: string;
            switch (node.mode) {
                case "md":
                    kind = vscode.NotebookCellKind.Markup;
                    mode = "markdown";
                    break;
                case "js":
                    kind = vscode.NotebookCellKind.Code;
                    mode = "ojs";
                    break;
                default:
                    kind = vscode.NotebookCellKind.Code;
                    mode = node.mode;
            }
            const retVal = new vscode.NotebookCellData(node.mode === "md" ?
                vscode.NotebookCellKind.Markup :
                vscode.NotebookCellKind.Code, node.value, mode);
            retVal.metadata = retVal.metadata ?? {};
            retVal.metadata.node = node;
            return retVal;
        });

        const retVal = new vscode.NotebookData(cells);
        retVal.metadata = retVal.metadata ?? {};
        retVal.metadata.notebook = notebook;
        return retVal;
    }

    async serializeNotebook(data: vscode.NotebookData, _token: vscode.CancellationToken): Promise<Uint8Array> {
        const jsonNotebook: ohq.Notebook = data.metadata?.notebook;
        jsonNotebook.nodes = [];

        let id = 0;
        for (const cell of data.cells) {
            let mode: string;
            switch (cell.kind) {
                case vscode.NotebookCellKind.Markup:
                    mode = "md";
                    break;
                default:
                    switch (cell.languageId) {
                        case "ojs":
                            mode = "js";
                            break;
                        default:
                            mode = cell.languageId;
                    }
            }
            jsonNotebook.nodes.push({
                ...cell.metadata?.node,
                id: id,
                name: "",
                value: cell.value,
                mode
            });
            ++id;
        }
        // const writer = new Writer();
        // notebook.compile(writer);

        return new TextEncoder().encode(JSON.stringify(jsonNotebook, undefined, 4));
    }
}
