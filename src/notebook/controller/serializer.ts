import type { ohq } from "@hpcc-js/observablehq-compiler";

import * as path from "path";
import { NotebookSerializer, CancellationToken, NotebookData, NotebookCellData, NotebookCellKind, NotebookCell, Uri, NotebookCellOutput, NotebookCellOutputItem, NotebookRange, NotebookDocument } from "vscode";
import { v4 as uuidv4 } from "uuid";
import { TextDecoder, TextEncoder } from "util";

export const MIME = "application/gordonsmith.ojs+json";

export interface WUOutput {
    configuration: string;
    wuid: string;
    results: { [id: string]: object };
}

export interface OJSCell {
    nodeId: string | number;
    ojsSource: string;
}

export interface OJSOutput {
    notebookId: string;
    folder: string;
    files: ohq.File[], // notebook: ohq.Notebook;
    cell: OJSCell;
    otherCells: OJSCell[];
}

function encode(str: string) {
    return str
        .split("`").join("\\`")
        ;
}

interface Meta {
    notebook: { [id: string]: ohq.Notebook },
    notebookSave: { [id: string]: string },
    node: { [id: string | number]: ohq.Node }
}

export let serializer: Serializer;
export class Serializer implements NotebookSerializer {

    protected _meta: Meta = {
        notebook: {},
        notebookSave: {},
        node: {}
    };

    protected constructor() {
    }

    static attach(): Serializer {
        if (!serializer) {
            serializer = new Serializer();
        }
        return serializer;
    }

    notebook(cell: NotebookCell): ohq.Notebook {
        return this._meta.notebook[cell.notebook.metadata?.id] ?? {
            id: uuidv4(),
            files: [],
            nodes: []
        };
    }

    node(cell: NotebookCell): ohq.Node {
        return this._meta.node[cell.metadata?.id] ?? {
            id: `tmp-${cell.index}`,
            mode: cell.document.languageId,
            value: cell.document.getText()
        };
    }

    wuOutput(configuration: string, wuid: string, results: { [id: string]: object }): WUOutput {
        return {
            configuration,
            wuid,
            results
        };
    }

    ojsSource(cell: NotebookCell) {
        switch (cell.document.languageId) {
            case "ojs":
                return cell.document.getText();
            case "omd":
                return `md\`${encode(cell.document.getText())}\``;
            case "html":
                return `htl.html\`${encode(cell.document.getText())}\``;
            case "tex":
                return `tex.block\`${encode(cell.document.getText())}\``;
            case "sql":
                const sourceName = this.node(cell)?.data?.source?.name ?? "db";
                const name = this.node(cell)?.name;
                return `${name ? `${name} = ` : ""}${sourceName}.sql\`${encode(cell.document.getText())}\`;`;
            case "javascript":
                return `{${cell.document.getText()}}`;
            default:
                return `${cell.document.languageId}\`${cell.document.getText()}\``;
        }
    }

    ojsCell(cell: NotebookCell): OJSCell {
        return {
            nodeId: this.node(cell).id,
            ojsSource: this.ojsSource(cell)
        };
    }

    ojsOutput(cell: NotebookCell, uri: Uri, otherCells: NotebookCell[]): OJSOutput {
        const folder = path.dirname(cell.document.uri.path);

        return {
            notebookId: cell.notebook.metadata.id,
            folder,
            files: this._meta.notebook[cell.notebook.metadata.id].files,
            cell: this.ojsCell(cell),
            otherCells: otherCells.map(c => this.ojsCell(c))
        };
    }

    //  NotebookSerializer  ---

    async deserializeNotebook(content: Uint8Array, _token: CancellationToken): Promise<NotebookData> {
        const contents = new TextDecoder("utf-8").decode(content);

        let notebook: ohq.Notebook;
        try {
            notebook = {
                id: uuidv4(),
                ...JSON.parse(contents)
            };
        } catch {
            notebook = {
                id: uuidv4(),
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
                case "ecl":
                    kind = NotebookCellKind.Code;
                    mode = "ecl";
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
            retVal.metadata.id = node.id;
            this._meta.node[node.id] = node;

            const items: NotebookCellOutputItem[] = [];
            node.outputs?.forEach(data => {
                const ojsOutput: OJSOutput = {
                    cell: {
                        nodeId: node.id,
                        ojsSource: Buffer.from(data, "base64").toString()
                    },
                    files: notebook.files,
                    folder: "",
                    notebookId: notebook.id!,
                    otherCells: []
                };
                items.push(NotebookCellOutputItem.json(ojsOutput, MIME));
            });
            retVal.outputs = [new NotebookCellOutput(items)];
            return retVal;
        });

        const retVal = new NotebookData(cells);
        retVal.metadata = retVal.metadata ?? {};
        retVal.metadata.id = notebook.id;
        this._meta.notebook[notebook.id!] = notebook;
        this._meta.notebookSave[notebook.id!] = contents;
        return retVal;
    }

    async serializeNotebook(data: NotebookData, _token: CancellationToken): Promise<Uint8Array> {
        const jsonNotebook: ohq.Notebook = this._meta.notebook[data.metadata?.id];
        jsonNotebook.nodes = [];

        let cellIndex = 0;
        for (const cell of data.cells) {
            let mode: string;
            const outputs: string[] = [];
            switch (cell.kind) {
                case NotebookCellKind.Markup:
                    mode = "md";
                    break;
                default:
                    switch (cell.languageId) {
                        case "ojs":
                            mode = "js";
                            break;
                        case "ecl":
                            mode = "ecl";
                            break;
                        default:
                            mode = cell.languageId;
                    }
            }
            cell.outputs?.forEach(op => {
                op.items.forEach(item => {
                    try {
                        const json: OJSOutput = JSON.parse(Buffer.from(item.data).toString());
                        json.otherCells = [];
                        outputs.push(Buffer.from(json.cell.ojsSource).toString("base64"));
                    } catch (e) { }
                });
            });
            cell.metadata = cell.metadata ?? {};
            cell.metadata.id = cell.metadata?.id ?? `tmp-${cellIndex++}`;
            const node: Partial<ohq.Node> = this._meta.node[cell.metadata.id];
            const item: ohq.Node = {
                id: cell.metadata?.id,
                name: "",
                ...node,
                value: cell.value,
                mode,
                outputs
            };
            this._meta.node[cell.metadata.id] = item;
            jsonNotebook.nodes.push(item);
        }

        const contents = JSON.stringify(jsonNotebook, undefined, 4);
        this._meta.notebookSave[data.metadata!.id] = contents;
        return new TextEncoder().encode(contents);
    }

    lastSave(notebook: NotebookDocument) {
        return this._meta.notebookSave[notebook.metadata!.id];
    }
}
