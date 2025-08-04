import * as vscode from "vscode";
import { NotebookKitSerializer } from "../notebook2/controller/serializer";

/**
 * Custom notebook provider that can open HTML files as notebooks when they contain Observable structure
 */
export class ObservableNotebookProvider implements vscode.NotebookContentProvider {
    private _serializer: NotebookKitSerializer;

    constructor() {
        this._serializer = NotebookKitSerializer.attach();
    }

    async openNotebook(uri: vscode.Uri): Promise<vscode.NotebookData> {
        try {
            const content = await vscode.workspace.fs.readFile(uri);
            return await this._serializer.deserializeNotebook(content, new vscode.CancellationTokenSource().token);
        } catch (error) {
            console.error("Error opening notebook:", error);
            // Return empty notebook if parsing fails
            return new vscode.NotebookData([]);
        }
    }

    async saveNotebook(document: vscode.NotebookDocument, cancellation: vscode.CancellationToken): Promise<void> {
        const content = await this._serializer.serializeNotebook(document.getCells().map(cell => ({
            kind: cell.kind,
            languageId: cell.document.languageId,
            value: cell.document.getText(),
            outputs: cell.outputs,
            metadata: cell.metadata
        })), cancellation);

        await vscode.workspace.fs.writeFile(document.uri, content);
    }

    async saveNotebookAs(targetResource: vscode.Uri, document: vscode.NotebookDocument, cancellation: vscode.CancellationToken): Promise<void> {
        const content = await this._serializer.serializeNotebook(document.getCells().map(cell => ({
            kind: cell.kind,
            languageId: cell.document.languageId,
            value: cell.document.getText(),
            outputs: cell.outputs,
            metadata: cell.metadata
        })), cancellation);

        await vscode.workspace.fs.writeFile(targetResource, content);
    }

    async backupNotebook(document: vscode.NotebookDocument, context: vscode.NotebookDocumentBackupContext, cancellation: vscode.CancellationToken): Promise<vscode.NotebookDocumentBackup> {
        return {
            id: context.destination.toString(),
            delete: () => vscode.workspace.fs.delete(context.destination)
        };
    }
}
