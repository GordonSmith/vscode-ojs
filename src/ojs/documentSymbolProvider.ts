import { scopedLogger } from "@hpcc-js/util";
import * as vscode from "vscode";
import { Diagnostic } from "./diagnostic";
import { Meta } from "./meta";

const logger = scopedLogger("documentSymbolProvider.ts");

export let documentSymbolProvider: DocumentSymbolProvider;
export class DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    protected _ctx: vscode.ExtensionContext;

    private _diagnostic: Diagnostic;

    private constructor(ctx: vscode.ExtensionContext) {
        this._ctx = ctx;
        ctx.subscriptions.push(vscode.languages.registerDocumentSymbolProvider("ojs", this));
        ctx.subscriptions.push(vscode.languages.registerDocumentSymbolProvider("omd", this));
        this._diagnostic = Diagnostic.attach(ctx);
    }

    static attach(ctx: vscode.ExtensionContext): DocumentSymbolProvider {
        if (!documentSymbolProvider) {
            documentSymbolProvider = new DocumentSymbolProvider(ctx);
        }
        return documentSymbolProvider;
    }

    provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
        const retVal: vscode.DocumentSymbol[] = [];

        const meta = Meta.attach(document);
        const cells = meta.parse();
        cells.forEach(cell => {
            retVal.push(cell.documentSymbol());
        });

        return retVal;
    }
}
