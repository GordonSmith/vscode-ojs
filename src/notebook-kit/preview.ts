/**
 * Simple Preview Script for Observable Notebook Kit
 * This script is loaded into the webview preview to handle simple demonstrations
 */

export interface PreviewMeta {
    title?: string;
    filename?: string;
    timestamp?: number;
    documentUri?: string;
    version?: string;
}

export class SimplePreview {
    private container: HTMLElement;
    private meta: PreviewMeta;

    constructor(containerId: string = 'preview-container', meta: PreviewMeta = {}) {
        this.meta = {
            title: 'Simple Observable Preview',
            filename: 'untitled.html',
            timestamp: Date.now(),
            version: '1.0.0',
            ...meta
        };

        // Create or find the container
        this.container = document.getElementById(containerId) || this.createContainer(containerId);
        this.initialize();
    }

    private createContainer(id: string): HTMLElement {
        const container = document.createElement('div');
        container.id = id;
        container.style.cssText = `
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            line-height: 1.6;
        `;
        document.body.appendChild(container);
        return container;
    }

    private initialize(): void {
        this.render();
        this.setupInteractions();
    }

    private render(): void {
        this.container.innerHTML = `
            <div style="border: 2px solid #007acc; border-radius: 8px; padding: 20px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);">
                <h1 style="color: #007acc; margin-top: 0; text-align: center;">
                    ${this.meta.title}
                </h1>
                
                <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; margin-top: 0;">Hello World! 👋</h2>
                    <p style="color: #666;">
                        This is a simplified Observable preview showing basic functionality.
                    </p>
                    
                    <div style="margin: 15px 0;">
                        <button id="hello-alert" style="
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
                        
                        <button id="console-log" style="
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
                    <h3 style="color: #007acc; margin-top: 0;">Meta Information</h3>
                    <ul style="color: #666; margin: 0; padding-left: 20px;">
                        <li><strong>File:</strong> ${this.meta.filename}</li>
                        <li><strong>Version:</strong> ${this.meta.version}</li>
                        <li><strong>Loaded:</strong> ${new Date(this.meta.timestamp!).toLocaleString()}</li>
                        ${this.meta.documentUri ? `<li><strong>URI:</strong> <code style="background: #e9ecef; padding: 2px 4px; border-radius: 3px;">${this.meta.documentUri}</code></li>` : ''}
                    </ul>
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin-top: 15px;">
                    <h3 style="color: #856404; margin-top: 0;">🚀 Next Steps</h3>
                    <p style="color: #856404; margin-bottom: 0;">
                        This simple preview can be extended to support:
                        <br>• Observable notebook execution
                        <br>• Interactive data visualization
                        <br>• Real-time code evaluation
                    </p>
                </div>
            </div>
        `;
    }

    private setupInteractions(): void {
        // Alert button
        const alertButton = this.container.querySelector('#hello-alert') as HTMLButtonElement;
        if (alertButton) {
            alertButton.addEventListener('click', () => {
                alert(`Hello from ${this.meta.filename}!\n\nThis is a simple Observable preview demonstration.`);
            });

            alertButton.addEventListener('mouseenter', () => {
                alertButton.style.background = '#ff5252';
                alertButton.style.transform = 'scale(1.05)';
            });

            alertButton.addEventListener('mouseleave', () => {
                alertButton.style.background = '#ff6b6b';
                alertButton.style.transform = 'scale(1)';
            });
        }

        // Console log button
        const consoleButton = this.container.querySelector('#console-log') as HTMLButtonElement;
        if (consoleButton) {
            consoleButton.addEventListener('click', () => {
                console.log('🎉 Hello from Simple Observable Preview!', {
                    meta: this.meta,
                    timestamp: new Date().toISOString(),
                    message: 'This is a simple preview demonstration'
                });

                // Visual feedback
                const originalText = consoleButton.textContent;
                consoleButton.textContent = 'Logged! ✅';
                setTimeout(() => {
                    consoleButton.textContent = originalText;
                }, 1500);
            });

            consoleButton.addEventListener('mouseenter', () => {
                consoleButton.style.background = '#26a69a';
                consoleButton.style.transform = 'scale(1.05)';
            });

            consoleButton.addEventListener('mouseleave', () => {
                consoleButton.style.background = '#4ecdc4';
                consoleButton.style.transform = 'scale(1)';
            });
        }
    }

    /**
     * Update the preview with new meta information
     */
    public updateMeta(newMeta: Partial<PreviewMeta>): void {
        this.meta = { ...this.meta, ...newMeta };
        this.render();
        this.setupInteractions();
    }

    /**
     * Get current meta information
     */
    public getMeta(): PreviewMeta {
        return { ...this.meta };
    }

    /**
     * Add a custom message to the preview
     */
    public addMessage(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
        const colors = {
            info: '#007acc',
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545'
        };

        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            background: white;
            border-left: 4px solid ${colors[type]};
            padding: 10px 15px;
            margin: 10px 0;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        `;
        messageDiv.innerHTML = `
            <strong style="color: ${colors[type]};">${type.toUpperCase()}:</strong>
            <span style="color: #333; margin-left: 8px;">${message}</span>
        `;

        this.container.appendChild(messageDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    /**
     * Clear all content and reset
     */
    public clear(): void {
        this.container.innerHTML = '';
        this.render();
        this.setupInteractions();
    }
}

// Auto-initialize if we're in a browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializePreview();
        });
    } else {
        initializePreview();
    }
}

function initializePreview() {
    // Look for meta information in the document or window
    const meta: PreviewMeta = {
        title: document.title || 'Simple Observable Preview',
        filename: window.location.pathname.split('/').pop() || 'untitled.html',
        timestamp: Date.now()
    };

    // Create the preview instance
    const preview = new SimplePreview('preview-container', meta);

    // Make it globally available for extension communication
    (window as any).observablePreview = preview;

    // Listen for messages from the VS Code extension
    if ((window as any).acquireVsCodeApi) {
        const vscode = (window as any).acquireVsCodeApi();

        window.addEventListener('message', event => {
            const message = event.data;

            switch (message.command) {
                case 'updateMeta':
                    preview.updateMeta(message.meta);
                    break;
                case 'addMessage':
                    preview.addMessage(message.text, message.type);
                    break;
                case 'clear':
                    preview.clear();
                    break;
            }
        });

        // Send ready signal
        vscode.postMessage({
            command: 'previewReady',
            meta: preview.getMeta()
        });
    }

    console.log('🎉 Simple Observable Preview initialized!', meta);
}

export default SimplePreview;
