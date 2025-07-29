import * as vscode from "vscode";
import { OBSERVABLE_KIT_MIME } from "./serializer";

export class NotebookKitController {
    readonly controllerId = "observable-kit-kernel";
    readonly notebookType = "observable-kit-notebook";
    readonly label = "Observable Notebook Kit";
    readonly supportedLanguages = ["javascript", "ojs", "markdown", "html", "css"];

    private readonly _controller: vscode.NotebookController;
    private _executionOrder = 0;

    constructor() {
        this._controller = vscode.notebooks.createNotebookController(
            this.controllerId,
            this.notebookType,
            this.label
        );

        this._controller.supportedLanguages = this.supportedLanguages;
        this._controller.supportsExecutionOrder = true;
        this._controller.executeHandler = this.execute.bind(this);

        // Handle notebook document changes
        vscode.workspace.onDidChangeNotebookDocument(evt => {
            for (const contentChange of evt.contentChanges) {
                for (const removed of contentChange.removedCells) {
                    const execution = this._controller.createNotebookCellExecution(removed);
                    execution.executionOrder = ++this._executionOrder;
                    execution.start(Date.now());
                    execution.clearOutput(removed);
                    execution.end(true, Date.now());
                }
            }
        });
    }

    dispose() {
        this._controller.dispose();
    }

    private async execute(
        cells: vscode.NotebookCell[],
        notebook: vscode.NotebookDocument,
        controller: vscode.NotebookController
    ): Promise<void> {
        for (const cell of cells) {
            await this.executeCell(cell, notebook);
        }
    }

    private async executeCell(
        cell: vscode.NotebookCell,
        notebook: vscode.NotebookDocument
    ): Promise<void> {
        const execution = this._controller.createNotebookCellExecution(cell);
        execution.executionOrder = ++this._executionOrder;
        execution.start(Date.now());

        try {
            const output = await this.executeCellContent(cell, notebook);
            if (output) {
                await execution.replaceOutput([output]);
            }
            execution.end(true, Date.now());
        } catch (error) {
            const errorOutput = new vscode.NotebookCellOutput([
                vscode.NotebookCellOutputItem.error(error as Error)
            ]);
            await execution.replaceOutput([errorOutput]);
            execution.end(false, Date.now());
        }
    }

    private async executeCellContent(
        cell: vscode.NotebookCell,
        notebook: vscode.NotebookDocument
    ): Promise<vscode.NotebookCellOutput | undefined> {
        const cellText = cell.document.getText();

        switch (cell.document.languageId) {
            case 'markdown':
                return this.executeMarkdownCell(cellText);

            case 'javascript':
                return this.executeVanillaJavaScriptCell(cellText, cell, notebook);

            case 'ojs':
                return this.executeObservableJSCell(cellText, cell, notebook);

            case 'html':
                return this.executeHTMLCell(cellText);

            case 'css':
                return this.executeCSSCell(cellText);

            default:
                return this.executeGenericCell(cellText, cell.document.languageId);
        }
    }

    private executeMarkdownCell(content: string): vscode.NotebookCellOutput {
        // For markdown cells, we'll render them as HTML
        const htmlContent = this.markdownToHTML(content);
        return new vscode.NotebookCellOutput([
            vscode.NotebookCellOutputItem.text(htmlContent, 'text/html')
        ]);
    }

    private async executeVanillaJavaScriptCell(
        content: string,
        cell: vscode.NotebookCell,
        notebook: vscode.NotebookDocument
    ): Promise<vscode.NotebookCellOutput> {
        // Transform vanilla JS with Observable Kit functions
        const transformedCode = this.transformVanillaJavaScript(content);

        // Create output that will be handled by the renderer
        const outputData = {
            type: 'vanilla-javascript',
            code: transformedCode,
            originalCode: content,
            cellId: cell.metadata?.id,
            notebookId: notebook.metadata?.id
        };

        return new vscode.NotebookCellOutput([
            vscode.NotebookCellOutputItem.json(outputData, OBSERVABLE_KIT_MIME)
        ]);
    }

    private async executeObservableJSCell(
        content: string,
        cell: vscode.NotebookCell,
        notebook: vscode.NotebookDocument
    ): Promise<vscode.NotebookCellOutput> {
        // Handle legacy Observable JavaScript
        const outputData = {
            type: 'observable-javascript',
            code: content,
            cellId: cell.metadata?.id,
            notebookId: notebook.metadata?.id
        };

        return new vscode.NotebookCellOutput([
            vscode.NotebookCellOutputItem.json(outputData, OBSERVABLE_KIT_MIME)
        ]);
    }

    private executeHTMLCell(content: string): vscode.NotebookCellOutput {
        return new vscode.NotebookCellOutput([
            vscode.NotebookCellOutputItem.text(content, 'text/html')
        ]);
    }

    private executeCSSCell(content: string): vscode.NotebookCellOutput {
        const htmlWithStyle = `<style>${content}</style>`;
        return new vscode.NotebookCellOutput([
            vscode.NotebookCellOutputItem.text(htmlWithStyle, 'text/html')
        ]);
    }

    private executeGenericCell(content: string, language: string): vscode.NotebookCellOutput {
        // For other languages, just display as text
        return new vscode.NotebookCellOutput([
            vscode.NotebookCellOutputItem.text(content, 'text/plain')
        ]);
    }

    private transformVanillaJavaScript(code: string): string {
        // Transform imports and Observable Kit specific functions
        let transformedCode = code;

        // Transform npm imports: import { chart } from "npm:chart.js"
        transformedCode = transformedCode.replace(
            /import\s+({[^}]+}|\w+)\s+from\s+["']npm:([^"']+)["']/g,
            'const $1 = await import("https://cdn.skypack.dev/$2")'
        );

        // Transform jsr imports: import { foo } from "jsr:@scope/package"
        transformedCode = transformedCode.replace(
            /import\s+({[^}]+}|\w+)\s+from\s+["']jsr:([^"']+)["']/g,
            'const $1 = await import("https://esm.sh/$2")'
        );

        // Transform observable imports: import { chart } from "observable:@user/notebook"
        transformedCode = transformedCode.replace(
            /import\s+({[^}]+}|\w+)\s+from\s+["']observable:([^"']+)["']/g,
            'const $1 = await import("https://api.observablehq.com/$2.js")'
        );

        // Wrap display() calls to ensure they're handled properly
        transformedCode = transformedCode.replace(
            /display\s*\(/g,
            '__observable_display('
        );

        // Wrap view() calls for reactive inputs
        transformedCode = transformedCode.replace(
            /view\s*\(/g,
            '__observable_view('
        );

        return transformedCode;
    }

    private markdownToHTML(markdown: string): string {
        // Basic markdown to HTML conversion
        // In a real implementation, you'd use a proper markdown parser
        let html = markdown;

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold
        html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');

        // Code
        html = html.replace(/`([^`]*)`/gim, '<code>$1</code>');

        // Line breaks
        html = html.replace(/\n/gim, '<br>');

        return html;
    }
}
