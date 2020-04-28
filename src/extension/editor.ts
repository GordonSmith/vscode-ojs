import * as vscode from "vscode";
import { Commands } from "./command";

let kelEditor: Editor;
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
        if (!kelEditor) {
            kelEditor = new Editor(ctx);
        }
        return kelEditor;
    }

    onOpenWatcher() {
        vscode.window.onDidChangeActiveTextEditor(te => {
            if (te.document.languageId !== "ojs") {
                return;
            }
            this._commands.refreshPreview(te.document);
        });
    }

    onSaveWatcher() {
        vscode.workspace.onDidSaveTextDocument(doc => {
            if (doc.languageId !== "ojs") {
                return;
            }
            if (vscode.window.activeTextEditor) {
                this._commands.refreshPreview(doc);
            }
        }, null, this._ctx.subscriptions);
    }
}
