import { ExtensionContext, workspace } from "vscode";
import { NotebookKitController } from "./controller/controller";
import { NotebookKitSerializer } from "./controller/serializer";
import { Commands } from "./commands";

export function activate(ctx: ExtensionContext) {
    ctx.subscriptions.push(
        workspace.registerNotebookSerializer(
            "notebook-kit",
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
