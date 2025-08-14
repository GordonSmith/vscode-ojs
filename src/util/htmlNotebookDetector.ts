import * as vscode from "vscode";

/**
 * Service that detects if HTML files are Observable notebooks and handles opening them appropriately
 */
export class HTMLNotebookDetector {
    private _disposables: vscode.Disposable[] = [];

    constructor(private context: vscode.ExtensionContext) {
        this.registerCommands();
        this.registerFileOpenHandler();

        // Set context key immediately for current editor
        this.updateContextForActiveEditor();
    }

    /**
     * Check if HTML content contains Observable notebook format
     */
    private isObservableNotebook(content: string): boolean {
        // Must have both doctype and notebook element to be an Observable notebook
        const hasDoctype = /<!doctype\s+html>/i.test(content);
        const hasNotebookElement = /<notebook\b[^>]*>/i.test(content);

        if (!hasDoctype || !hasNotebookElement) {
            return false;
        }

        // Check for Observable-specific script types
        const scriptTypePattern = /<script[^>]+type\s*=\s*["']?(module|text\/markdown|text\/html|application\/sql|application\/x-tex|text\/vnd\.graphviz|application\/vnd\.observable\.javascript)["']?[^>]*>/gi;
        const hasObservableScripts = scriptTypePattern.test(content);

        return hasObservableScripts;
    }

    /**
     * Update context key for the currently active editor
     */
    private async updateContextForActiveEditor(): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            await this.handleDocumentOpen(activeEditor.document);
        } else {
            // No active editor, clear context
            await this.setContext(false);
        }
    }

    /**
     * Set the context key with proper error handling
     */
    private async setContext(isObservableNotebook: boolean): Promise<void> {
        try {
            // Small delay to ensure VS Code has finished processing the document
            await new Promise(resolve => setTimeout(resolve, 50));
            await vscode.commands.executeCommand("setContext", "observable-kit.isObservableNotebook", isObservableNotebook);
        } catch (error) {
            console.error("Failed to set context:", error);
        }
    }

    /**
     * Register commands for switching between HTML and notebook views
     */
    private registerCommands(): void {
        // Command to open current HTML file as notebook
        const openAsNotebookCommand = vscode.commands.registerCommand(
            "observable-kit.openHtmlAsNotebook",
            async (uri?: vscode.Uri) => {
                const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
                if (targetUri) {
                    await this.openAsNotebook(targetUri);
                }
            }
        );

        // Command to switch HTML file to notebook view
        const switchToNotebookCommand = vscode.commands.registerCommand(
            "observable-kit.switchToNotebookView",
            async (uri?: vscode.Uri) => {
                const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
                if (targetUri) {
                    await this.switchToNotebookView(targetUri);
                }
            }
        );

        // Command to switch notebook back to HTML text view
        const switchToTextCommand = vscode.commands.registerCommand(
            "observable-kit.switchToTextView",
            async () => {
                await this.switchToTextView();
            }
        );

        this._disposables.push(openAsNotebookCommand, switchToNotebookCommand, switchToTextCommand);
    }

    /**
     * Open a file as a notebook directly (no temp files needed)
     */
    private async openAsNotebook(uri: vscode.Uri): Promise<void> {
        try {
            // Read the file content to verify it's an Observable notebook
            const content = await vscode.workspace.fs.readFile(uri);
            const contentStr = Buffer.from(content).toString("utf8");

            if (!this.isObservableNotebook(contentStr)) {
                vscode.window.showWarningMessage("This HTML file is not an Observable notebook.");
                return;
            }

            try {
                // Open directly as notebook using the onb-notebook-kit serializer
                const document = await vscode.workspace.openNotebookDocument(uri);
                await vscode.window.showNotebookDocument(document);

                // Show message about notebook opening
                vscode.window.showInformationMessage(
                    "Opened as Observable notebook. Both text and notebook views are available."
                );

            } catch (error) {
                console.error("Failed to open as notebook:", error);
                // Fall back to opening original file as text
                const textDocument = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(textDocument);
            }

        } catch (error) {
            console.error("Error opening HTML as notebook:", error);
            vscode.window.showErrorMessage(`Failed to open file: ${error}`);
        }
    }

    /**
     * Switch HTML file to notebook view (used by toolbar button)
     */
    private async switchToNotebookView(uri: vscode.Uri): Promise<void> {
        try {
            // Read the file content to verify it's an Observable notebook
            const content = await vscode.workspace.fs.readFile(uri);
            const contentStr = Buffer.from(content).toString("utf8");

            if (!this.isObservableNotebook(contentStr)) {
                vscode.window.showWarningMessage("This HTML file is not an Observable notebook.");
                return;
            }

            // Open as notebook in a new editor (keep existing text editor open)
            const document = await vscode.workspace.openNotebookDocument(uri);
            await vscode.window.showNotebookDocument(document);

            // Show info message
            vscode.window.showInformationMessage(
                "Opened notebook view. Both text and notebook views are now available."
            );

        } catch (error) {
            console.error("Error switching to notebook view:", error);
            vscode.window.showErrorMessage(`Failed to switch to notebook view: ${error}`);
        }
    }    /**
     * Switch notebook back to HTML text view (used by toolbar button)
     */
    private async switchToTextView(): Promise<void> {
        try {
            // Get the current notebook document
            const activeNotebook = vscode.window.activeNotebookEditor;
            if (!activeNotebook) {
                vscode.window.showWarningMessage("No active notebook found.");
                return;
            }

            const notebookUri = activeNotebook.notebook.uri;

            // Open as text document in a new editor (keep existing notebook editor open)
            const textDocument = await vscode.workspace.openTextDocument(notebookUri);
            await vscode.window.showTextDocument(textDocument);

            // Show info message
            vscode.window.showInformationMessage(
                "Opened text view. Both notebook and text views are now available."
            );

        } catch (error) {
            console.error("Error switching to text view:", error);
            vscode.window.showErrorMessage(`Failed to switch to text view: ${error}`);
        }
    }

    /**
     * Register handler to intercept HTML file opens
     */
    private registerFileOpenHandler(): void {
        // Handle when files are opened via VS Code UI
        const openHandler = vscode.workspace.onDidOpenTextDocument(async (document) => {
            // Only process HTML files to avoid unnecessary context updates
            if (document.languageId === "html") {
                await this.handleDocumentOpen(document);
            }
        });

        // Handle when editor selection changes (for already open documents)
        const changeHandler = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
            if (editor) {
                // Only update context if the active editor is an HTML file
                if (editor.document.languageId === "html") {
                    await this.handleDocumentOpen(editor.document);
                } else {
                    // Clear context when switching away from HTML files
                    await this.setContext(false);
                }
            } else {
                // No active editor, clear context
                await this.setContext(false);
            }
        });

        // Handle notebook editor changes to clear HTML context when notebook is active
        const notebookChangeHandler = vscode.window.onDidChangeActiveNotebookEditor(async (editor) => {
            if (editor && editor.notebook.notebookType === "onb-notebook-kit") {
                // When a notebook is active, clear the HTML context to show the text view button
                await this.setContext(false);
            }
        });

        // Also handle the currently active editor when the extension starts
        if (vscode.window.activeTextEditor) {
            this.handleDocumentOpen(vscode.window.activeTextEditor.document);
        }

        this._disposables.push(openHandler, changeHandler, notebookChangeHandler);
    }

    private async handleDocumentOpen(document: vscode.TextDocument): Promise<void> {
        // Only process HTML files from the file system
        if (document.languageId === "html" && document.uri.scheme === "file") {
            try {
                const content = document.getText();
                const isObservableNotebook = this.isObservableNotebook(content);

                // Set context key for VS Code UI
                await this.setContext(isObservableNotebook);
            } catch (error) {
                console.error("Error checking Observable notebook:", error);
                await this.setContext(false);
            }
        } else if (document.languageId !== "html") {
            // Only clear context for non-HTML files to avoid interfering with HTML processing
            await this.setContext(false);
        }
        // For HTML files that are not from file system (e.g., untitled), we don't change the context
    }    /**
     * Dispose of all watchers and handlers
     */
    dispose(): void {
        this._disposables.forEach(d => d.dispose());
        this._disposables = [];
    }
}