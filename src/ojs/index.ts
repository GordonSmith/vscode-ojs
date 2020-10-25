import { ExtensionContext, WebviewPanel, window } from "vscode";
import { Commands } from "./command";
import { Diagnostic } from "./diagnostic";
import { DocumentSymbolProvider } from "./documentSymbolProvider";
import { Editor } from "./editor";
import { HoverProvider } from "./hoverProvider";
import { Preview } from "./preview";

export function activate(context: ExtensionContext) {
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
