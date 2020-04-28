import type { ErrorArray } from "@hpcc-js/observable-md";
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
            await Preview.createOrShow(this._ctx.extensionPath);
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
}
