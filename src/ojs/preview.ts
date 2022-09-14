import * as path from "path";
import * as vscode from "vscode";
import type { AlertMessage, LoadedMessage, Value, ValueMessage } from "../webview";
import { Diagnostic } from "./diagnostic";
import { Meta } from "./meta";

type WebviewMessage = LoadedMessage | AlertMessage | ValueMessage;

export class Preview {
    protected _diagnostic: Diagnostic;

    static currentPanel: Preview | undefined;

    static readonly viewType = "OJSPreview";

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionPath: string;
    private _disposables: vscode.Disposable[] = [];

    static async createOrShow(ctx: vscode.ExtensionContext, textDocument: vscode.TextDocument) {

        // If we already have a panel, show it.
        if (Preview.currentPanel) {
            // Preview.currentPanel._panel.reveal();
            return Promise.resolve();
        }

        // Otherwise, create a new panel.
        const localResourceRoots = [
            vscode.Uri.file(path.join(ctx.extensionPath, "dist")),
            ...vscode.workspace.workspaceFolders?.map(wf => wf.uri) ?? []
        ];
        const panel = vscode.window.createWebviewPanel(
            Preview.viewType,
            "OJS / OMD Preview",
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots
            }
        );

        Preview.currentPanel = new Preview(panel, ctx);
        return Preview.currentPanel.init();
    }

    static revive(panel: vscode.WebviewPanel, ctx: vscode.ExtensionContext) {
        Preview.currentPanel = new Preview(panel, ctx);
    }

    private constructor(panel: vscode.WebviewPanel, protected _ctx: vscode.ExtensionContext) {
        this._panel = panel;
        this._diagnostic = Diagnostic.attach(_ctx);
        this._extensionPath = _ctx.extensionPath;

        // Set the webview's initial html content
        this._panel.webview.html = this.getHtmlForWebview(this._panel.webview);

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        // this._panel.onDidChangeViewState(
        //     e => {
        //         if (this._panel.visible) {
        //             this._panel.webview.html = this.getHtmlForWebview(this._panel.webview);
        //         }
        //     },
        //     null,
        //     this._disposables
        // );
    }

    _callbackID = 0;
    _callbacks: { [key: number]: (msg: ValueMessage) => void } = {};
    _doc: vscode.TextDocument;
    async init() {
        // Handle messages from the webview
        // this._diagnostic.setRuntime(doc.uri, []);
        // let runtimeErrors = [];
        // setInterval(() => {
        //     if (runtimeErrors) {
        //         runtimeErrors.forEach(e => {
        //             this._diagnostic.setRuntime(doc.uri, diagnostics(doc, e));
        //         });
        //         runtimeErrors = [];
        //     }
        // }, 1000);
        return new Promise((resolve, reject) => {
            this._panel.webview.onDidReceiveMessage((message: WebviewMessage) => {
                const callback: (msg: WebviewMessage) => void = message.callbackID && this._callbacks[message.callbackID];
                if (callback) {
                    callback(message);
                } else {
                    switch (message.command) {
                        case "loaded":
                            resolve("");
                            break;
                        case "values":
                            const meta = Meta.attach(this._doc);
                            meta.update(message.content);
                            break;
                        case "alert":
                            vscode.window.showErrorMessage(message.content);
                            break;
                    }
                }
            }, null, this._disposables);
        });
    }

    echo(content) {
        this._panel.webview.postMessage({ command: "echo", content });
    }

    evaluate(doc: vscode.TextDocument): Promise<Value[]> {
        this._doc = doc;
        const folder = this._panel.webview.asWebviewUri(vscode.Uri.file(path.dirname(doc.uri.fsPath))).toString();
        return new Promise((resolve, reject) => {
            const callbackID = ++this._callbackID;
            this._callbacks[callbackID] = (msg: ValueMessage) => {
                delete this._callbacks[callbackID];
                const meta = Meta.attach(doc);
                meta.update(msg.content);
                resolve(msg.content);
            };
            this._panel.webview.postMessage({
                command: "evaluate",
                languageId: doc.languageId,
                folder,
                content: doc.getText(),
                callbackID
            });
        });
    }

    // pull(url): Promise<string> {
    //     return new Promise((resolve, reject) => {
    //         const callbackID = ++this._callbackID;
    //         this._callbacks[callbackID] = (...args: any[]) => {
    //             delete this._callbacks[callbackID];
    //             resolve(...args);
    //         };
    //         this._panel.webview.postMessage({ command: "pull", url, callbackID });
    //     });
    // }

    dispose() {
        Preview.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private getHtmlForWebview(webview: vscode.Webview) {
        // Local path to main script run in the webview
        const scriptPathOnDisk = vscode.Uri.file(
            path.join(this._extensionPath, "dist", "webview.js")
        );

        // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

        // Use a nonce to whitelist which scripts can be run
        const nonce = getNonce();

        return `\
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Observable MD</title>
    <link href="https://cdn.jsdelivr.net/npm/@hpcc-js/common/font-awesome/css/font-awesome.min.css" rel="stylesheet">
    <style>
    body {
        background:white;
        color: black;
        overflow-x: scroll !important;
        overflow-y: scroll !important;
    }
    :root{--syntax_diff:#24292e;--syntax_diff_bg:#fff;--selection:#d7d4f0;--hr:rgba(0,0,0,0.05);--sans-serif:-apple-system,BlinkMacSystemFont,\"avenir next\",avenir,helvetica,\"helvetica neue\",ubuntu,roboto,noto,\"segoe ui\",arial,sans-serif}h1,h2,h3,h4,h5,h6{color:#333;font-weight:700;line-height:1.15;margin-top:0;margin-bottom:.25em}h2~p,h3~p,h4~p{margin-top:0}a[href]{text-decoration:none}a[href]:hover{text-decoration:underline}h1 code,h2 code,h3 code,h4 code,h5 code,h6 code{font-size:90%}code,pre,tt{font:var(--mono_fonts)}img{max-width:calc(100vw - 28px)}.katex-display,figure,h1,h2,h3,h4,h5,h6,p,table{max-width:640px}blockquote,ol,ul{max-width:600px}blockquote{margin:1em 1.5em}ol,ul{padding-left:28px}hr{height:1px;margin:1em 0;padding:1em 0;border:none;background:no-repeat 50%/100% 1px linear-gradient(90deg,var(--hr),var(--hr))}pre{padding:2px 0}
    :root{--syntax_normal:#1b1e23;--syntax_comment:#a9b0bc;--syntax_number:#20a5ba;--syntax_keyword:#c30771;--syntax_atom:#10a778;--syntax_string:#008ec4;--syntax_error:#ffbedc;--syntax_unknown_variable:#838383;--syntax_known_variable:#005f87;--syntax_matchbracket:#20bbfc;--syntax_key:#6636b4;--mono_fonts:82%/1.5 Menlo,Consolas,monospace}.observablehq--collapsed,.observablehq--expanded,.observablehq--function,.observablehq--gray,.observablehq--import,.observablehq--string:after,.observablehq--string:before{color:var(--syntax_normal)}.observablehq--collapsed,.observablehq--inspect a{cursor:pointer}.observablehq--field{text-indent:-1em;margin-left:1em}.observablehq--empty{color:var(--syntax_comment)}.observablehq--blue,.observablehq--keyword{color:#3182bd}.observablehq--forbidden,.observablehq--pink{color:#e377c2}.observablehq--orange{color:#e6550d}.observablehq--boolean,.observablehq--null,.observablehq--undefined{color:var(--syntax_atom)}.observablehq--bigint,.observablehq--date,.observablehq--green,.observablehq--number,.observablehq--regexp,.observablehq--symbol{color:var(--syntax_number)}.observablehq--index,.observablehq--key{color:var(--syntax_key)}.observablehq--prototype-key{color:#aaa}.observablehq--empty{font-style:oblique}.observablehq--purple,.observablehq--string{color:var(--syntax_string)}.observablehq--error,.observablehq--red{color:#e7040f}.observablehq--inspect{font:var(--mono_fonts);overflow-x:auto;display:block;white-space:pre}.observablehq--error .observablehq--inspect{word-break:break-all;white-space:pre-wrap}
</style>
</head>

<body>
    <div id="placeholder">
        ...loading...
    </div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>

</html>
`;
    }

}

function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
