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
            if (te.document.languageId !== "ojs") {
                return;
            }
            this._commands.refreshPreview(te.document);
        });
    }

    onSaveWatcher() {
        const ojsConfig = vscode.workspace.getConfiguration("ojs");
        vscode.workspace.onDidSaveTextDocument(doc => {
            if (doc.languageId !== "ojs" || ojsConfig.get<boolean>("refreshPreviewOnSave") === false) {
                return;
            }
            if (vscode.window.activeTextEditor) {
                this._commands.refreshPreview(doc);
            }
        }, null, this._ctx.subscriptions);
    }
}
