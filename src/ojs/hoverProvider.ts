import { scopedLogger } from "@hpcc-js/util";
import * as vscode from "vscode";
import { Diagnostic } from "./diagnostic";
import { Meta } from "./meta";

const logger = scopedLogger("documentSymbolProvider.ts");

export let documentSymbolProvider: HoverProvider;
export class HoverProvider implements vscode.HoverProvider {
    protected _ctx: vscode.ExtensionContext;

    protected _diagnostic: Diagnostic;

    private constructor(ctx: vscode.ExtensionContext) {
        this._ctx = ctx;
        ctx.subscriptions.push(vscode.languages.registerHoverProvider("ojs", this));
        this._diagnostic = Diagnostic.attach(ctx);
    }

    static attach(ctx: vscode.ExtensionContext): HoverProvider {
        if (!documentSymbolProvider) {
            documentSymbolProvider = new HoverProvider(ctx);
        }
        return documentSymbolProvider;
    }

    provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
        const meta = Meta.attach(document);
        return meta.hover(position);
    }
}
