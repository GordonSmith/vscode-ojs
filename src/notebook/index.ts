import * as vscode from "vscode";
import { Controller } from "./controller/controller";
import { Serializer } from "./controller/serializer";
import { Commands } from "./controller/command";
import { LanguageService } from "../ojs/languageService";

export function activate(context: vscode.ExtensionContext) {
    LanguageService.attach(context);
    context.subscriptions.push(vscode.workspace.registerNotebookSerializer("ojs-notebook", Serializer.attach(), {
        transientOutputs: true,
        transientDocumentMetadata: {
        }
    }));
    context.subscriptions.push(new Controller());
    Commands.attach(context);
}

export function deactivate() {
    return LanguageService.detach();
}