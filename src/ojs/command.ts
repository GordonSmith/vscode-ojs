import * as fs from "fs";
import fetch from "node-fetch";
import * as path from "path";
import * as vscode from "vscode";
import { Diagnostic } from "./diagnostic";
import { Meta } from "./meta";
import { Preview } from "./preview";

export let commands: Commands;
export class Commands {
    _ctx: vscode.ExtensionContext;
    protected _diagnostic: Diagnostic;

    private constructor(ctx: vscode.ExtensionContext) {
        this._ctx = ctx;
        this._diagnostic = Diagnostic.attach(ctx);

        ctx.subscriptions.push(vscode.commands.registerCommand("ojs.preview", this.preview, this));
        ctx.subscriptions.push(vscode.commands.registerCommand("ojs.checkSyntax", this.activeCheckSyntax, this));
        ctx.subscriptions.push(vscode.commands.registerCommand("ojs.import", this.import, this));
        ctx.subscriptions.push(vscode.commands.registerCommand("ojs.export", this.export, this));
    }

    static attach(ctx: vscode.ExtensionContext): Commands {
        if (!commands) {
            commands = new Commands(ctx);
        }
        return commands;
    }

    activeCheckSyntax() {
        return this.checkSyntax(vscode.window.activeTextEditor?.document);
    }

    checkSyntax(doc?: vscode.TextDocument) {
        if (doc) {
            this._diagnostic.setQuick(doc.uri, []);
            Meta.attach(doc);
        }
    }

    async preview() {
        if (vscode.window.activeTextEditor) {
            const textDocument = vscode.window.activeTextEditor.document;
            await Preview.createOrShow(this._ctx, textDocument);
            this.refreshPreview(textDocument);
        }
    }

    async refreshPreview(doc?: vscode.TextDocument) {
        if (doc) {
            // this._diagnostic.setQuick(doc.uri, []);
            const text = doc.getText();
            if (Preview.currentPanel) {
                // const version = doc.version;
                Preview.currentPanel.evaluate(doc);
                // if (doc.version === version) {
                //     const meta = Meta.attach(doc);
                //     meta.update(errors);
                // }
                // this._diagnostic.set(doc.uri, diagnostics(doc, errors));
            }
        }
    }

    importOJS(textEditor, nb): string {
        return nb.nodes.map(node => node.value).join("\n\n");
    }

    importOMD(textEditor, nb): string {
        const retVal: string[] = [];
        let inJS = false;
        nb.nodes.forEach(node => {
            const cell: string = node.value.trim();
            if (cell.indexOf("md`") === 0) {
                if (inJS) {
                    retVal.push("```");
                    inJS = false;
                } else {
                    retVal.push("");
                }
                retVal.push(cell.substring(3, cell.length - 1) + "");
            } else {
                if (!inJS) {
                    retVal.push("```");
                    inJS = true;
                } else {
                    retVal.push("");
                }
                retVal.push(node.value + "");
            }
        });
        if (inJS) {
            retVal.push("```");
        }
        return retVal.join("\n");
    }

    async import() {
        if (vscode.window.activeTextEditor) {
            const textEditor = vscode.window.activeTextEditor;
            const impUrl = await vscode.window.showInputBox({
                prompt: "URL", placeHolder: "https://observablehq.com/@user/notebook"
            });
            if (impUrl) {
                const nb = await fetch(impUrl.replace("https://observablehq.com/", "https://api.observablehq.com/document/"), {
                    headers: {
                        origin: "https://observablehq.com",
                        referer: impUrl
                    }
                }).then(r => r.json());
                let text = "";
                if (textEditor.document.languageId === "omd") {
                    text = this.importOMD(textEditor, nb);
                } else {
                    text = this.importOJS(textEditor, nb);
                }
                nb.files.forEach(f => {
                    text = text.split(`"${f.name}"`).join(`/* "${f.name}" */"${f.url}"`);
                });
                InsertText(textEditor, () => text);
            }
        }
    }

    private exportTpl(title, js: string, languageId: string, text: string): string {
        function encode(str: string) {
            return str
                .split("\\").join("\\\\")
                .split("`").join("\\`")
                .split("$").join("\\$")
                ;
        }

        return `\
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        body {
            margin: 0 16px;
            font-family: Verdana, Apple Garamond;
            font-size: 17px;
            line-height: 1.5;
            color: #1b1e22
        }

        body.fullscreen {
            margin: 0px
        }
    </style>
    <script>
${js}
    </script>
</head>

<body>
    <div id="placeholder">
    </div>
    <script>
        runtime.renderTo("#placeholder", \`${languageId}\`, \`${encode(text)}\`);
    </script>
</body>

</html>
`;
    }

    async export() {
        if (vscode.window.activeTextEditor) {
            const textDocument = vscode.window.activeTextEditor.document;
            const htmlPath = textDocument.languageId === "omd" ? textDocument.uri.path.replace(".omd", ".html") : textDocument.uri.path.replace(".ojs", ".html");
            vscode.window.showSaveDialog({ defaultUri: vscode.Uri.file(htmlPath), saveLabel: "Export to HTML" }).then(resource => {
                if (resource) {
                    const resourceParts = path.parse(resource.path);
                    const runtimePath = vscode.Uri.file(path.join(this._ctx.extensionPath, "dist", "runtime.min.js"));
                    const runtime = fs.readFileSync(runtimePath.fsPath, "utf8");
                    const text = textDocument.getText();
                    const html = this.exportTpl("", runtime, textDocument.languageId, text);
                    fs.writeFile(resource.fsPath, html, "utf8", () => { });
                    // fs.writeFile(resource.fsPath.replace(".html", ".js"), runtime, "utf8", () => { });
                }
            });
        }
    }
}

function InsertText(activeEditor, getText: (i: number) => string, i: number = 0, wasEmpty: boolean = false) {

    const sels = activeEditor.selections;

    if (i > 0 && wasEmpty) {
        sels[i - 1] = new vscode.Selection(sels[i - 1].end, sels[i - 1].end);
        activeEditor.selections = sels; // required or the selection updates will be ignored! 😱
    }

    if (i < 0 || i >= sels.length) { return; }

    const isEmpty = sels[i].isEmpty;
    activeEditor.edit(edit => edit.replace(sels[i], getText(i))).then(x => {
        InsertText(activeEditor, getText, i + 1, isEmpty);
    });
}
