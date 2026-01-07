/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from "vscode";
import { describe, expect, it } from "vitest";
import { activate, getDocUri } from "./helper";

describe.skip("Should do completion", () => {
    const docUri = getDocUri("completion.txt");

    it("Completes JS/TS in txt file", async () => {
        await testCompletion(docUri, new vscode.Position(0, 0), {
            items: [
                { label: "JavaScript", kind: vscode.CompletionItemKind.Text },
                { label: "TypeScript", kind: vscode.CompletionItemKind.Text }
            ]
        });
    });
});

async function testCompletion(
    docUri: vscode.Uri,
    position: vscode.Position,
    expectedCompletionList: vscode.CompletionList
) {
    await activate(docUri);

    // Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
    const actualCompletionList = (await vscode.commands.executeCommand(
        "vscode.executeCompletionItemProvider",
        docUri,
        position
    )) as vscode.CompletionList;

    expect(actualCompletionList.items.length).toBeGreaterThanOrEqual(2);
    expectedCompletionList.items.forEach((expectedItem, i) => {
        const actualItem = actualCompletionList.items[i];
        expect(actualItem.label).toStrictEqual(expectedItem.label);
        expect(actualItem.kind).toStrictEqual(expectedItem.kind);
    });
}
