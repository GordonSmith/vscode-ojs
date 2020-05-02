import { scopedLogger } from "@hpcc-js/util";
import * as vscode from "vscode";
import { Diagnostic } from "./diagnostic";
import { diagnostics, parse } from "./grammar";

const logger = scopedLogger("documentSymbolProvider.ts");

export let documentSymbolProvider: DocumentSymbolProvider;
export class DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    protected _ctx: vscode.ExtensionContext;

    protected _diagnostic: Diagnostic;

    private constructor(ctx: vscode.ExtensionContext) {
        this._ctx = ctx;
        ctx.subscriptions.push(vscode.languages.registerDocumentSymbolProvider("ojs", this));
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

        function range(item) {
            return (item && item.start !== undefined && item.end !== undefined) ? new vscode.Range(document.positionAt(item.start), document.positionAt(item.end)) : undefined;
        }

        function kind(cell): vscode.SymbolKind {
            switch (cell?.body?.type) {
                case "Literal":
                    return vscode.SymbolKind.Constant;
                case "BlockStatement":
                    return vscode.SymbolKind.Function;
                case "ImportDeclaration":
                    return vscode.SymbolKind.Package;
                case "ViewExpression":
                    return vscode.SymbolKind.Object;
            }
            return vscode.SymbolKind.Variable;
        }

        function label(cell): string {
            if (cell?.id?.name) {
                return cell?.id?.name;
            } else if (cell?.body?.source?.value) {
                return cell?.body?.source?.value;
            }
            return "...";
        }

        function addSymbol(name: string | undefined, detail: string, kind: vscode.SymbolKind, range: vscode.Range, selectionRange?: vscode.Range) {
            if (name) {
                retVal.push(new vscode.DocumentSymbol(name, detail, kind, range, selectionRange || range));
            }
        }

        const parsed = parse(document.getText());
        parsed.cells.forEach(cell => {
            const fullRange = range(cell);
            const idRange = range(cell.id);
            const bodyRange = range(cell.body);
            addSymbol(label(cell), cell.body.type, kind(cell), fullRange, idRange);
            // switch (cell.content?.type) {
            //     case "assignment":
            //         const assign = cell.content as assignment;
            //         addSymbol(assign.lhs?.id?.image, "assignment - " + (assign.errors.length ? "partial" : "full"), vscode.SymbolKind.Variable, cell.range, assign.lhs?.range);
            //         break;
            //     case "declaration":
            //         const decl = cell.content as declaration;
            //         addSymbol(decl.id?.image, "declaration - " + (decl.errors.length ? "partial" : "full"), vscode.SymbolKind.Variable, cell.range, decl.id?.range);
            //         break;
            // }
        });

        this._diagnostic.setQuick(document.uri, diagnostics(document, parsed.errors));

        return retVal;
    }
}
