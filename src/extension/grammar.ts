import type { Error, ErrorArray } from "@hpcc-js/observable-md";
import { parseModule } from "@observablehq/parser";
import { Diagnostic, DiagnosticSeverity, Range, TextDocument } from "vscode";

export function parse(text): { cells: any[], errors: ErrorArray } {
    let cells = [];
    const errors = [];
    try {
        cells = parseModule(text).cells;
    } catch (e) {
        const pos = e.pos || 0;
        let raisedAt = e.raisedAt || pos;
        raisedAt += raisedAt === pos ? 1 : 0;
        if (raisedAt) {
            errors.push({
                severity: "err",
                source: "syntax",
                message: e.message,
                start: pos,
                end: raisedAt
            });
        }
    }
    return { cells, errors };
}

export const diagnostic = (doc: TextDocument, e: Error): Diagnostic => ({
    severity: e.severity === "err" ? DiagnosticSeverity.Error : DiagnosticSeverity.Information,
    range: new Range(doc.positionAt(e.start), doc.positionAt(e.end)),
    message: e.message.toString() || "\"\"",
    source: "ojs"
});

export const diagnostics = (doc: TextDocument, errors: ErrorArray) => errors.map(e => diagnostic(doc, e));
