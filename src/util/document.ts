import { NotebookDocument, TextDocument, Uri, workspace } from "vscode";

export function isFile(doc?: TextDocument | NotebookDocument): doc is NotebookDocument {
    return doc?.uri.scheme === "file";
}

export function isNotebook(doc?: TextDocument | NotebookDocument): doc is NotebookDocument {
    return doc?.uri.scheme === "vscode-notebook";
}

export function isNotebookCell(doc?: TextDocument | NotebookDocument): doc is NotebookDocument {
    return doc?.uri.scheme === "vscode-notebook-cell";
}

export async function notebook2Text(notebook: NotebookDocument): Promise<TextDocument> {
    const notebookUri = notebook.uri.toJSON();
    const fileUri = Uri.from({ scheme: "file", path: notebookUri.path });
    return await workspace.openTextDocument(fileUri);
}

import { type ohq, type Notebook, type Cell, toCell, toNotebook } from "@hpcc-js/observablehq-compiler";

type CellMode = Cell["mode"];

function mapMode(mode: string): CellMode {
    const validModes: CellMode[] = ["js", "ts", "md", "html", "tex", "ojs", "dot", "sql", "node", "python", "r"];
    if (validModes.includes(mode as CellMode)) {
        return mode as CellMode;
    }
    switch (mode) {
        case "javascript":
            return "js";
        case "typescript":
            return "ts";
        case "markdown":
            return "md";
        default:
            console.error(`Unknown mode: ${mode}`);
            return "js"; // Default to JavaScript for unknown modes
    }
}

export function upgrade(notebook: ohq.Notebook): Notebook {
    const cells = notebook.nodes?.map((node, index) => {
        return toCell({
            id: typeof node.id === "number" ? node.id : index,
            value: node.value,
            mode: mapMode(node.mode),
            pinned: node.pinned ?? false,
            hidden: false,
            output: node.name,
        });
    }) ?? [];

    return toNotebook({
        cells,
        title: notebook.title ?? "Notebook",
        theme: "air",
        readOnly: false,
    });
}