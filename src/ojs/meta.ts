import { ojsParse, omdParse } from "@hpcc-js/observable-md/dist/index.node.js";
import { hashSum } from "@hpcc-js/util";
import * as vscode from "vscode";
import type { Value } from "../webview";
import { diagnostic } from "./diagnostic";

function range(doc, start, end) {
    return new vscode.Range(doc.positionAt(start), doc.positionAt(end));
}

const meta: Map<string, Meta> = new Map<string, Meta>();
export class Cell {

    readonly id: string;
    readonly uid: string;
    readonly idRange: vscode.Range | undefined;
    readonly range: vscode.Range;

    constructor(private _doc: vscode.TextDocument, private _cell) {
        if (_cell.id) {
            this.id = _cell.input.substring(_cell.id.start, _cell.id.end);
            this.idRange = range(this._doc, _cell.id.start, _cell.id.end);
        }
        this.uid = hashSum(_cell.input.substring(_cell.start, _cell.end));
        this.range = range(this._doc, this._cell.start, this._cell.end);
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
        return range(this._doc, this._cell.body.start, this._cell.body.end);
    }

    symbolKind(): vscode.SymbolKind {
        switch (this._cell?.body?.type) {
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

    label() {
        return this.id ? this.id : "...";
    }

    documentSymbol(): vscode.DocumentSymbol {
        return new vscode.DocumentSymbol(this.label(), this._cell.body.type, this.symbolKind(), this.range, this.idRange || this.range);
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
                let parsed;
                switch (this._doc.languageId) {
                    case "omd":
                        parsed = omdParse(this._doc.getText());
                        break;
                    case "ojs":
                    default:
                        parsed = ojsParse(this._doc.getText());
                        break;
                }

                this._cells = parsed.cells.map(cell => new Cell(this._doc, cell));
                this._cells.forEach(cell => {
                    this._cellMap[cell.uid] = cell;
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
        const includeValues = ojsConfig.get<boolean>("showRuntimeValues");
        const errors: vscode.Diagnostic[] = [];
        this._cells.forEach(cell => {
            if (includeValues || cell.value.error) {
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
