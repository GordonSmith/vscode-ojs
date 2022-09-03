import * as fs from "fs";
import fetch from "node-fetch";
import * as path from "path";
import * as vscode from "vscode";
import { Diagnostic } from "./diagnostic";
import { Meta } from "./meta";
import { Preview } from "./preview";

export function encode(str: string) {
    return str
        .split("\\").join("\\\\")
        .split("`").join("\\`")
        .split("$").join("\\$")
        ;
}

const isObservableFile = (languageId?: string) => languageId === "omd" || languageId === "ojs";

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
        ctx.subscriptions.push(vscode.commands.registerCommand("ojs.exportECL", this.exportECL, this));
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

    async preview(fileUri?: vscode.Uri) {
        let textDocument: vscode.TextDocument | undefined;
        if (fileUri) {
            textDocument = await vscode.workspace.openTextDocument(fileUri);
        } else if (vscode.window.activeTextEditor) {
            textDocument = vscode.window.activeTextEditor.document;
        }
        if (textDocument) {
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

    importOJS(nb): string {
        return nb.nodes.map(node => {
            switch (node.mode) {
                case "js":
                    return node.value;
                default:
                    return `\
${node.mode}\`
${encode(node.value)}
\`;`;
            }
        }).join("\n\n");
    }

    importOMD(nb): string {
        const retVal: string[] = [];
        let inJS = false;
        nb.nodes.forEach(node => {
            switch (node.mode) {
                case "md":
                    if (inJS) {
                        retVal.push("```");
                        inJS = false;
                    } else {
                        retVal.push("");
                    }
                    retVal.push(node.value);
                    break;
                default:
                    const cell: string = node.value.trim();
                    let prefixLen = 0;
                    if (cell.indexOf("md`") === 0) {
                        prefixLen = 3;
                    } else if (cell.indexOf("md `") === 0) {
                        prefixLen = 4;
                    }
                    if (prefixLen) {
                        if (inJS) {
                            retVal.push("```");
                            inJS = false;
                        } else {
                            retVal.push("");
                        }
                        retVal.push(cell.substring(prefixLen, cell.length - 1) + "");
                    } else {
                        if (!inJS) {
                            retVal.push("```");
                            inJS = true;
                        } else {
                            retVal.push("");
                        }
                        if (node.mode !== "js") {
                            retVal.push(`${node.mode}\`${encode(node.value)}\`;`);
                        } else {
                            retVal.push(node.value + "");
                        }
                    }
                    break;
            }
        });
        if (inJS) {
            retVal.push("```");
        }
        return retVal.join("\n");
    }

    async import() {
        const impUrl = await vscode.window.showInputBox({
            prompt: "URL", placeHolder: "https://observablehq.com/@user/notebook"
        });
        if (impUrl) {
            let textEditor = vscode.window.activeTextEditor;
            let languageId = textEditor?.document?.languageId;
            if (!isObservableFile(languageId)) {
                textEditor = undefined;
                languageId = await vscode.window.showQuickPick(["omd", "ojs"], { placeHolder: "File Type" });
            }
            if (isObservableFile(languageId)) {
                const isShared = impUrl.indexOf("https://observablehq.com/d") === 0;
                const nb = await fetch(impUrl.replace(`https://observablehq.com/${isShared ? "d/" : ""}`, "https://api.observablehq.com/document/"), {
                    headers: {
                        origin: "https://observablehq.com",
                        referer: impUrl
                    }
                }).then(r => r.json() as any);
                let text = languageId === "omd" ? this.importOMD(nb) : this.importOJS(nb);
                nb.files.forEach(f => {
                    text = text.split(`"${f.name}"`).join(`/* "${f.name}" */"${f.url}"`);
                });
                if (textEditor) {
                    InsertText(textEditor, () => text);
                } else {
                    const folder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0]?.uri.path;
                    if (folder) {
                        const filePath = path.posix.join(folder, `Untitled-${Math.round(1000 + Math.random() * 1000)}.${languageId}`);
                        const newFile = vscode.Uri.parse("untitled://" + filePath);
                        const document = await vscode.workspace.openTextDocument(newFile);
                        const edit = new vscode.WorkspaceEdit();
                        edit.insert(newFile, new vscode.Position(0, 0), text);
                        await vscode.workspace.applyEdit(edit).then(success => {
                            if (success) {
                                vscode.window.showTextDocument(document);
                            } else {
                                vscode.window.showInformationMessage("Error!");
                            }
                        });
                    }
                }
            }
        }
    }

    private exportTpl(title: string, languageId: string, text: string): string {
        return `\
<!doctype html>
<html>

<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@hpcc-js/common/font-awesome/css/font-awesome.min.css">
    <style>
    body {
        padding: 0px;
        margin: 8px;
        background: white;
        color: black;
    }
    #placeholder {
        position: absolute;
        left: 8px;
        top: 8px;
        right: 8px;
        bottom: 8px;
        max-width: 480px;
    }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/@hpcc-js/observable-md/dist/index.full.js" type="text/javascript" charset="utf-8"></script>
    <script>
        var omdMod = window["@hpcc-js/observable-md"]
    </script>

</head>

<body onresize="doResize()">
    <div id="placeholder">
    </div>
    <script>
        var app = new omdMod.Observable()
            .target("placeholder")
            .showValues(true)
            .mode("${languageId}")
            .text(\`${encode(text)}\`)
            ;

        doResize();

        function doResize() {
        if (app) {
            app
                .resize()
                .lazyRender()
                ;
        }
    }
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
                    const text = textDocument.getText();
                    const html = this.exportTpl("", textDocument.languageId, text);
                    fs.writeFile(resource.fsPath, html, "utf8", () => { });
                }
            });
        }
    }

    private exportECLTpl(attrID: string, text: string): string {
        const escapedTextParts = text.split("'").join("\\'").split("\r\n").join("\n").split("\n");
        return `\
EXPORT ${attrID} := ${escapedTextParts.map(line => `'${line}`).join("\\n' + \n")}';
`;
    }

    async exportECL() {
        if (vscode.window.activeTextEditor) {
            const textDocument = vscode.window.activeTextEditor.document;
            const eclPath = textDocument.languageId === "omd" ? textDocument.uri.path.replace(".omd", ".ecl") : textDocument.uri.path.replace(".ojs", ".ecl");
            vscode.window.showSaveDialog({ defaultUri: vscode.Uri.file(eclPath), saveLabel: "Export to ECL" }).then(resource => {
                if (resource) {
                    const text = textDocument.getText();
                    const ecl = this.exportECLTpl(path.basename(textDocument.uri.path, path.extname(textDocument.uri.path)), text);
                    fs.writeFile(resource.fsPath, ecl, "utf8", () => { });
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
