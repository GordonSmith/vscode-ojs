import { ExtensionContext, workspace } from "vscode";
import { NotebookKitController } from "./controller/controller";
import { NotebookKitSerializer } from "./controller/serializer";
import { Commands } from "./commands";

export function activate(ctx: ExtensionContext) {
    // Register the notebook serializer for Observable Notebook Kit format
    ctx.subscriptions.push(
        workspace.registerNotebookSerializer(
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
