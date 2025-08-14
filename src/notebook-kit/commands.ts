import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export class Commands {

    private static _ctx: vscode.ExtensionContext;

    static attach(ctx: vscode.ExtensionContext) {
        Commands._ctx = ctx;
        ctx.subscriptions.push(
            vscode.commands.registerCommand("observable-kit.build", Commands.build),
            vscode.commands.registerCommand("observable-kit.createNotebook", Commands.createNotebook),
            vscode.commands.registerCommand("observable-kit.convertFromLegacy", Commands.convertFromLegacy),
            vscode.commands.registerCommand("observable-kit.setupWorkspace", Commands.setupWorkspace),
            vscode.commands.registerCommand("observable-kit.cell.pin", Commands.pinCell),
            vscode.commands.registerCommand("observable-kit.cell.unpin", Commands.unpinCell),
        );

        // Handle cell selection changes to update pin context
        ctx.subscriptions.push(
            vscode.window.onDidChangeNotebookEditorSelection(e => {
                Commands.updatePinContext(e.notebookEditor);
            })
        );

        // Handle when a different notebook becomes active
        ctx.subscriptions.push(
            vscode.window.onDidChangeActiveNotebookEditor(e => {
                if (e) {
                    Commands.updatePinContext(e);
                }
            })
        );
    }

    private static updatePinContext(editor: vscode.NotebookEditor): void {
        if (editor.notebook.notebookType === "onb-notebook-kit" && editor.selections.length > 0) {
            const cell = editor.notebook.cellAt(editor.selections[0].start);
            const isPinned = cell.metadata?.pinned === true;
            vscode.commands.executeCommand("setContext", "observable-kit.currentCellPinned", isPinned);
        }
    }

    static async build(uri?: vscode.Uri): Promise<void> {
        const targetUri = uri || vscode.window.activeTextEditor?.document.uri;

        if (!targetUri) {
            vscode.window.showErrorMessage("No file selected for build");
            return;
        }

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(targetUri);
        if (!workspaceFolder) {
            vscode.window.showErrorMessage("File must be in a workspace to build");
            return;
        }

        try {
            const hasNotebookKit = await Commands.checkNotebookKitInstallation(workspaceFolder);

            if (!hasNotebookKit) {
                const install = await vscode.window.showInformationMessage(
                    "Observable Notebook Kit is not installed. Install it now?",
                    "Install", "Cancel"
                );

                if (install === "Install") {
                    await Commands.installNotebookKit(workspaceFolder);
                } else {
                    return;
                }
            }

            // Run build command
            const terminal = vscode.window.createTerminal({
                name: "Observable Kit Build",
                cwd: workspaceFolder.uri.fsPath
            });

            terminal.sendText(`npx notebooks build --root ${path.dirname(targetUri.fsPath)} -- ${targetUri.fsPath}`);
            terminal.show();

        } catch (error) {
            vscode.window.showErrorMessage(`Build failed: ${error}`);
        }
    }

    static async createNotebook(): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

        if (!workspaceFolder) {
            vscode.window.showErrorMessage("Open a workspace to create a notebook");
            return;
        }

        const fileName = await vscode.window.showInputBox({
            prompt: "Enter notebook name",
            placeHolder: "my-notebook.onb.html"
        });

        if (!fileName) {
            return;
        }

        // Ensure proper extension
        let notebookName = fileName;
        if (!notebookName.endsWith(".onb.html")) {
            notebookName = `${fileName}.onb.html`;
        }

        const notebookPath = path.join(workspaceFolder.uri.fsPath, notebookName);

        // Extract base name for title
        const baseName = path.basename(fileName)
            .replace(".onb.html", "")
            .replace(".html", "");

        const notebookContent = `<!doctype html>
<notebook>
  <title>${baseName}</title>
  <script id="intro" type="text/markdown">
    # Welcome to Observable Notebook Kit

    This is a new notebook using the Observable Notebook Kit format.
  </script>
  <script id="hello" type="module">
    // Vanilla JavaScript with Observable functions
    const message = "Hello, Observable Notebook Kit!";
    display(message);
  </script>
</notebook>
`;

        try {
            fs.writeFileSync(notebookPath, notebookContent);
            const document = await vscode.workspace.openTextDocument(notebookPath);
            await vscode.window.showTextDocument(document);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create notebook: ${error}`);
        }
    }

    static async convertFromLegacy(uri?: vscode.Uri): Promise<void> {
        const targetUri = uri || vscode.window.activeTextEditor?.document.uri;

        if (!targetUri || !targetUri.path.endsWith(".ojsnb")) {
            vscode.window.showErrorMessage("Select a .ojsnb file to convert");
            return;
        }

        try {
            const document = await vscode.workspace.openTextDocument(targetUri);
            const content = document.getText();

            // Parse VSCode format
            const cells = Commands.parseVSCodeNotebook(content);

            // Convert to Observable Kit format
            const htmlContent = Commands.convertToObservableKitFormat(cells);

            // Save as Observable Kit HTML file
            const htmlPath = targetUri.fsPath.replace(".ojsnb", ".okit.html");
            fs.writeFileSync(htmlPath, htmlContent);

            const htmlDocument = await vscode.workspace.openTextDocument(htmlPath);
            await vscode.window.showTextDocument(htmlDocument);

            vscode.window.showInformationMessage(`Converted to ${path.basename(htmlPath)}`);

        } catch (error) {
            vscode.window.showErrorMessage(`Conversion failed: ${error}`);
        }
    }

    static async setupWorkspace(): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

        if (!workspaceFolder) {
            vscode.window.showErrorMessage("Open a workspace first");
            return;
        }

        try {
            await Commands.installNotebookKit(workspaceFolder);
            await Commands.setupPackageJson(workspaceFolder);

            vscode.window.showInformationMessage("Observable Notebook Kit setup complete!");

        } catch (error) {
            vscode.window.showErrorMessage(`Setup failed: ${error}`);
        }
    }

    private static async checkNotebookKitInstallation(workspaceFolder: vscode.WorkspaceFolder): Promise<boolean> {
        const packageJsonPath = path.join(workspaceFolder.uri.fsPath, "package.json");

        if (!fs.existsSync(packageJsonPath)) {
            return false;
        }

        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            return "@observablehq/notebook-kit" in deps;
        } catch {
            return false;
        }
    }

    private static async installNotebookKit(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {
        return new Promise((resolve, reject) => {
            const terminal = vscode.window.createTerminal({
                name: "Install Notebook Kit",
                cwd: workspaceFolder.uri.fsPath
            });

            terminal.sendText("npm install @observablehq/notebook-kit");

            // Note: In a real implementation, you'd want to monitor the terminal for completion
            setTimeout(() => resolve(), 5000);
        });
    }

    private static async setupPackageJson(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {
        const packageJsonPath = path.join(workspaceFolder.uri.fsPath, "package.json");

        let packageJson: any = {};

        if (fs.existsSync(packageJsonPath)) {
            packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
        } else {
            packageJson = {
                name: workspaceFolder.name,
                version: "1.0.0",
                private: true
            };
        }

        // Add scripts if they don't exist
        if (!packageJson.scripts) {
            packageJson.scripts = {};
        }

        if (!packageJson.scripts["docs:preview"]) {
            packageJson.scripts["docs:preview"] = "notebooks preview --root docs";
        }

        if (!packageJson.scripts["docs:build"]) {
            packageJson.scripts["docs:build"] = "notebooks build --root docs -- docs/*.html";
        }

        // Add dependencies
        if (!packageJson.dependencies) {
            packageJson.dependencies = {};
        }

        packageJson.dependencies["@observablehq/notebook-kit"] = "^1.0.1";

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    private static parseVSCodeNotebook(content: string): Array<{ id?: string, language: string, content: string }> {
        const cells: Array<{ id?: string, language: string, content: string }> = [];
        const cellRegex = /<VSCode\.Cell(?:\s+id="([^"]*)")?(?:\s+language="([^"]*)")?>([^]*?)<\/VSCode\.Cell>/g;

        let match;
        while ((match = cellRegex.exec(content)) !== null) {
            const [, id, language, cellContent] = match;
            cells.push({
                id,
                language: language || "javascript",
                content: cellContent.trim()
            });
        }

        return cells;
    }

    private static convertToObservableKitFormat(cells: Array<{ id?: string, language: string, content: string }>): string {
        let html = "<!doctype html>\n<notebook>\n";
        html += "  <title>Converted Notebook</title>\n";

        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const cellId = cell.id || `cell-${i + 1}`;

            let type: string;
            switch (cell.language) {
                case "markdown":
                    type = "text/markdown";
                    break;
                case "ojs":
                    type = "observablejs";
                    break;
                case "html":
                    type = "text/html";
                    break;
                case "css":
                    type = "text/css";
                    break;
                default:
                    type = "module";
            }

            html += `  <script id="${cellId}" type="${type}">\n`;

            // Indent cell content
            const indentedContent = cell.content
                .split("\n")
                .map(line => line ? `    ${line}` : "")
                .join("\n");

            html += indentedContent;
            html += "\n  </script>\n";
        }

        html += "</notebook>\n";
        return html;
    }

    static async pinCell(cell: vscode.NotebookCell): Promise<void> {
        if (!cell) {
            return;
        }

        const edit = new vscode.WorkspaceEdit();
        // Ensure pinned is explicitly boolean true
        const newMetadata = { ...cell.metadata, pinned: true };
        edit.set(cell.notebook.uri, [
            vscode.NotebookEdit.updateCellMetadata(cell.index, newMetadata)
        ]);

        await vscode.workspace.applyEdit(edit);

        // Update our custom context immediately
        await vscode.commands.executeCommand("setContext", "observable-kit.currentCellPinned", true);
    }

    static async unpinCell(cell: vscode.NotebookCell): Promise<void> {
        if (!cell) {
            return;
        }

        const edit = new vscode.WorkspaceEdit();
        // Set pinned to false instead of removing it to ensure proper context evaluation
        const newMetadata = { ...cell.metadata, pinned: false };
        edit.set(cell.notebook.uri, [
            vscode.NotebookEdit.updateCellMetadata(cell.index, newMetadata)
        ]);

        await vscode.workspace.applyEdit(edit);
    }
}

