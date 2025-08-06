import * as path from "path";
import * as vscode from "vscode";
import { HtmlTranspiler, TranspileOptions } from "./htmlTranspiler";

export class HtmlPreview {
    static currentPanel: HtmlPreview | undefined;
    static readonly viewType = "HTMLPreview";

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionPath: string;
    private _disposables: vscode.Disposable[] = [];
    private _currentDocument?: vscode.TextDocument;
    private _transpiler: HtmlTranspiler;
    private _updateTimeout?: NodeJS.Timeout;
    private _isDisposed: boolean = false;

    /**
     * Safely check if there's a current panel and it's usable
     */
    static hasUsablePanel(): boolean {
        if (!HtmlPreview.currentPanel) {
            return false;
        }

        if (!HtmlPreview.currentPanel.isPanelUsable()) {
            HtmlPreview.currentPanel = undefined;
            return false;
        }

        return true;
    }

    static async createOrShow(ctx: vscode.ExtensionContext, textDocument: vscode.TextDocument) {
        // Use the safe check for existing panel
        if (HtmlPreview.hasUsablePanel()) {
            try {
                // Panel is valid, check if it's a different document
                const currentUri = HtmlPreview.currentPanel!._currentDocument?.uri.toString();
                const newUri = textDocument.uri.toString();

                if (currentUri !== newUri) {
                    console.log(`Switching preview from ${currentUri ? path.basename(vscode.Uri.parse(currentUri).fsPath) : 'none'} to ${path.basename(textDocument.fileName)}`);
                }

                HtmlPreview.currentPanel!.switchToDocument(textDocument);
                HtmlPreview.currentPanel!._panel.reveal();
                return;
            } catch (error) {
                console.log('Error using existing panel, creating new one:', error);
                HtmlPreview.currentPanel = undefined;
            }
        }

        // Otherwise, create a new panel.
        console.log(`Creating new HTML preview panel for ${path.basename(textDocument.fileName)}`);
        const localResourceRoots = [
            vscode.Uri.file(path.join(ctx.extensionPath, "dist")),
            vscode.Uri.file(path.dirname(textDocument.uri.fsPath)),
            ...vscode.workspace.workspaceFolders?.map(wf => wf.uri) ?? []
        ];

        const panel = vscode.window.createWebviewPanel(
            HtmlPreview.viewType,
            `Preview: ${path.basename(textDocument.fileName)}`,
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots
            }
        );

