import { ExtensionContext } from "vscode";
import { Commands } from "./command";
import { Diagnostic } from "./diagnostic";
import { DocumentSymbolProvider } from "./documentSymbolProvider";
import { Editor } from "./editor";
import { HoverProvider } from "./hoverProvider";

export function activate(context: ExtensionContext) {
    Diagnostic.attach(context);
    DocumentSymbolProvider.attach(context);
    HoverProvider.attach(context);
    Commands.attach(context);
    Editor.attach(context);
}
