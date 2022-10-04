import { omd2notebook, ojs2notebook, ohq } from "@hpcc-js/observablehq-compiler";
import { hashSum } from "@hpcc-js/util";
import * as vscode from "vscode";
import type { Value } from "../webview";
import { diagnostic } from "./diagnostic";

function range(doc, start, end) {
    return new vscode.Range(doc.positionAt(start), doc.positionAt(end));
}

const meta: Map<string, Meta> = new Map<string, Meta>();
export class Cell {

    readonly id: string | number;
    readonly idRange: vscode.Range | undefined;
    readonly range: vscode.Range;

    constructor(private _doc: vscode.TextDocument, private _node: ohq.Node) {
        if (_node.id) {
            this.id = _node.id;
            this.idRange = range(this._doc, _node.start, _node.end);
        }
        this.range = range(this._doc, this._node.start, this._node.end);
    }

    value = {
        error: false,
        value: ""
    };

    update(error: boolean, value: string) {
        this.value = {
            error,
            value
        };
    }

    bodyRange(): vscode.Range {
        return range(this._doc, this._node.start, this._node.end);
    }

    symbolKind(): vscode.SymbolKind {
        // switch (this._node?.body?.type) {
        //     case "Literal":
        //         return vscode.SymbolKind.Constant;
        //     case "BlockStatement":
        //         return vscode.SymbolKind.Function;
        //     case "ImportDeclaration":
        //         return vscode.SymbolKind.Package;
        //     case "ViewExpression":
        //         return vscode.SymbolKind.Object;
        // }
        return vscode.SymbolKind.Variable;
    }

    label() {
        return this.id ? "" + this.id : "...";
    }

    documentSymbol(): vscode.DocumentSymbol {
        return new vscode.DocumentSymbol(this.label(), "Unknown", this.symbolKind(), this.range, this.idRange || this.range);
    }

    hover(): vscode.Hover {
        return new vscode.Hover([this.label(), this.value.value], this.range);
    }
}

export class Meta {

    private _doc: vscode.TextDocument;

    private constructor() {
    }

    static attach(doc: vscode.TextDocument): Meta {
        if (!meta.has(doc.uri.fsPath)) {
            meta.set(doc.uri.fsPath, new Meta());
        }
        const m = meta.get(doc.uri.fsPath)!;
        if (!m._doc || m._doc.version < doc.version) {
            return m.refresh(doc);
        }
        return m;
    }

    private _prevVersion;
    private _cells: Cell[] = [];
    private _cellMap: { [uid: string]: Cell } = {};
    private _errors: vscode.Diagnostic[] = [];
    parse(): Cell[] {
        if (this._prevVersion !== this._doc.version) {
            this._prevVersion = this._doc.version;
            this._cells = [];
            this._cellMap = {};
            this._errors = [];
            try {
                let parsed: ohq.Notebook;
                switch (this._doc.languageId) {
                    case "ojsnb":
                        parsed = JSON.parse(this._doc.getText());
                        break;
                    case "omd":
                        parsed = omd2notebook(this._doc.getText());
                        break;
                    case "ojs":
                    default:
                        parsed = ojs2notebook(this._doc.getText());
                        break;
                }

                this._cells = parsed.nodes.map(node => new Cell(this._doc, node));
                this._cells.forEach(cell => {
                    this._cellMap[cell.id] = cell;
                });
            } catch (e: any) {
                const pos = e.pos || 0;
                let raisedAt = e.raisedAt || pos;
                raisedAt += raisedAt === pos ? 1 : 0;
                if (raisedAt) {
                    this._errors.push(new vscode.Diagnostic(range(this._doc, pos, raisedAt), e.message, vscode.DiagnosticSeverity.Error));
                }
            }
        }
        diagnostic.setQuick(this._doc.uri, this._errors);
        return this._cells;
    }

    refresh(doc: vscode.TextDocument): this {
        this._doc = doc;
        this.parse();
        return this;
    }

    update(values: Value[]) {
        values.forEach(v => {
            const cell = this._cellMap[v.uid];
            cell.value = {
                error: v.error,
                value: v.value
            };
        });
        this.updateRuntimeValues();
    }

    updateRuntimeValues() {
        const ojsConfig = vscode.workspace.getConfiguration("ojs");
        const includeValues = false;//ojsConfig.get<boolean>("showRuntimeValues");
        const errors: vscode.Diagnostic[] = [];
        this._cells.forEach(cell => {
            if ((includeValues || cell.value.error) && cell.value.value) {
                errors.push(new vscode.Diagnostic(cell.idRange || cell.range, cell.value.value, cell.value.error ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Information));
            }
        });
        diagnostic.setRuntime(this._doc.uri, errors);
    }

    hover(pos: vscode.Position) {
        const found = this._cells.filter(c => c.range.contains(pos));
        if (found.length) {
            return found[0].hover();
        }
    }

}
