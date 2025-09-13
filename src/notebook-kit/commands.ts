import * as vscode from "vscode";
import { NOTEBOOK_THEMES } from "./common/types";
import { isObservableNotebook, isObservableHTMLNotebook } from "./common/notebook-detector";
import { DECL, html2notebook, type Notebook, notebook2js } from "./compiler";
import { isNotebookKitType } from "./common/notebook-detector";

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
            vscode.commands.registerCommand("observable-kit.export", Commands.export),
            vscode.commands.registerCommand("observable-kit.openHtmlAsNotebook", Commands.openHtmlAsNotebook),
            vscode.commands.registerCommand("observable-kit.switchToNotebookView", Commands.switchToNotebookView),
            vscode.commands.registerCommand("observable-kit.switchToTextView", Commands.switchToTextView),
            vscode.commands.registerCommand("observable-kit.notebook.setTitle", Commands.setNotebookTitle),
            vscode.commands.registerCommand("observable-kit.notebook.setTheme", Commands.setNotebookTheme),
            vscode.commands.registerCommand("observable-kit.notebook.setReadOnly", Commands.setNotebookReadOnly),
            vscode.commands.registerCommand("observable-kit.notebook.setReadWrite", Commands.setNotebookReadWrite),
            vscode.commands.registerCommand("observable-kit.cell.pin", Commands.pinCell),
            vscode.commands.registerCommand("observable-kit.cell.unpin", Commands.unpinCell),
            vscode.commands.registerCommand("observable-kit.cell.hide", Commands.hideCell),
            vscode.commands.registerCommand("observable-kit.cell.show", Commands.showCell),
            vscode.commands.registerCommand("observable-kit.cell.setNodeMode", Commands.setNodeMode),
            vscode.commands.registerCommand("observable-kit.cell.setJsMode", Commands.setJsMode),
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
            if (isNotebookKitType(e.notebook.notebookType)) {
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
    static async export(uri?: vscode.Uri): Promise<void> {
        const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
        if (!targetUri) {
            vscode.window.showErrorMessage("No file selected to export");
            return;
        }

        try {
            const contentBytes = await vscode.workspace.fs.readFile(targetUri);
            const contentStr = Buffer.from(contentBytes).toString("utf8");

            // Optionally validate it's an Observable Notebook HTML
            if (!isObservableNotebook(contentStr)) {
                const proceed = await vscode.window.showWarningMessage(
                    "This file does not look like an Observable Notebook. Try exporting anyway?",
                    { modal: true },
                    "Export",
                    "Cancel"
                );
                if (proceed !== "Export") return;
            }

            let notebook: Notebook;
            try {
                notebook = html2notebook(contentStr);
            } catch (err) {
                vscode.window.showErrorMessage(`Failed to parse HTML notebook: ${err}`);
                return;
            }

            const jsPath = targetUri.path.toLowerCase().endsWith(".observable.html") ? targetUri.path.slice(0, -5) + ".js" :
                targetUri.path.toLowerCase().endsWith(".html") ? targetUri.path.slice(0, -5) + ".observable.js" :
                    undefined;
            if (!jsPath) return;

            const jsUri = targetUri.with({ path: jsPath });
            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: jsUri,
                saveLabel: "Export to JS"
            });
            if (!saveUri) return;

            try {
                const compiledJs = notebook2js(notebook);
                await vscode.workspace.fs.writeFile(saveUri, new TextEncoder().encode(compiledJs));
                const declPath = jsPath.replace(/\.observable\.js$/, ".observable.d.ts");
                const declUri = jsUri.with({ path: declPath });
                await vscode.workspace.fs.writeFile(declUri, new TextEncoder().encode(DECL));
            } catch (err) {
                // If compilation fails, surface an info message but still succeed in main export
                vscode.window.showWarningMessage("Export failed: " + err);
            }

            try {
                const doc = await vscode.workspace.openTextDocument(saveUri);
                await vscode.window.showTextDocument(doc);
            } catch {
                // ignore open errors
            }

            vscode.window.showInformationMessage(`Exported notebook to ${Commands.basename(saveUri.path)}`);
        } catch (error) {
            console.error("Export failed:", error);
            vscode.window.showErrorMessage(`Export failed: ${error}`);
        }

    }

    static async openHtmlAsNotebook(uri?: vscode.Uri): Promise<void> {
        const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
        if (!targetUri) return;
        try {
            const contentBytes = await vscode.workspace.fs.readFile(targetUri);
            const contentStr = Buffer.from(contentBytes).toString("utf8");
            if (!isObservableHTMLNotebook(contentStr)) {
                vscode.window.showWarningMessage("This HTML file is not an Observable notebook.");
                return;
            }
            try {
                const document = await vscode.workspace.openNotebookDocument(targetUri);
                await vscode.window.showNotebookDocument(document);
                vscode.window.showInformationMessage("Opened as Observable notebook. Both text and notebook views are available.");
            } catch (error) {
                console.error("Failed to open as notebook:", error);
                const textDocument = await vscode.workspace.openTextDocument(targetUri);
                await vscode.window.showTextDocument(textDocument);
            }
        } catch (error) {
            console.error("Error opening HTML as notebook:", error);
            vscode.window.showErrorMessage(`Failed to open file: ${error}`);
        }
    }

    static async switchToNotebookView(uri?: vscode.Uri): Promise<void> {
        const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
        if (!targetUri) return;
        try {
            const contentBytes = await vscode.workspace.fs.readFile(targetUri);
            const contentStr = Buffer.from(contentBytes).toString("utf8");
            if (!isObservableNotebook(contentStr)) {
                vscode.window.showWarningMessage("This file is not an Observable notebook.");
                return;
            }
            const document = await vscode.workspace.openNotebookDocument(targetUri);
            await vscode.window.showNotebookDocument(document);
        } catch (error) {
            console.error("Error switching to notebook view:", error);
            vscode.window.showErrorMessage(`Failed to switch to notebook view: ${error}`);
        }
    }

    static async switchToTextView(): Promise<void> {
        try {
            const activeNotebook = vscode.window.activeNotebookEditor;
            if (!activeNotebook) {
                vscode.window.showWarningMessage("No active notebook found.");
                return;
            }
            const notebookUri = activeNotebook.notebook.uri;
            const textDocument = await vscode.workspace.openTextDocument(notebookUri);
            await vscode.window.showTextDocument(textDocument);
        } catch (error) {
            console.error("Error switching to text view:", error);
            vscode.window.showErrorMessage(`Failed to switch to text view: ${error}`);
        }
    }

    static async setNotebookTitle(): Promise<void> {
        const editor = vscode.window.activeNotebookEditor;
        if (!editor || !isNotebookKitType(editor.notebook.notebookType)) {
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
        if (!editor || !isNotebookKitType(editor.notebook.notebookType)) {
            vscode.window.showErrorMessage("No Observable Notebook active");
            return;
        }
        const current: string = (editor.notebook.metadata?.theme as string) || "air";
        const theme = await vscode.window.showQuickPick(NOTEBOOK_THEMES, {
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
        if (!editor || !isNotebookKitType(editor.notebook.notebookType)) {
            vscode.window.showErrorMessage("No Observable Notebook active");
            return;
        }
        if (editor.notebook.metadata?.readOnly === true) {
            return; // already read-only
        }
        await Commands.applyNotebookMetadataEdit(editor.notebook, { readOnly: true });
    }

    static async setNotebookReadWrite(): Promise<void> {
        const editor = vscode.window.activeNotebookEditor;
        if (!editor || !isNotebookKitType(editor.notebook.notebookType)) {
            vscode.window.showErrorMessage("No Observable Notebook active");
            return;
        }
        if (editor.notebook.metadata?.readOnly !== true) {
            return; // already read/write
        }
        await Commands.applyNotebookMetadataEdit(editor.notebook, { readOnly: false });
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
        if (isNotebookKitType(editor.notebook.notebookType) && editor.selections.length > 0) {
            const cell = editor.notebook.cellAt(editor.selections[0].start);
            const isPinned: boolean = cell.metadata?.pinned === true;
            const isHidden: boolean = cell.metadata?.hidden === true;
            vscode.commands.executeCommand("setContext", "observable-kit.currentCellPinned", isPinned);
            vscode.commands.executeCommand("setContext", "observable-kit.currentCellHidden", isHidden);
            vscode.commands.executeCommand("setContext", "observable-kit.cellMode", cell.metadata?.mode);
            Commands.setNotebookReadOnlyContext(editor.notebook.metadata?.readOnly === true);
        }
    }

    private static setNotebookReadOnlyContext(readOnly: boolean): void {
        vscode.commands.executeCommand("setContext", "observable-kit.notebook.readOnly", readOnly);
    }

    private static updateNotebookTitleStatusBar(notebook: vscode.NotebookDocument): void {
        if (!Commands._titleStatusBarItem) return;
        if (!isNotebookKitType(notebook.notebookType)) {
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
        if (!isNotebookKitType(notebook.notebookType)) {
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

            terminal.sendText(`npx notebooks build --root ${Commands.dirnameFsPath(targetUri.fsPath)} -- ${targetUri.fsPath}`);
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

        const notebookUri = vscode.Uri.joinPath(workspaceFolder.uri, notebookName);

        const baseName = Commands.basename(fileName)
            .replace(/\.html$/i, "");

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
            await vscode.workspace.fs.writeFile(notebookUri, new TextEncoder().encode(notebookContent));
            const document = await vscode.workspace.openTextDocument(notebookUri);
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
            const htmlUri = targetUri.with({ path: targetUri.path.replace(/\.ojsnb$/i, ".okit.html") });
            await vscode.workspace.fs.writeFile(htmlUri, new TextEncoder().encode(htmlContent));

            const htmlDocument = await vscode.workspace.openTextDocument(htmlUri);
            await vscode.window.showTextDocument(htmlDocument);
            vscode.window.showInformationMessage(`Converted to ${Commands.basename(htmlUri.path)}`);

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
        const packageJsonUri = vscode.Uri.joinPath(workspaceFolder.uri, "package.json");

        let exists = true;
        try {
            await vscode.workspace.fs.stat(packageJsonUri);
        } catch {
            exists = false;
        }
        if (!exists) {
            return false;
        }

        try {
            const bytes = await vscode.workspace.fs.readFile(packageJsonUri);
            const packageJson = JSON.parse(Buffer.from(bytes).toString("utf8"));
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
        const packageJsonUri = vscode.Uri.joinPath(workspaceFolder.uri, "package.json");
        let packageJson: any = {};

        let exists = true;
        try {
            await vscode.workspace.fs.stat(packageJsonUri);
        } catch {
            exists = false;
        }

        if (exists) {
            const bytes = await vscode.workspace.fs.readFile(packageJsonUri);
            packageJson = JSON.parse(Buffer.from(bytes).toString("utf8"));
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

        await vscode.workspace.fs.writeFile(packageJsonUri, new TextEncoder().encode(JSON.stringify(packageJson, null, 2)));
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
        if (!cell) return;

        const edit = new vscode.WorkspaceEdit();
        const newMetadata = { ...cell.metadata, pinned: true };
        edit.set(cell.notebook.uri, [
            vscode.NotebookEdit.updateCellMetadata(cell.index, newMetadata)
        ]);

        await vscode.commands.executeCommand("setContext", "observable-kit.currentCellPinned", true);
        await vscode.workspace.applyEdit(edit);
    }

    static async unpinCell(cell: vscode.NotebookCell): Promise<void> {
        if (!cell) return;

        const edit = new vscode.WorkspaceEdit();
        const newMetadata = { ...cell.metadata, pinned: false };
        edit.set(cell.notebook.uri, [
            vscode.NotebookEdit.updateCellMetadata(cell.index, newMetadata)
        ]);

        await vscode.commands.executeCommand("setContext", "observable-kit.currentCellPinned", false);
        await vscode.workspace.applyEdit(edit);
    }

    static async hideCell(cell: vscode.NotebookCell): Promise<void> {
        if (!cell) return;

        const edit = new vscode.WorkspaceEdit();
        const newMetadata = { ...cell.metadata, hidden: true };
        edit.set(cell.notebook.uri, [
            vscode.NotebookEdit.updateCellMetadata(cell.index, newMetadata)
        ]);

        await vscode.commands.executeCommand("setContext", "observable-kit.currentCellHidden", true);
        await vscode.workspace.applyEdit(edit);
    }

    static async showCell(cell: vscode.NotebookCell): Promise<void> {
        if (!cell) return;

        const edit = new vscode.WorkspaceEdit();
        const newMetadata = { ...cell.metadata, hidden: false };
        edit.set(cell.notebook.uri, [
            vscode.NotebookEdit.updateCellMetadata(cell.index, newMetadata)
        ]);

        await vscode.commands.executeCommand("setContext", "observable-kit.currentCellHidden", false);
        await vscode.workspace.applyEdit(edit);
    }

    static async setNodeMode(cell: vscode.NotebookCell): Promise<void> {
        if (!cell) return;

        const edit = new vscode.WorkspaceEdit();
        const newMetadata = { ...cell.metadata, mode: "node" };
        edit.set(cell.notebook.uri, [
            vscode.NotebookEdit.updateCellMetadata(cell.index, newMetadata)
        ]);
        await vscode.commands.executeCommand("setContext", "observable-kit.cellMode", "node");
        await vscode.workspace.applyEdit(edit);
    }

    static async setJsMode(cell: vscode.NotebookCell): Promise<void> {
        if (!cell) return;

        const edit = new vscode.WorkspaceEdit();
        const newMetadata = { ...cell.metadata, mode: "js" };
        edit.set(cell.notebook.uri, [
            vscode.NotebookEdit.updateCellMetadata(cell.index, newMetadata)
        ]);
        await vscode.commands.executeCommand("setContext", "observable-kit.cellMode", "js");
        await vscode.workspace.applyEdit(edit);
    }
}

// --- Local path utilities (avoid node:path to prefer VS Code APIs) ------------------
export namespace Commands { // augmentation for helper functions
    /** Return directory portion of a filesystem path (platform agnostic). */
    export function dirnameFsPath(fsPath: string): string {
        return fsPath.replace(/[\\/][^\\/]*$/, "");
    }
    /** Return basename (filename + extension) of a path. */
    export function basename(p: string): string {
        const parts = p.split(/[\\/]/);
        return parts[parts.length - 1] || p;
    }
}

