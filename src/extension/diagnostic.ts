import * as vscode from "vscode";

let kelDiagnosticCollection: vscode.DiagnosticCollection;
let kelQuickDiagnosticCollection: vscode.DiagnosticCollection;

export let diagnostic: Diagnostic;
export class Diagnostic {
    _ctx: vscode.ExtensionContext;

    private constructor(ctx: vscode.ExtensionContext) {
        this._ctx = ctx;
        kelDiagnosticCollection = vscode.languages.createDiagnosticCollection("ojs");
        ctx.subscriptions.push(kelDiagnosticCollection);
        kelQuickDiagnosticCollection = vscode.languages.createDiagnosticCollection("ojsQuick");
        ctx.subscriptions.push(kelQuickDiagnosticCollection);
    }

    static attach(ctx: vscode.ExtensionContext): Diagnostic {
        if (!diagnostic) {
            diagnostic = new Diagnostic(ctx);
        }
        return diagnostic;
    }

    set(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]) {
        kelDiagnosticCollection.set(uri, diagnostics);
    }

    setQuick(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]) {
        kelQuickDiagnosticCollection.set(uri, diagnostics);
    }
}
