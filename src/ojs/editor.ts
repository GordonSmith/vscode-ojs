import * as vscode from "vscode";
import { Commands } from "./command";
import { isFile, notebook2Text } from "../util/document";
import { serializer } from "../notebook/controller/serializer";

let ojsEditor: Editor;
export class Editor {
    _ctx: vscode.ExtensionContext;
    _commands: Commands;

    private constructor(ctx: vscode.ExtensionContext) {
        this._ctx = ctx;
        this._commands = Commands.attach(ctx);

        this.onOpenWatcher();
        this.onSaveWatcher();
    }

    static attach(ctx: vscode.ExtensionContext): Editor {
        if (!ojsEditor) {
            ojsEditor = new Editor(ctx);
        }
        return ojsEditor;
    }

    onOpenWatcher() {
        vscode.window.onDidChangeActiveTextEditor(te => {
            if (isFile(te?.document)) {
                switch (te?.document?.languageId) {
                    case "ojs":
                    case "omd":
                        this._commands.refreshPreview(te?.document);
                        break;
                }
            }
        });

        vscode.window.onDidChangeActiveNotebookEditor(async ne => {
            switch (ne?.notebook.notebookType) {
                case "ojs-notebook":
                    this._commands.refreshPreview(await notebook2Text(ne.notebook));
                    break;
            }
        });
    }

    onSaveWatcher() {
        const ojsConfig = vscode.workspace.getConfiguration("ojs");
        vscode.workspace.onDidSaveTextDocument(doc => {
            if (vscode.window.activeTextEditor) {
                switch (doc.languageId) {
                    case "ojs":
                    case "omd":
                        if (ojsConfig.get<boolean>("refreshPreviewOnSave") === true) {
                            this._commands.refreshPreview(doc);
                        }
                        break;
                }
            }
        }, null, this._ctx.subscriptions);

        vscode.workspace.onDidSaveNotebookDocument(async notebook => {
            if (vscode.window.activeTextEditor) {
                switch (notebook.notebookType) {
                    case "ojs-notebook":
                        if (ojsConfig.get<boolean>("refreshPreviewOnSave") === true) {
                            const doc = await notebook2Text(notebook);
                            const text = serializer.lastSave(notebook);
                            this._commands.refreshPreview(doc, text);
                        }
                        break;
                }
            }
        });
    }
}
