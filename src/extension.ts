import { ExtensionContext } from "vscode";
import { activate as ojsActivate } from "./ojs/index";

export function activate(context: ExtensionContext) {
    ojsActivate(context);
}
