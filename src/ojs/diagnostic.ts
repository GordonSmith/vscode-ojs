import * as vscode from "vscode";

let quickDiagnosticCollection: vscode.DiagnosticCollection;
let runtimeDiagnosticCollection: vscode.DiagnosticCollection;

export let diagnostic: Diagnostic;
export class Diagnostic {
    _ctx: vscode.ExtensionContext;

    private constructor(ctx: vscode.ExtensionContext) {
        this._ctx = ctx;
        quickDiagnosticCollection = vscode.languages.createDiagnosticCollection("ojsQuick");
        ctx.subscriptions.push(quickDiagnosticCollection);
        runtimeDiagnosticCollection = vscode.languages.createDiagnosticCollection("ojsRuntime");
        ctx.subscriptions.push(runtimeDiagnosticCollection);
    }

    static attach(ctx: vscode.ExtensionContext): Diagnostic {
        if (!diagnostic) {
            diagnostic = new Diagnostic(ctx);
        }
        return diagnostic;
    }

    setQuick(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]) {
        quickDiagnosticCollection.set(uri, diagnostics);
    }

    posStr(r: vscode.Position): string {
        return `${r.line}_${r.character}`;
    }

    rangeStr(r: vscode.Range): string {
        return `${this.posStr(r.start)}->${this.posStr(r.end)}`;
    }

    setRuntime(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]) {
        runtimeDiagnosticCollection.set(uri, diagnostics);
    }
}
