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

    test("formats a raw Notebook Kit HTML document", async function () {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        assert.ok(workspaceFolder, "Expected an open workspace folder");
        const uri = vscode.Uri.joinPath(workspaceFolder.uri, "formatter-test.html");
        const source = `<!doctype html>
<notebook>
<title>Hello, world!</title>
<script type="text/markdown">
# Hello, world!
</script>
<script type="module" pinned>
1 + 2
</script>
</notebook>`;

        try {
            await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(source));
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);
            await vscode.commands.executeCommand("editor.action.formatDocument");

            assert.strictEqual(document.getText(), `<!doctype html>
<notebook>
    <title>Hello, world!</title>
    <script type="text/markdown">
        # Hello, world!
    </script>
    <script type="module" pinned>
        1 + 2
    </script>
</notebook>`);
        } finally {
            await vscode.workspace.fs.delete(uri, { useTrash: false });
        }
    });
});
