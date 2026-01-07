/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from "vscode";
import { describe, expect, it } from "vitest";
import { activate, getDocUri } from "./helper";

describe.skip("Should get diagnostics", () => {
    const docUri = getDocUri("diagnostics.txt");

    it("Diagnoses uppercase texts", async () => {
        await testDiagnostics(docUri, [
            { message: "ANY is all uppercase.", range: toRange(0, 0, 0, 3), severity: vscode.DiagnosticSeverity.Warning, source: "ex" },
            { message: "ANY is all uppercase.", range: toRange(0, 14, 0, 17), severity: vscode.DiagnosticSeverity.Warning, source: "ex" },
            { message: "OS is all uppercase.", range: toRange(0, 18, 0, 20), severity: vscode.DiagnosticSeverity.Warning, source: "ex" }
        ]);
    });
});

function toRange(sLine: number, sChar: number, eLine: number, eChar: number) {
    const start = new vscode.Position(sLine, sChar);
    const end = new vscode.Position(eLine, eChar);
    return new vscode.Range(start, end);
}

async function testDiagnostics(docUri: vscode.Uri, expectedDiagnostics: vscode.Diagnostic[]) {
    await activate(docUri);

    const actualDiagnostics = vscode.languages.getDiagnostics(docUri);

    expect(actualDiagnostics.length).toStrictEqual(expectedDiagnostics.length);

    expectedDiagnostics.forEach((expectedDiagnostic, i) => {
        const actualDiagnostic = actualDiagnostics[i];
        expect(actualDiagnostic.message).toStrictEqual(expectedDiagnostic.message);
        expect(actualDiagnostic.range).toStrictEqual(expectedDiagnostic.range);
        expect(actualDiagnostic.severity).toStrictEqual(expectedDiagnostic.severity);
    });
}
