/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as assert from "assert";
import * as vscode from "vscode";

export async function run(): Promise<void> {
    const extensionId = "GordonSmith.observable-js";
    const extension = vscode.extensions.getExtension(extensionId);
    assert.ok(extension, `Missing extension: ${extensionId}`);

    await extension.activate();
    assert.ok(extension.isActive, `Extension did not activate: ${extensionId}`);
}
