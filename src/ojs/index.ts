import { ExtensionContext, WebviewPanel, window } from "vscode";
import { Commands } from "./command";
import { Diagnostic } from "./diagnostic";
import { DocumentSymbolProvider } from "./documentSymbolProvider";
import { Editor } from "./editor";
import { HoverProvider } from "./hoverProvider";
import { LanguageService } from "./languageService";
import { Preview } from "./preview";

export async function activate(context: ExtensionContext) {

    LanguageService.attach(context);
    Diagnostic.attach(context);
    DocumentSymbolProvider.attach(context);
    HoverProvider.attach(context);
    Commands.attach(context);
    Editor.attach(context);

    window.registerWebviewPanelSerializer(Preview.viewType, {
        async deserializeWebviewPanel(webviewPanel: WebviewPanel) {
            Preview.revive(webviewPanel, context);
        }
    });
}

export function deactivate() {
    return LanguageService.detach();
}