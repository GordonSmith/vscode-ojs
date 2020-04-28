import { ExtensionContext } from "vscode";
import { Commands } from "./extension/command";
import { Diagnostic } from "./extension/diagnostic";
import { DocumentSymbolProvider } from "./extension/documentSymbolProvider";
import { Editor } from "./extension/editor";

export function activate(context: ExtensionContext) {
    Diagnostic.attach(context);
    DocumentSymbolProvider.attach(context);
    Commands.attach(context);
    Editor.attach(context);
}
