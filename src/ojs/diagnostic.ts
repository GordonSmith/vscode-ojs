import * as vscode from "vscode";

let diagnosticCollection: vscode.DiagnosticCollection;
let quickDiagnosticCollection: vscode.DiagnosticCollection;

export let diagnostic: Diagnostic;
export class Diagnostic {
    _ctx: vscode.ExtensionContext;

    private constructor(ctx: vscode.ExtensionContext) {
        this._ctx = ctx;
        diagnosticCollection = vscode.languages.createDiagnosticCollection("ojs");
        ctx.subscriptions.push(diagnosticCollection);
        quickDiagnosticCollection = vscode.languages.createDiagnosticCollection("ojsQuick");
        ctx.subscriptions.push(quickDiagnosticCollection);
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

    _diagnostics: vscode.Diagnostic[] = [];
    _diagnosticsMap: { [key: string]: number } = {};
    set(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]) {
        diagnosticCollection.set(uri, diagnostics);
        this._diagnostics = diagnostics;
        this._diagnosticsMap = {};
        diagnostics.forEach((d, i) => this._diagnosticsMap[this.rangeStr(d.range)] = i);
    }

    setRuntime(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]) {
        diagnostics.forEach((d, i) => {
            const idx = this._diagnosticsMap[this.rangeStr(d.range)];
            if (idx >= 0) {
                this._diagnostics[idx] = d;
            }
        });
        diagnosticCollection.set(uri, this._diagnostics);
    }
}
