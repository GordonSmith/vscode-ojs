import { ExtensionContext } from "vscode";
import { Commands } from "./command";
import { Diagnostic } from "./diagnostic";
import { DocumentSymbolProvider } from "./documentSymbolProvider";
import { Editor } from "./editor";

export function activate(context: ExtensionContext) {
    Diagnostic.attach(context);
    DocumentSymbolProvider.attach(context);
    Commands.attach(context);
    Editor.attach(context);
}
