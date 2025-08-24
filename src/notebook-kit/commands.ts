import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export class Commands {

    private static _ctx: vscode.ExtensionContext;
    private static _titleStatusBarItem: vscode.StatusBarItem | undefined;
    private static _themeStatusBarItem: vscode.StatusBarItem | undefined;

    static attach(ctx: vscode.ExtensionContext) {
        Commands._ctx = ctx;
        ctx.subscriptions.push(
            vscode.commands.registerCommand("observable-kit.build", Commands.build),
            vscode.commands.registerCommand("observable-kit.createNotebook", Commands.createNotebook),
            vscode.commands.registerCommand("observable-kit.convertFromLegacy", Commands.convertFromLegacy),
            vscode.commands.registerCommand("observable-kit.setupWorkspace", Commands.setupWorkspace),
            vscode.commands.registerCommand("observable-kit.notebook.setTitle", Commands.setNotebookTitle),
            vscode.commands.registerCommand("observable-kit.notebook.setTheme", Commands.setNotebookTheme),
            vscode.commands.registerCommand("observable-kit.notebook.setReadOnly", Commands.setNotebookReadOnly),
            vscode.commands.registerCommand("observable-kit.notebook.setReadWrite", Commands.setNotebookReadWrite),
            vscode.commands.registerCommand("observable-kit.cell.pin", Commands.pinCell),
            vscode.commands.registerCommand("observable-kit.cell.unpin", Commands.unpinCell),
            vscode.commands.registerCommand("observable-kit.cell.hide", Commands.hideCell),
            vscode.commands.registerCommand("observable-kit.cell.show", Commands.showCell),
        );

        // Status bar item to show current notebook title (toolbar command text cannot be dynamic)
        Commands._titleStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        Commands._titleStatusBarItem.command = "observable-kit.notebook.setTitle";
        ctx.subscriptions.push(Commands._titleStatusBarItem);
        // Status bar item for theme
        Commands._themeStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
        Commands._themeStatusBarItem.command = "observable-kit.notebook.setTheme";
        ctx.subscriptions.push(Commands._themeStatusBarItem);

        // Handle cell selection changes to update pin context
        ctx.subscriptions.push(vscode.window.onDidChangeNotebookEditorSelection(e => {
            Commands.updateCellContexts(e.notebookEditor);
        }));

        // Handle when a different notebook becomes active
        ctx.subscriptions.push(
            vscode.window.onDidChangeActiveNotebookEditor(e => {
                if (e) {
                    Commands.updateCellContexts(e);
                }
            })
        );

        // Track notebook document metadata changes to update read-only context
        ctx.subscriptions.push(vscode.workspace.onDidChangeNotebookDocument(e => {
            if (e.notebook.notebookType === "notebook-kit") {
                // Metadata changes show up with 'metadata' property on the event
                Commands.setNotebookReadOnlyContext(e.notebook.metadata?.readOnly === true);
                if (vscode.window.activeNotebookEditor?.notebook === e.notebook) {
                    Commands.updateNotebookTitleStatusBar(e.notebook);
                    Commands.updateNotebookThemeStatusBar(e.notebook);
                }
            }
        }));

        // Initialize contexts if an editor is already active
        if (vscode.window.activeNotebookEditor) {
            Commands.updateCellContexts(vscode.window.activeNotebookEditor);
            Commands.updateNotebookTitleStatusBar(vscode.window.activeNotebookEditor.notebook);
            Commands.updateNotebookThemeStatusBar(vscode.window.activeNotebookEditor.notebook);
        }

        ctx.subscriptions.push(vscode.window.onDidChangeActiveNotebookEditor(editor => {
            if (editor) {
                Commands.updateNotebookTitleStatusBar(editor.notebook);
                Commands.updateNotebookThemeStatusBar(editor.notebook);
            } else {
                Commands._titleStatusBarItem?.hide();
                Commands._themeStatusBarItem?.hide();
            }
        }));
    }

    // --- Notebook-level metadata edits ------------------------------------------------

    static async setNotebookTitle(): Promise<void> {
        const editor = vscode.window.activeNotebookEditor;
        if (!editor || editor.notebook.notebookType !== "notebook-kit") {
            vscode.window.showErrorMessage("No Observable Notebook active");
            return;
        }
        const current: string = (editor.notebook.metadata?.title as string) || "";
        const value = await vscode.window.showInputBox({
            prompt: "Notebook Title",
            value: current,
            placeHolder: "Enter notebook title"
        });
        if (value === undefined) { // cancelled
            return;
        }
        await Commands.applyNotebookMetadataEdit(editor.notebook, { title: value.trim() || "Untitled Notebook" });
        Commands.updateNotebookTitleStatusBar(editor.notebook);
    }

    static async setNotebookTheme(): Promise<void> {
        const editor = vscode.window.activeNotebookEditor;
        if (!editor || editor.notebook.notebookType !== "notebook-kit") {
            vscode.window.showErrorMessage("No Observable Notebook active");
            return;
        }
        const themes = [
            "air",
            "coffee",
            "cotton",
            "deep-space",
            "glacier",
            "ink",
            "midnight",
            "near-midnight",
            "ocean-floor",
            "parchment",
            "slate",
            "stark",
            "sun-faded"
        ];
        const current: string = (editor.notebook.metadata?.theme as string) || "air";
        const theme = await vscode.window.showQuickPick(themes, {
            title: "Select Notebook Theme",
            placeHolder: current,
            canPickMany: false
        });
        if (!theme) {
            return;
        }
        await Commands.applyNotebookMetadataEdit(editor.notebook, { theme });
        Commands.updateNotebookThemeStatusBar(editor.notebook);
    }

    static async setNotebookReadOnly(): Promise<void> {
        const editor = vscode.window.activeNotebookEditor;
        if (!editor || editor.notebook.notebookType !== "notebook-kit") {
            vscode.window.showErrorMessage("No Observable Notebook active");
            return;
        }
        if (editor.notebook.metadata?.readOnly === true) {
            return; // already read-only
        }
        await Commands.applyNotebookMetadataEdit(editor.notebook, { readOnly: true });
        vscode.window.showInformationMessage("Notebook set to read-only.");
    }

    static async setNotebookReadWrite(): Promise<void> {
        const editor = vscode.window.activeNotebookEditor;
        if (!editor || editor.notebook.notebookType !== "notebook-kit") {
            vscode.window.showErrorMessage("No Observable Notebook active");
            return;
        }
        if (editor.notebook.metadata?.readOnly !== true) {
            return; // already read/write
        }
        await Commands.applyNotebookMetadataEdit(editor.notebook, { readOnly: false });
        vscode.window.showInformationMessage("Notebook set to read/write.");
    }

    private static async applyNotebookMetadataEdit(notebook: vscode.NotebookDocument, patch: Record<string, unknown>): Promise<void> {
        const edit = new vscode.WorkspaceEdit();
        const newMetadata = { ...notebook.metadata, ...patch };
        edit.set(notebook.uri, [vscode.NotebookEdit.updateNotebookMetadata(newMetadata)]);
        await vscode.workspace.applyEdit(edit);
        if (Object.prototype.hasOwnProperty.call(patch, "readOnly")) {
            Commands.setNotebookReadOnlyContext(!!(patch as any).readOnly);
        }
    }

    private static updateCellContexts(editor: vscode.NotebookEditor): void {
        if (editor.notebook.notebookType === "notebook-kit" && editor.selections.length > 0) {
            const cell = editor.notebook.cellAt(editor.selections[0].start);
            const isPinned: boolean = cell.metadata?.pinned === true;
            const isHidden: boolean = cell.metadata?.hidden === true;
            vscode.commands.executeCommand("setContext", "observable-kit.currentCellPinned", isPinned);
            vscode.commands.executeCommand("setContext", "observable-kit.currentCellHidden", isHidden);
            Commands.setNotebookReadOnlyContext(editor.notebook.metadata?.readOnly === true);
        }
    }

    private static setNotebookReadOnlyContext(readOnly: boolean): void {
        vscode.commands.executeCommand("setContext", "observable-kit.notebook.readOnly", readOnly);
    }

    private static updateNotebookTitleStatusBar(notebook: vscode.NotebookDocument): void {
        if (!Commands._titleStatusBarItem) return;
        if (notebook.notebookType !== "notebook-kit") {
            Commands._titleStatusBarItem.hide();
            return;
        }
        const title = (notebook.metadata?.title as string) || "Untitled Notebook";
        const truncated = title.length > 60 ? title.slice(0, 57) + "…" : title;
        Commands._titleStatusBarItem.text = `$(book) ${truncated}`;
        Commands._titleStatusBarItem.tooltip = `Notebook title: ${title}\nClick to rename`;
        Commands._titleStatusBarItem.show();
    }

    private static updateNotebookThemeStatusBar(notebook: vscode.NotebookDocument): void {
        if (!Commands._themeStatusBarItem) return;
        if (notebook.notebookType !== "notebook-kit") {
            Commands._themeStatusBarItem.hide();
            return;
        }
        const theme = (notebook.metadata?.theme as string) || "air";
        Commands._themeStatusBarItem.text = `$(symbol-color) ${theme}`;
        Commands._themeStatusBarItem.tooltip = `Notebook theme: ${theme}\nClick to change`;
        Commands._themeStatusBarItem.show();
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
                    "ObservableHQ Notebook is not installed. Install it now?",
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
            placeHolder: "my-notebook.html"
        });

        if (!fileName) {
            return;
        }

        let notebookName = fileName;
        if (!notebookName.endsWith(".html")) {
            notebookName = `${fileName}.html`;
        }

        const notebookPath = path.join(workspaceFolder.uri.fsPath, notebookName);

        const baseName = path.basename(fileName)
            .replace(".html", "");

        const notebookContent = `\
<!doctype html>
<notebook>
  <title>${baseName}</title>
  <script id="1" type="text/markdown">
    # Welcome to ObservableHQ Notebook

    This is a new notebook using the ObservableHQ Notebook format.
  </script>
  <script id="2" type="module">
    const message = "Hello, ObservableHQ Notebook!";
    display(message);
  </script>
  <script type="text/html">
    <h1>Hello, <i>world</i>!</h1>
  </script>
  <script type="application/sql" database="reporting">
    SELECT * FROM customers
  </script>
  <script type="application/x-tex">
    \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
  </script>
  <script type="text/vnd.graphviz">
    digraph G {
        A -> B -> C;
        A -> C;
    }
  </script>
  <script type="application/vnd.observable.javascript">
    foo = 42
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

            vscode.window.showInformationMessage("ObservableHQ Notebook setup complete!");

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
        const newMetadata = { ...cell.metadata, pinned: true };
        edit.set(cell.notebook.uri, [
            vscode.NotebookEdit.updateCellMetadata(cell.index, newMetadata)
        ]);

        await vscode.workspace.applyEdit(edit);
        await vscode.commands.executeCommand("setContext", "observable-kit.currentCellPinned", true);
    }

    static async unpinCell(cell: vscode.NotebookCell): Promise<void> {
        if (!cell) {
            return;
        }

        const edit = new vscode.WorkspaceEdit();
        const newMetadata = { ...cell.metadata, pinned: false };
        edit.set(cell.notebook.uri, [
            vscode.NotebookEdit.updateCellMetadata(cell.index, newMetadata)
        ]);

        await vscode.workspace.applyEdit(edit);
        await vscode.commands.executeCommand("setContext", "observable-kit.currentCellPinned", false);
    }

    static async hideCell(cell: vscode.NotebookCell): Promise<void> {
        if (!cell) {
            return;
        }

        const edit = new vscode.WorkspaceEdit();
        const newMetadata = { ...cell.metadata, hidden: true };
        edit.set(cell.notebook.uri, [
            vscode.NotebookEdit.updateCellMetadata(cell.index, newMetadata)
        ]);

        await vscode.workspace.applyEdit(edit);
        await vscode.commands.executeCommand("setContext", "observable-kit.currentCellHidden", true);
    }

    static async showCell(cell: vscode.NotebookCell): Promise<void> {
        if (!cell) {
            return;
        }

        const edit = new vscode.WorkspaceEdit();
        const newMetadata = { ...cell.metadata, hidden: false };
        edit.set(cell.notebook.uri, [
            vscode.NotebookEdit.updateCellMetadata(cell.index, newMetadata)
        ]);

        await vscode.workspace.applyEdit(edit);
        await vscode.commands.executeCommand("setContext", "observable-kit.currentCellHidden", false);
    }
}

