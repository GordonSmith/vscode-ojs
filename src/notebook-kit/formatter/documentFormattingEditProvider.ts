import * as vscode from "vscode";
import type { Options } from "prettier";
import { isObservableHTMLNotebook } from "../common/notebook-detector";
import { formatNotebookCell, formatNotebookHtml } from "./format";

/** Formats raw Observable Notebook Kit HTML documents and supported source cells. */
export class NotebookKitDocumentFormatter implements vscode.DocumentFormattingEditProvider {

    async provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): Promise<vscode.TextEdit[]> {
        if (!vscode.workspace.getConfiguration("observableKit", document.uri).get("format.enable", true) || token.isCancellationRequested) {
            return [];
        }

        const formatOptions: Options = {
            tabWidth: options.tabSize,
            useTabs: !options.insertSpaces,
            endOfLine: document.eol === vscode.EndOfLine.CRLF ? "crlf" : "lf"
        };
        const source = document.getText();
        const isNotebookCell = document.uri.scheme === "vscode-notebook-cell";
        if (!isNotebookCell && !isObservableHTMLNotebook(source)) {
            return [];
        }
        const formatted = isNotebookCell
            ? await formatNotebookCell(source, document.languageId, formatOptions)
            : await formatNotebookHtml(source, formatOptions);
        if (formatted === undefined || formatted === source || token.isCancellationRequested) {
            return [];
        }

        const documentRange = new vscode.Range(document.positionAt(0), document.positionAt(source.length));
        return [vscode.TextEdit.replace(documentRange, formatted)];
    }
}