import * as vscode from "vscode";
import * as path from "path";

/**
 * Service that detects if HTML files are Observable notebooks and handles opening them appropriately
 */
export class HTMLNotebookDetector {
    private _disposables: vscode.Disposable[] = [];

    constructor(private context: vscode.ExtensionContext) {
        this.registerCommands();
        this.registerFileOpenHandler();
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
        const scriptTypePattern = /<script[^>]+type\s*=\s*["']?(text\/markdown|observablejs|module)["']?[^>]*>/gi;
        const hasObservableScripts = scriptTypePattern.test(content);

        return hasObservableScripts;
    }

    /**
     * Register commands for switching between HTML and notebook views
     */
    private registerCommands(): void {
        // Command to open current HTML file as notebook
        const openAsNotebookCommand = vscode.commands.registerCommand(
            'observable-kit.openHtmlAsNotebook',
            async (uri?: vscode.Uri) => {
                const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
                if (targetUri) {
                    await this.openAsNotebook(targetUri);
                }
            }
        );

        // Command to switch HTML file to notebook view
        const switchToNotebookCommand = vscode.commands.registerCommand(
            'observable-kit.switchToNotebookView',
            async (uri?: vscode.Uri) => {
                const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
                if (targetUri) {
                    await this.switchToNotebookView(targetUri);
                }
            }
        );

        // Command to switch notebook back to HTML text view
        const switchToTextCommand = vscode.commands.registerCommand(
            'observable-kit.switchToTextView',
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
            const contentStr = Buffer.from(content).toString('utf8');

            if (!this.isObservableNotebook(contentStr)) {
                vscode.window.showWarningMessage('This HTML file is not an Observable notebook.');
                return;
            }

            try {
                // Open directly as notebook using the onb-notebook-kit serializer
                const document = await vscode.workspace.openNotebookDocument(uri);
                await vscode.window.showNotebookDocument(document);

                // Show message about notebook opening
                vscode.window.showInformationMessage(
                    `Opened as Observable notebook. You can switch back to text view using the toolbar button.`
                );

            } catch (error) {
                console.error('Failed to open as notebook:', error);
                // Fall back to opening original file as text
                const textDocument = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(textDocument);
            }

        } catch (error) {
            console.error('Error opening HTML as notebook:', error);
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
            const contentStr = Buffer.from(content).toString('utf8');

            if (!this.isObservableNotebook(contentStr)) {
                vscode.window.showWarningMessage('This HTML file is not an Observable notebook.');
                return;
            }

            // Close current text editor
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

            // Open directly as notebook
            const document = await vscode.workspace.openNotebookDocument(uri);
            await vscode.window.showNotebookDocument(document);

            // Show info message
            vscode.window.showInformationMessage(
                `Switched to notebook view. Use the text view button to switch back.`
            );

        } catch (error) {
            console.error('Error switching to notebook view:', error);
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
                vscode.window.showWarningMessage('No active notebook found.');
                return;
            }

            const notebookUri = activeNotebook.notebook.uri;

            // Close current notebook editor
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

            // Open as text document (same file, just different editor)
            const textDocument = await vscode.workspace.openTextDocument(notebookUri);
            await vscode.window.showTextDocument(textDocument);

        } catch (error) {
            console.error('Error switching to text view:', error);
            vscode.window.showErrorMessage(`Failed to switch to text view: ${error}`);
        }
    }

    /**
     * Register handler to intercept HTML file opens
     */
    private registerFileOpenHandler(): void {
        // Handle when files are opened via VS Code UI
        const openHandler = vscode.workspace.onDidOpenTextDocument(async (document) => {
            await this.handleDocumentOpen(document);
        });

        // Handle when editor selection changes (for already open documents)
        const changeHandler = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
            if (editor?.document) {
                await this.handleDocumentOpen(editor.document);
            }
        });

        this._disposables.push(openHandler, changeHandler);
    }

    private async handleDocumentOpen(document: vscode.TextDocument): Promise<void> {
        // Only check HTML files
        if (document.languageId === 'html' &&
            document.uri.scheme === 'file') {

            const content = document.getText();
            const isObservableNotebook = this.isObservableNotebook(content);

            // Set context key for VS Code UI
            await vscode.commands.executeCommand('setContext', 'observable-kit.isObservableNotebook', isObservableNotebook);
        } else {
            // Clear context key for non-HTML files
            await vscode.commands.executeCommand('setContext', 'observable-kit.isObservableNotebook', false);
        }
    }    /**
     * Dispose of all watchers and handlers
     */
    dispose(): void {
        this._disposables.forEach(d => d.dispose());
        this._disposables = [];
    }
}