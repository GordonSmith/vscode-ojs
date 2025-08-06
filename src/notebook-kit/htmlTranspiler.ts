/**
 * HTML Transpiler for Observable JS
 * Handles transpilation of HTML content before rendering in the webview
 */

export interface TranspileOptions {
    enableScripts?: boolean;
    enableStyles?: boolean;
    preserveComments?: boolean;
    customTransformers?: Array<(html: string) => string>;
}

export class HtmlTranspiler {
    private options: TranspileOptions;

    constructor(options: TranspileOptions = {}) {
        this.options = {
            enableScripts: true,
            enableStyles: true,
            preserveComments: false,
            customTransformers: [],
            ...options
        };
    }

    /**
     * Main transpilation method
     * @param htmlContent The raw HTML content to transpile
     * @returns The transpiled HTML content
     */
    public transpile(htmlContent: string): string {
        let transpiledContent = htmlContent;

        // Apply built-in transformations
        transpiledContent = this.processScripts(transpiledContent);
        transpiledContent = this.processStyles(transpiledContent);
        transpiledContent = this.processComments(transpiledContent);
        transpiledContent = this.processObservableCode(transpiledContent);

        // Apply custom transformers
        if (this.options.customTransformers) {
            for (const transformer of this.options.customTransformers) {
                transpiledContent = transformer(transpiledContent);
            }
        }

        return transpiledContent;
    }

    /**
     * Process script tags - simplified for demo purposes
     */
    private processScripts(html: string): string {
        if (!this.options.enableScripts) {
            return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        }

        // Transform Observable JS script blocks to simple demonstrations
        return html.replace(
            /<script[^>]*type=["']observable["'][^>]*>([\s\S]*?)<\/script>/gi,
            (match, code) => {
                return `<script>
                    console.log('Observable script processed:', ${JSON.stringify(code.substring(0, 100) + '...')});
                    
                    // Create a simple demonstration
                    document.addEventListener('DOMContentLoaded', function() {
                        const div = document.createElement('div');
                        div.style.cssText = 'padding: 15px; border: 2px solid #28a745; border-radius: 8px; margin: 10px; background: #d4edda; font-family: system-ui, sans-serif;';
                        div.innerHTML = \`
                            <h3 style="color: #28a745; margin-top: 0;">📝 Observable Script Executed</h3>
                            <p style="color: #155724; margin: 8px 0;">Original Observable code was converted to this simple demonstration.</p>
                            <pre style="background: #f8f9fa; padding: 8px; border-radius: 4px; font-size: 12px; color: #495057; margin: 8px 0; overflow-x: auto;"><code>${this.escapeForHTML(code).substring(0, 200)}${code.length > 200 ? '...' : ''}</code></pre>
                            <button onclick="alert('Hello from Observable!\\\\n\\\\nOriginal code snippet:\\\\n${this.escapeForJS(code).substring(0, 100)}...')" 
                                    style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;">
                                🚀 Execute Demo
                            </button>
                        \`;
                        
                        // Try to append to preview container first, fallback to body
                        const container = document.getElementById('preview-container');
                        if (container) {
                            container.appendChild(div);
                        } else {
                            document.body.appendChild(div);
                        }
                    });
                </script>`;
            }
        );
    }

    /**
     * Process style tags
     */
    private processStyles(html: string): string {
        if (!this.options.enableStyles) {
            return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        }
        return html;
    }

    /**
     * Process comments
     */
    private processComments(html: string): string {
        if (!this.options.preserveComments) {
            return html.replace(/<!--[\s\S]*?-->/g, '');
        }
        return html;
    }

    /**
     * Process Observable-specific code blocks
     */
    private processObservableCode(html: string): string {
        // Look for Observable code blocks and transform them
        return html.replace(
            /<pre[^>]*class=["'][^"']*observable[^"']*["'][^>]*>([\s\S]*?)<\/pre>/gi,
            (match, code) => {
                const transpiledCode = this.transpileObservableCode(code);
                return `<div class="observable-cell">${transpiledCode}</div>`;
            }
        );
    }

    /**
     * Transpile Observable code to JavaScript
     * Simplified to use the simple preview system
     */
    private transpileObservableCode(code: string): string {
        // Simple implementation that shows the code in a formatted way
        return `
<div class="observable-cell" style="
    border: 1px solid #ddd; 
    border-radius: 6px; 
    padding: 15px; 
    margin: 10px 0; 
    background: #f8f9fa;
    font-family: system-ui, sans-serif;
">
    <h4 style="color: #007acc; margin-top: 0;">Observable Code Block</h4>
    <pre style="
        background: #fff; 
        padding: 10px; 
        border-radius: 4px; 
        border: 1px solid #e9ecef;
        overflow-x: auto;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        color: #333;
    "><code>${this.escapeForHTML(code)}</code></pre>
    <button onclick="alert('Hello from Observable!\\n\\nOriginal code:\\n${this.escapeForJS(code)}')" style="
        background: #007acc;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        margin-top: 10px;
    ">
        Execute (Demo)
    </button>
</div>
        `.trim();
    }

    /**
     * Escape string content for JavaScript
     */
    private escapeForJS(str: string): string {
        return str
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
    }

    /**
     * Escape string content for HTML
     */
    private escapeForHTML(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Add simple preview dependencies to HTML head
     */
    public injectRuntimeDependencies(html: string): string {
        const dependencies = `
    <script>
        console.log('Simple Observable Preview initializing...');
        
        // Simple preview functionality
        window.observablePreview = {
            showAlert: function(message) {
                alert('Observable Preview: ' + message);
            },
            logMessage: function(message) {
                console.log('📝 Observable:', message);
            },
            addMessage: function(text, type = 'info') {
                const colors = {
                    info: '#007acc',
                    success: '#28a745', 
                    warning: '#ffc107',
                    error: '#dc3545'
                };
                
                const div = document.createElement('div');
                div.style.cssText = \`
                    background: white;
                    border-left: 4px solid \${colors[type]};
                    padding: 10px 15px;
                    margin: 10px 0;
                    border-radius: 4px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                \`;
                div.innerHTML = \`
                    <strong style="color: \${colors[type]};">\${type.toUpperCase()}:</strong>
                    <span style="color: #333; margin-left: 8px;">\${text}</span>
                \`;
                
                document.body.appendChild(div);
                setTimeout(() => div.remove(), 5000);
            }
        };
    </script>
        `.trim();

        // Insert before closing head tag or at the beginning of body
        if (html.includes('</head>')) {
            return html.replace('</head>', `${dependencies}\n</head>`);
        } else if (html.includes('<body>')) {
            return html.replace('<body>', `<body>\n${dependencies}`);
        } else {
            return `${dependencies}\n${html}`;
        }
    }

    /**
     * Update options
     */
    public updateOptions(newOptions: Partial<TranspileOptions>): void {
        this.options = { ...this.options, ...newOptions };
    }

    /**
     * Get current options (read-only copy)
     */
    public getOptions(): TranspileOptions {
        return { ...this.options };
    }
}
