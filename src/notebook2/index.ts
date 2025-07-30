import * as vscode from "vscode";
import { NotebookKitController } from "./controller/controller";
import { NotebookKitSerializer } from "./controller/serializer";
import { Commands } from "./controller/commands";

export function activate(ctx: vscode.ExtensionContext) {
    // Register the notebook serializer for Observable Notebook Kit format
    ctx.subscriptions.push(
        vscode.workspace.registerNotebookSerializer(
            "onb-notebook-kit",
            NotebookKitSerializer.attach(),
            {
                transientOutputs: true,
                transientDocumentMetadata: {}
            }
        )
    );

    // Register the notebook controller
    ctx.subscriptions.push(new NotebookKitController());

    // Register commands
    Commands.attach(ctx);
}
