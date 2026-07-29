import * as vscode from "vscode";
import { isObservableNotebookDocument } from "../common/notebook-detector";

/** Registers raw HTML formatting only while an Observable notebook is active. */
export class RawDocumentFormatterRegistration implements vscode.Disposable {
    private formatterRegistration: vscode.Disposable | undefined;
    private readonly subscriptions: vscode.Disposable[];

    constructor(private readonly formatter: vscode.DocumentFormattingEditProvider) {
        this.subscriptions = [
            vscode.window.onDidChangeActiveTextEditor(editor => this.update(editor?.document)),
            vscode.workspace.onDidChangeTextDocument(event => {
                if (event.document === vscode.window.activeTextEditor?.document) {
                    this.update(event.document);
                }
            })
        ];
        this.update(vscode.window.activeTextEditor?.document);
    }

    private update(document: vscode.TextDocument | undefined): void {
        const shouldRegister = isObservableNotebookDocument(document) && document?.languageId === "html";
        if (shouldRegister && !this.formatterRegistration) {
            this.formatterRegistration = vscode.languages.registerDocumentFormattingEditProvider(
                { language: "html" },
                this.formatter
            );
        } else if (!shouldRegister && this.formatterRegistration) {
            this.formatterRegistration.dispose();
            this.formatterRegistration = undefined;
        }
    }

    dispose(): void {
        this.formatterRegistration?.dispose();
        this.subscriptions.forEach(subscription => subscription.dispose());
    }
}