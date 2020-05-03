import fetch from "node-fetch";
import * as vscode from "vscode";
import { Diagnostic } from "./diagnostic";
import { diagnostics, parse } from "./grammar";
import { Preview } from "./preview";

export let commands: Commands;
export class Commands {
    _ctx: vscode.ExtensionContext;
    protected _diagnostic: Diagnostic;

    private constructor(ctx: vscode.ExtensionContext) {
        this._ctx = ctx;
        this._diagnostic = Diagnostic.attach(ctx);

        ctx.subscriptions.push(vscode.commands.registerCommand("ojs.preview", this.preview, this));
        ctx.subscriptions.push(vscode.commands.registerCommand("ojs.checkSyntax", this.activeCheckSyntax, this));
        ctx.subscriptions.push(vscode.commands.registerCommand("ojs.import", this.import, this));
    }

    static attach(ctx: vscode.ExtensionContext): Commands {
        if (!commands) {
            commands = new Commands(ctx);
        }
        return commands;
    }

    activeCheckSyntax() {
        return this.checkSyntax(vscode.window.activeTextEditor?.document);
    }

    checkSyntax(doc?: vscode.TextDocument) {
        if (doc) {
            this._diagnostic.set(doc.uri, []);
            const text = doc.getText();
            this._diagnostic.set(doc.uri, diagnostics(doc, parse(text).errors));
        }
    }

    async preview() {
        if (vscode.window.activeTextEditor) {
            const textDocument = vscode.window.activeTextEditor.document;
            await Preview.createOrShow(this._ctx, textDocument);
            this.refreshPreview(textDocument);
        }
    }

    async refreshPreview(doc?: vscode.TextDocument) {
        if (doc) {
            this._diagnostic.set(doc.uri, []);
            const text = doc.getText();
            if (Preview.currentPanel) {
                const errors = await Preview.currentPanel.evaluate(text);
                this._diagnostic.set(doc.uri, diagnostics(doc, errors));
            }
        }
    }

    async import() {
        if (vscode.window.activeTextEditor) {
            const textEditor = vscode.window.activeTextEditor;
            const impUrl = await vscode.window.showInputBox({
                prompt: "URL", placeHolder: "https://observablehq.com/@user/notebook"
            });
            if (impUrl) {
                const nb = await fetch(impUrl.replace("https://observablehq.com/", "https://api.observablehq.com/document/"), {
                    headers: {
                        origin: "https://observablehq.com",
                        referer: impUrl
                    }
                }).then(r => r.json());
                let text = nb.nodes.map(node => node.value).join("\n//  ---\n");
                nb.files.forEach(f => {
                    text = text.split(`"${f.name}"`).join(`/* "${f.name}" */"${f.url}"`);
                });
                InsertText(textEditor, () => text);
            }
        }
    }
}

function InsertText(activeEditor, getText: (i: number) => string, i: number = 0, wasEmpty: boolean = false) {

    const sels = activeEditor.selections;

    if (i > 0 && wasEmpty) {
        sels[i - 1] = new vscode.Selection(sels[i - 1].end, sels[i - 1].end);
        activeEditor.selections = sels; // required or the selection updates will be ignored! 😱
    }

    if (i < 0 || i >= sels.length) { return; }

    const isEmpty = sels[i].isEmpty;
    activeEditor.edit(edit => edit.replace(sels[i], getText(i))).then(x => {
        InsertText(activeEditor, getText, i + 1, isEmpty);
    });
}
