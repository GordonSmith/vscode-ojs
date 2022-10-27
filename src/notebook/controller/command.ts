import * as vscode from "vscode";
import fetch from "node-fetch";
import { serializer } from "./serializer";
import { reporter } from "../../telemetry/index";

export let commands: Commands;
export class Commands {
    _ctx: vscode.ExtensionContext;

    private constructor(ctx: vscode.ExtensionContext) {
        this._ctx = ctx;

        ctx.subscriptions.push(vscode.commands.registerCommand("ojs.download", this.download, this));
        ctx.subscriptions.push(vscode.commands.registerCommand("ojs.cell.name", this.cellName, this));
        ctx.subscriptions.push(vscode.commands.registerCommand("ojs.cell.db", this.dbName, this));

        // cell toolbar meta  ---
        ctx.subscriptions.push(vscode.window.onDidChangeNotebookEditorSelection(e => {
            const cell = e.notebookEditor.notebook.cellAt(e.selections[0]?.start);
            vscode.commands.executeCommand("setContext", "cellLangId", cell.document.languageId);
        }));

        // status bar provider
        ctx.subscriptions.push(vscode.notebooks.registerNotebookCellStatusBarItemProvider("ecl-notebook", new class implements vscode.NotebookCellStatusBarItemProvider {
            provideCellStatusBarItems(cell: vscode.NotebookCell) {
                return [];
            }
        }));
    }

    static attach(ctx: vscode.ExtensionContext): Commands {
        if (!commands) {
            commands = new Commands(ctx);
        }
        return commands;
    }

    async download(fileUri?: vscode.Uri) {
        const impUrl = await vscode.window.showInputBox({
            prompt: "URL", placeHolder: "https://observablehq.com/@user/notebook"
        });
        if (impUrl) {
            const isShared = impUrl.indexOf("https://observablehq.com/d") === 0;
            const nb = await fetch(impUrl.replace(`https://observablehq.com/${isShared ? "d/" : ""}`, "https://api.observablehq.com/document/"), {
                headers: {
                    origin: "https://observablehq.com",
                    referer: impUrl
                }
            }).then(r => r.json() as any);
            if (nb) {
                reporter.sendTelemetryEvent("command.download", { title: nb.title });
                const saveUri = await vscode.window.showSaveDialog({
                    defaultUri: vscode.Uri.file(`${nb.title}.ojsnb`),
                    filters: {
                        "OJS Notebook": ["ojsnb"]
                    }
                });
                if (saveUri) {
                    const buffer = Buffer.from(JSON.stringify(nb, undefined, 4));
                    vscode.workspace.fs.writeFile(saveUri, buffer);
                }
            }
        }
    }

    async cellName(cell: vscode.NotebookCell) {
        const node = serializer.node(cell);
        node.name = node.name ?? "";
        const name = await vscode.window.showInputBox({ value: node.name, title: "Result Name", placeHolder: "Result Name" });
        if (name) {
            node.name = name;
        }
    }

    async dbName(cell: vscode.NotebookCell) {
        const node = serializer.node(cell);
        const data = {
            ...node?.data
        };
        data.source = {
            name: "",
            ...node?.data?.source,
        };
        const name = await vscode.window.showInputBox({ value: data.source.name, title: "Database Name", placeHolder: "Database Name" });
        if (name) {
            node.data.source.name = name;
        }
    }
}

