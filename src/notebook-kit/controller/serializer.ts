import * as vscode from "vscode";
import { TextDecoder, TextEncoder } from "util";
import { deserialize, serialize, type Notebook, type Cell } from "@observablehq/notebook-kit";
import { observable2vscode, vscode2observable } from "../common/types";
import { installMinimalDOMPolyfill } from "./dom-polyfill";
import { isObservableNotebook } from "../../util/htmlNotebookDetector";

// Adapter to make xmldom nodes compatible with css-select
const xmldomAdapter = {
    isTag: (node: Node): node is Element => node.nodeType === 1, // ELEMENT_NODE

    getAttributeValue: (elem: Element, name: string): string | undefined => {
        return elem.getAttribute(name) || undefined;
    },

    getChildren: (node: Node): Node[] => {
        return Array.from(node.childNodes || []);
    },

    getName: (elem: Element): string => {
        return elem.nodeName?.toLowerCase() || "";
    },

    getParent: (node: Element): Node | null => {
        return node.parentNode;
    },

    getSiblings: (node: Node): Node[] => {
        if (!node.parentNode) return [node];
        return Array.from(node.parentNode.childNodes || []);
    },

    getText: (node: Node): string => {
        return node.textContent || "";
    },

    hasAttrib: (elem: Element, name: string): boolean => {
        return elem.hasAttribute(name);
    },

    removeSubsets: (nodes: Node[]): Node[] => {
        return nodes.filter((node, i) => {
            return !nodes.some((other, j) => {
                return i !== j && other.contains && other.contains(node);
            });
        });
    },

    equals: (a: Node, b: Node): boolean => {
        return a === b;
    }
};

let serializer: NotebookKitSerializer;

export class NotebookKitSerializer implements vscode.NotebookSerializer {

    private readonly _textDecoder = new TextDecoder();
    private readonly _textEncoder = new TextEncoder();

    protected constructor() { }

    static attach(): NotebookKitSerializer {
        if (!serializer) {
            serializer = new NotebookKitSerializer();
        }
        installMinimalDOMPolyfill();
        return serializer;
    }

    async deserializeNotebook(
        content: Uint8Array,
        token: vscode.CancellationToken
    ): Promise<vscode.NotebookData> {
        const contentStr = this._textDecoder.decode(content);
        if (isObservableNotebook(contentStr)) {
            return this.deserializeObservableKitNotebook(contentStr);
        }
    }

    async serializeNotebook(
        data: vscode.NotebookData,
        token: vscode.CancellationToken
    ): Promise<Uint8Array> {
        // Default to Observable Kit format for new notebooks
        const htmlContent = this.serializeToObservableKitFormat(data);
        return this._textEncoder.encode(htmlContent);
    }

    private deserializeObservableKitNotebook(content: string): vscode.NotebookData {

        const notebook: Notebook = deserialize(content);
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

            // Ensure pinned and hidden properties are explicitly boolean
            const metadata: any = { ...cell };
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
        // Convert VSCode notebook data to Observable Kit format
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

        // Use the official Observable Kit serialize function
        return serialize(notebook);
    }

}
