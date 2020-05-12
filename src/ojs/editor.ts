import * as vscode from "vscode";
import { Commands } from "./command";

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
            switch (te.document.languageId) {
                case "ojs":
                case "omd":
                    this._commands.refreshPreview(te.document);
                    break;
            }
        });
    }

    onSaveWatcher() {
        const ojsConfig = vscode.workspace.getConfiguration("ojs");
        vscode.workspace.onDidSaveTextDocument(doc => {
            switch (doc.languageId) {
                case "ojs":
                case "omd":
                    if (ojsConfig.get<boolean>("refreshPreviewOnSave") === true) {
                        if (vscode.window.activeTextEditor) {
                            this._commands.refreshPreview(doc);
                        }
                    }
                    break;
            }

        }, null, this._ctx.subscriptions);
    }
}