        HtmlPreview.currentPanel = new HtmlPreview(panel, ctx, textDocument);
    }

    static revive(panel: vscode.WebviewPanel, ctx: vscode.ExtensionContext) {
        console.log('Reviving HTML preview panel');

        // Clear any existing panel that might be stale
        if (HtmlPreview.currentPanel && HtmlPreview.currentPanel._isDisposed) {
            HtmlPreview.currentPanel = undefined;
        }

        // We'll need to get the document somehow when reviving
        // For now, just create an empty preview that can be updated later
        HtmlPreview.currentPanel = new HtmlPreview(panel, ctx);

        // Try to get the active document and update the preview
        if (vscode.window.activeTextEditor) {
            const doc = vscode.window.activeTextEditor.document;
            if (doc.languageId === 'html' || doc.fileName.endsWith('.html') || doc.fileName.endsWith('.onb.html')) {
                HtmlPreview.currentPanel.updateContent(doc);
                HtmlPreview.currentPanel.setupDocumentWatcher(doc);
            }
        }
    }

    private constructor(panel: vscode.WebviewPanel, protected _ctx: vscode.ExtensionContext, textDocument?: vscode.TextDocument) {
        this._panel = panel;
        this._extensionPath = _ctx.extensionPath;

        // Initialize the HTML transpiler with default options
        this._transpiler = new HtmlTranspiler({
            enableScripts: true,
            enableStyles: true,
            preserveComments: false
        });

        // Set the webview's initial html content
        if (textDocument) {
            this.updateContent(textDocument);
            this.setupDocumentWatcher(textDocument);
        }

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    private setupDocumentWatcher(textDocument: vscode.TextDocument): void {
        // Clean up previous watchers if switching documents
        if (this._currentDocument && this._currentDocument.uri.toString() !== textDocument.uri.toString()) {
            // Clear old disposables related to document watching
            while (this._disposables.length > 1) { // Keep the dispose listener
                this._disposables.pop()?.dispose();
            }
        }

        this._currentDocument = textDocument;

        // Watch for document changes and update preview immediately
        const onDidSave = vscode.workspace.onDidSaveTextDocument((savedDoc) => {
            if (savedDoc.uri.toString() === textDocument.uri.toString()) {
                this.updateContent(savedDoc);
            }
        });

        // Watch for real-time document content changes
        const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument((changeEvent) => {
            if (changeEvent.document.uri.toString() === textDocument.uri.toString()) {
                // Debounce the updates to avoid too frequent refreshes
                this.debounceUpdate(changeEvent.document);
            }
        });

        // Watch for active editor changes to sync with the current document
        const onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor && editor.document &&
                (editor.document.languageId === 'html' ||
                    editor.document.fileName.endsWith('.html') ||
                    editor.document.fileName.endsWith('.onb.html'))) {
                this.switchToDocument(editor.document);
            }
        });

        this._disposables.push(onDidSave, onDidChangeTextDocument, onDidChangeActiveTextEditor);
    }

    /**
     * Check if the webview panel is still usable
     */
    private isPanelUsable(): boolean {
        if (this._isDisposed) {
            return false;
        }

        try {
            // Multiple checks to ensure the panel is really usable
            // 1. Check if webview exists
            const webview = this._panel.webview;

            // 2. Try to access webview properties
            const _ = webview.html;

            // 3. Check if we can set properties (this will fail if disposed)
            const currentTitle = this._panel.title;
            this._panel.title = currentTitle;

            return true;
        } catch (error) {
            console.log('Panel is no longer usable:', error);
            this._isDisposed = true;
            if (HtmlPreview.currentPanel === this) {
                HtmlPreview.currentPanel = undefined;
            }
            return false;
        }
    }

    /**
     * Debounced update to avoid too frequent refreshes during typing
     */
    private debounceUpdate(document: vscode.TextDocument): void {
        if (!this.isPanelUsable()) {
            return;
        }

        if (this._updateTimeout) {
            clearTimeout(this._updateTimeout);
        }

        this._updateTimeout = setTimeout(() => {
            if (this.isPanelUsable()) {
                this.updateContent(document);
            }
        }, 500); // Wait 500ms after the last change
    }

    /**
     * Switch the preview to show a different document
     */
    private switchToDocument(document: vscode.TextDocument): void {
        if (!this.isPanelUsable()) {
            return;
        }

        try {
            if (document.uri.toString() !== this._currentDocument?.uri.toString()) {
                console.log(`Switching preview to: ${path.basename(document.fileName)}`);
                this.setupDocumentWatcher(document);
                this.updateContent(document);
            }
        } catch (error) {
            console.error('Error switching document:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('disposed')) {
                console.log('Panel was disposed during document switch, cleaning up...');
                this._isDisposed = true;
                if (HtmlPreview.currentPanel === this) {
                    HtmlPreview.currentPanel = undefined;
                }
            }
        }
    }

    private updateContent(textDocument: vscode.TextDocument): void {
        if (!this.isPanelUsable()) {
            return;
        }

        try {
            const htmlContent = textDocument.getText();

            // First, transpile the HTML content
            const transpiledHtml = this._transpiler.transpile(htmlContent);

            // Inject Observable runtime dependencies
            const htmlWithRuntime = this._transpiler.injectRuntimeDependencies(transpiledHtml);

            // Convert relative paths to webview URIs for proper loading of resources
            let processedHtml = this.processHtmlContent(htmlWithRuntime, textDocument.uri);

            // Ensure there's always a preview container and initialize our simple preview
            processedHtml = this.ensurePreviewContainer(processedHtml, textDocument);

            this._panel.webview.html = processedHtml;
            this._panel.title = `Preview: ${path.basename(textDocument.fileName)}`;
        } catch (error) {
            console.error('Error updating webview content:', error);
            // If the panel is disposed, mark it and clear the reference
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('disposed')) {
                console.log('Panel was disposed, cleaning up...');
                this._isDisposed = true;
                if (HtmlPreview.currentPanel === this) {
                    HtmlPreview.currentPanel = undefined;
                }
            }
        }
    }

    /**
     * Ensure the HTML has a preview container and initialize the simple preview
     */
    private ensurePreviewContainer(htmlContent: string, textDocument: vscode.TextDocument): string {
        // Check if the HTML already has a body and preview container
        const hasBody = htmlContent.includes('<body');
        const hasContainer = htmlContent.includes('preview-container');

        // Prepare meta information for the preview
        const meta = {
            title: `Preview: ${path.basename(textDocument.fileName)}`,
            filename: path.basename(textDocument.fileName),
            timestamp: Date.now(),
            documentUri: textDocument.uri.toString(),
            version: '1.0.0'
        };

        // Simple preview initialization script
        const previewScript = `
        <script>
        console.log('Initializing Simple Observable Preview...');
        
        // Create simple preview if container doesn't exist
        document.addEventListener('DOMContentLoaded', function() {
            let container = document.getElementById('preview-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'preview-container';
                document.body.appendChild(container);
            }
            
            // Initialize simple preview with meta information
            const meta = ${JSON.stringify(meta)};
            
            // Simple preview implementation
            container.innerHTML = \`
                <div style="border: 2px solid #007acc; border-radius: 8px; padding: 20px; margin: 20px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); font-family: system-ui, sans-serif;">
                    <h1 style="color: #007acc; margin-top: 0; text-align: center;">
                        \${meta.title}
                    </h1>
                    
                    <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-top: 0;">Hello World! 👋</h2>
                        <p style="color: #666;">
                            This is a simplified Observable preview showing the HTML content from <strong>\${meta.filename}</strong>.
                            <br><em>Preview stays in sync with your active document!</em>
                        </p>
                        
                        <div style="margin: 15px 0;">
                            <button onclick="alert('Hello from Observable!\\\\n\\\\nFile: \${meta.filename}\\\\nLoaded: ' + new Date(\${meta.timestamp}).toLocaleString())" style="
                                background: #ff6b6b;
                                color: white;
                                border: none;
                                padding: 10px 20px;
                                border-radius: 5px;
                                cursor: pointer;
                                font-size: 16px;
                                margin-right: 10px;
                            ">
                                Show Alert
                            </button>
                            
                            <button onclick="console.log('🎉 Hello from Simple Observable Preview!', { meta: \${JSON.stringify(meta)}, timestamp: new Date().toISOString() })" style="
                                background: #4ecdc4;
                                color: white;
                                border: none;
                                padding: 10px 20px;
                                border-radius: 5px;
                                cursor: pointer;
                                font-size: 16px;
                            ">
                                Log to Console
                            </button>
                        </div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #007acc;">
                        <h3 style="color: #007acc; margin-top: 0;">File Information</h3>
                        <ul style="color: #666; margin: 0; padding-left: 20px;">
                            <li><strong>File:</strong> \${meta.filename}</li>
                            <li><strong>Version:</strong> \${meta.version}</li>
                            <li><strong>Loaded:</strong> \${new Date(meta.timestamp).toLocaleString()}</li>
                            <li><strong>URI:</strong> <code style="background: #e9ecef; padding: 2px 4px; border-radius: 3px;">\${meta.documentUri}</code></li>
                            <li><strong>Status:</strong> <span id="sync-status" style="color: #28a745;">🟢 In Sync</span></li>
                        </ul>
                    </div>
                </div>
            \`;
            
            console.log('✅ Simple Observable Preview initialized!', meta);
        });
        </script>
        `;

        if (hasBody) {
            // If there's already a body, inject our script before closing body tag
            if (!hasContainer) {
                // Add preview container if it doesn't exist
                htmlContent = htmlContent.replace('</body>', `<div id="preview-container"></div>${previewScript}</body>`);
            } else {
                // Just add the script
                htmlContent = htmlContent.replace('</body>', `${previewScript}</body>`);
            }
        } else {
            // If no body exists, create a minimal HTML structure
            htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${meta.title}</title>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            font-family: system-ui, -apple-system, sans-serif; 
            background: #f5f5f5; 
        }
    </style>
</head>
<body>
    <div id="preview-container"></div>
    ${previewScript}
    
    <!-- Original content -->
    ${htmlContent}
</body>
</html>
            `.trim();
        }

        return htmlContent;
    }

    private processHtmlContent(htmlContent: string, documentUri: vscode.Uri): string {
        const documentDir = path.dirname(documentUri.fsPath);
        const documentDirUri = vscode.Uri.file(documentDir);

        // Convert relative paths to webview URIs
        return htmlContent.replace(
            /(?:src|href)="(?!https?:\/\/|data:|#)([^"]+)"/g,
            (match, relativePath) => {
                try {
                    const fullPath = path.resolve(documentDir, relativePath);
                    const resourceUri = vscode.Uri.file(fullPath);
                    const webviewUri = this._panel.webview.asWebviewUri(resourceUri);
                    return match.replace(relativePath, webviewUri.toString());
                } catch (error) {
                    console.error(`Error processing path ${relativePath}:`, error);
                    return match;
                }
            }
        );
    }

    /**
     * Update transpiler options
     * @param options New transpiler options to apply
     */
    public updateTranspilerOptions(options: Partial<TranspileOptions>): void {
        if (!this.isPanelUsable()) {
            return;
        }

        this._transpiler.updateOptions(options);

        // Re-render current document if available
        if (this._currentDocument) {
            this.updateContent(this._currentDocument);
        }
    }

    /**
     * Get current transpiler options
     */
    public getTranspilerOptions(): TranspileOptions {
        return this._transpiler.getOptions();
    }

    dispose() {
        console.log('HtmlPreview disposing...');

        // Mark as disposed immediately to prevent reuse
        this._isDisposed = true;

        // Clear any pending update timeout first
        if (this._updateTimeout) {
            clearTimeout(this._updateTimeout);
            this._updateTimeout = undefined;
        }

        // Clean up all disposables before disposing the panel
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                try {
                    disposable.dispose();
                } catch (error) {
                    console.error('Error disposing resource:', error);
                }
            }
        }

        // Clear document reference
        this._currentDocument = undefined;

        // Clear static reference before disposing panel to prevent race conditions
        if (HtmlPreview.currentPanel === this) {
            HtmlPreview.currentPanel = undefined;
        }

        // Dispose the webview panel last
        try {
            this._panel.dispose();
        } catch (error) {
            console.error('Error disposing webview panel:', error);
        }

        console.log('HtmlPreview disposed successfully');
    }
}
