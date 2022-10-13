import * as vscode from "vscode";
import { Controller } from "./controller/controller";
import { Serializer } from "./controller/serializer";
import { Commands } from "./controller/command";

export function activate(ctx: vscode.ExtensionContext) {
    ctx.subscriptions.push(vscode.workspace.registerNotebookSerializer("ojs-notebook", Serializer.attach(), {
        transientOutputs: true,
        transientDocumentMetadata: {
        }
    }));
    ctx.subscriptions.push(new Controller());
    Commands.attach(ctx);
}
