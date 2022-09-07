import * as vscode from "vscode";
import fetch from "node-fetch";
import { reporter } from "../../telemetry/index";

export let commands: Commands;
export class Commands {
    _ctx: vscode.ExtensionContext;

    private constructor(ctx: vscode.ExtensionContext) {
        this._ctx = ctx;

        ctx.subscriptions.push(vscode.commands.registerCommand("ojs.download", this.download, this));
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

}
