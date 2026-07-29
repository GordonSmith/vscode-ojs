import { ExtensionContext, languages, workspace, window } from "vscode";
import { NotebookKitController } from "./controller/controller";
import { NotebookKitSerializer } from "./controller/serializer";
import { HTMLNotebookDetector } from "./common/notebook-detector";
import { Commands } from "./commands";
import { NotebookKitDocumentFormatter } from "./formatter/documentFormattingEditProvider";
import { NOTEBOOK_KIT_FORMAT_LANGUAGES } from "./formatter/format";
import { RawDocumentFormatterRegistration } from "./formatter/rawDocumentFormatterRegistration";

let htmlNotebookDecorationProvider;

const NOTEBOOK_TYPES = ["notebook-kit-default", "notebook-kit-option"] as const;

export function activate(ctx: ExtensionContext): void {
    ctx.subscriptions.push(workspace.registerNotebookSerializer("notebook-kit-default", NotebookKitSerializer.attach(), { transientOutputs: true, transientDocumentMetadata: {}, transientCellMetadata: {} }));
    ctx.subscriptions.push(new NotebookKitController("notebook-kit-default"));
    Commands.attach(ctx);
    htmlNotebookDecorationProvider = new HTMLNotebookDetector("notebook-kit-option");
    ctx.subscriptions.push(window.registerFileDecorationProvider(htmlNotebookDecorationProvider), htmlNotebookDecorationProvider);
    ctx.subscriptions.push(workspace.registerNotebookSerializer("notebook-kit-option", NotebookKitSerializer.attach(), { transientOutputs: true, transientDocumentMetadata: {}, transientCellMetadata: {} }));
    ctx.subscriptions.push(new NotebookKitController("notebook-kit-option"));

    const formatter = new NotebookKitDocumentFormatter();
    const formatterSelector = NOTEBOOK_TYPES.flatMap(notebookType =>
        NOTEBOOK_KIT_FORMAT_LANGUAGES.map(language => ({ notebookType, language }))
    );
    ctx.subscriptions.push(
        languages.registerDocumentFormattingEditProvider(formatterSelector, formatter),
        new RawDocumentFormatterRegistration(formatter)
    );
}

export function deactivate(): void {
    htmlNotebookDecorationProvider?.dispose();
    htmlNotebookDecorationProvider = undefined;
}
