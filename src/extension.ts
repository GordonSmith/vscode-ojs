import { ExtensionContext } from "vscode";
import { activate as ojsActivate } from "./ojs/index";
import { activate as notebookActivate } from "./notebook/index";

export function activate(context: ExtensionContext) {
    ojsActivate(context);
    notebookActivate(context);
}
