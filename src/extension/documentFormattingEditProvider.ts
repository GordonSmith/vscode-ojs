import * as vscode from "vscode";

export class OJSDocumentFormatter implements vscode.DocumentFormattingEditProvider {

    provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]> {
        throw new Error("Method not implemented.");
    }

}
