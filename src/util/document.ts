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