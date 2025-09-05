import { ExtensionContext, workspace, window } from "vscode";
import { NotebookKitController } from "./controller/controller";
import { NotebookKitSerializer } from "./controller/serializer";
import { HTMLNotebookDetector } from "./common/notebook-detector";
import { Commands } from "./commands";

let htmlNotebookDecorationProvider;

export function activate(ctx: ExtensionContext) {
    ctx.subscriptions.push(workspace.registerNotebookSerializer("notebook-kit-default", NotebookKitSerializer.attach(), { transientOutputs: true, transientDocumentMetadata: {}, transientCellMetadata: {} }));
    ctx.subscriptions.push(new NotebookKitController("notebook-kit-default"));
    Commands.attach(ctx);
    htmlNotebookDecorationProvider = new HTMLNotebookDetector("notebook-kit-option");
    ctx.subscriptions.push(window.registerFileDecorationProvider(htmlNotebookDecorationProvider), htmlNotebookDecorationProvider);
    ctx.subscriptions.push(workspace.registerNotebookSerializer("notebook-kit-option", NotebookKitSerializer.attach(), { transientOutputs: true, transientDocumentMetadata: {}, transientCellMetadata: {} }));
    ctx.subscriptions.push(new NotebookKitController("notebook-kit-option"));
}

export function deactivate() {
    htmlNotebookDecorationProvider?.dispose();
    htmlNotebookDecorationProvider = undefined;
}
