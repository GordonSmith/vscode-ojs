import { env, NotebookSerializer, CancellationToken, NotebookData, NotebookCellData, NotebookCellKind } from "vscode";
import { TextDecoder, TextEncoder } from "util";
import { observablehq as ohq } from "../../compiler/types";
import { Notebook } from "../../compiler/notebook";
import { Writer } from "../../compiler/writer";

export class Serializer implements NotebookSerializer {
    async deserializeNotebook(content: Uint8Array, _token: CancellationToken): Promise<NotebookData> {
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
            let kind: NotebookCellKind;
            let mode: string;
            switch (node.mode) {
                case "md":
                    kind = NotebookCellKind.Markup;
                    mode = "markdown";
                    break;
                case "js":
                    kind = NotebookCellKind.Code;
                    mode = "ojs";
                    break;
                default:
                    kind = NotebookCellKind.Code;
                    mode = node.mode;
            }
            const retVal = new NotebookCellData(node.mode === "md" ?
                NotebookCellKind.Markup :
                NotebookCellKind.Code, node.value, mode);
            retVal.metadata = retVal.metadata ?? {};
            retVal.metadata.node = node;
            return retVal;
        });

        const retVal = new NotebookData(cells);
        retVal.metadata = retVal.metadata ?? {};
        retVal.metadata.notebook = notebook;
        return retVal;
    }

    async serializeNotebook(data: NotebookData, _token: CancellationToken): Promise<Uint8Array> {
        const jsonNotebook: ohq.Notebook = data.metadata?.notebook;
        jsonNotebook.nodes = [];

        const notebook = new Notebook(jsonNotebook);
        let id = 0;
        for (const cell of data.cells) {
            let mode: string;
            switch (cell.kind) {
                case NotebookCellKind.Markup:
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
            const item = {
                ...cell.metadata?.node,
                id: id,
                name: "",
                value: cell.value,
                mode
            };
            jsonNotebook.nodes.push(item);
            notebook.createCell().text(cell.value, cell.languageId);
            ++id;
        }
        const writer = new Writer();
        notebook.compile(writer);

        return new TextEncoder().encode(JSON.stringify(jsonNotebook, undefined, 4));
    }
}
