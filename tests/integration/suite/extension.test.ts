import * as assert from "node:assert/strict";
import * as vscode from "vscode";

const EXTENSION_ID = "GordonSmith.observable-js";

suite("Extension Integration", () => {

    test("extension is installed", () => {
        const ext = vscode.extensions.getExtension(EXTENSION_ID);
        assert.ok(ext, `Extension ${EXTENSION_ID} should be installed`);
    });

    test("extension activates successfully", async function () {
        const ext = vscode.extensions.getExtension(EXTENSION_ID);
        assert.ok(ext, `Extension ${EXTENSION_ID} should be installed`);
        const extension = ext;

        await assert.doesNotReject(
            Promise.resolve(extension.activate()),
            "Extension activation should not reject"
        );
        assert.ok(extension.isActive, "Extension should be active after activation");
        assert.ok(
            extension.extensionPath.includes("vscode-ojs"),
            `Expected development extension path, got '${extension.extensionPath}'`
        );
    });
});
