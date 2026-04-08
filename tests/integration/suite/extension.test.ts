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

        if (!ext.isActive) {
            await ext.activate();
        }
        assert.ok(ext.isActive, "Extension should be active after activation");
    });

    test("registers ojs commands", async function () {
        const ext = vscode.extensions.getExtension(EXTENSION_ID);
        assert.ok(ext);

        if (!ext.isActive) {
            await ext.activate();
        }

        const allCommands = await vscode.commands.getCommands(true);
        const ojsCommands = allCommands.filter(c => c.startsWith("ojs."));
        assert.ok(ojsCommands.length > 0, `Expected ojs.* commands, found: ${ojsCommands.length}`);
    });
});
