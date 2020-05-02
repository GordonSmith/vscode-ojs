import { ExtensionContext } from "vscode";
import { activate as ojsActivate } from "./ojs/index";
import { activate as omdActivate } from "./omd/index";

export function activate(context: ExtensionContext) {
    ojsActivate(context);
    omdActivate(context);
}
