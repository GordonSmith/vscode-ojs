import * as vscode from "vscode";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import { parseCell } from "@hpcc-js/observable-shim";
import { ohq, ojs2notebook } from "@hpcc-js/observablehq-compiler";
import { reporter } from "../../telemetry/index";

function encode(str: string) {
    return str
        .split("`").join("\\`")
        ;
}

export interface OJSCell {
    node: ohq.Node
    ojsSource: string;
}

export interface OJSOutput {
    uri: string;
    folder: string;
    notebook: ohq.Notebook;
    cell: OJSCell;
    otherCells: OJSCell[]
}

export class Controller {
    readonly controllerId = "ojs-kernal";
    readonly notebookType = "ojs-notebook";
    readonly label = "OJS Notebook";
    readonly supportedLanguages = ["ojs", "omd", "html", "svg", "dot", "mermaid", "tex", "sql", "javascript"];

    private readonly _controller: vscode.NotebookController;
    private _executionOrder = 0;

    private _ojsMessagaging: vscode.NotebookRendererMessaging;

    constructor() {
        this._controller = vscode.notebooks.createNotebookController(
            this.controllerId,
            this.notebookType,
            this.label
        );

        this._controller.supportedLanguages = this.supportedLanguages;
        this._controller.supportsExecutionOrder = true;
        this._controller.executeHandler = this.execute.bind(this);

        vscode.workspace.onDidChangeNotebookDocument(evt => {
        });
    }

    dispose() {
        this._controller.dispose();
    }

    ojsSource(cell: vscode.NotebookCell) {
        switch (cell.document.languageId) {
            case "ojs":
                return cell.document.getText();
            case "omd":
                return `md\`${encode(cell.document.getText())}\``;
            case "html":
                return `htl.html\`${encode(cell.document.getText())}\``;
            case "tex":
                return `tex.block\`${encode(cell.document.getText())}\``;
            case "sql":
                return `${cell.metadata.node?.name} = db.sql\`${encode(cell.document.getText())}\`;`;
            case "javascript":
                return `{${cell.document.getText()}}`;
            default:
                return `${cell.document.languageId}\`${cell.document.getText()}\``;
        }
    }

    private ojsCell(cell: vscode.NotebookCell): OJSCell {
        return {
            node: cell.metadata.node ?? { id: uuidv4(), mode: cell.document.languageId, value: cell.document.getText() },
            ojsSource: this.ojsSource(cell)
        };
    }

    private ojsOutput(cell: vscode.NotebookCell, uri: vscode.Uri, otherCells: vscode.NotebookCell[]): OJSOutput {
        const folder = path.dirname(cell.document.uri.path);

        return {
            uri: uri.toString(),
            folder,
            notebook: cell.notebook.metadata.notebook,
            cell: this.ojsCell(cell),
            otherCells: otherCells.map(c => this.ojsCell(c))
        };
    }

    private executeOJS(cell: vscode.NotebookCell, notebook: vscode.NotebookDocument, otherCells: vscode.NotebookCell[]): vscode.NotebookCellOutputItem {
        try {
            parseCell(this.ojsSource(cell));
        } catch (e: any) {
            const msg = e?.message ?? "Unknown Error";
            return vscode.NotebookCellOutputItem.stderr(msg);
        }
        const ojsOutput = this.ojsOutput(cell, notebook.uri, otherCells);
        return vscode.NotebookCellOutputItem.json(ojsOutput, "application/gordonsmith.ojs+json");
    }

    private async executeCell(cell: vscode.NotebookCell, notebook: vscode.NotebookDocument, otherCells: vscode.NotebookCell[]) {
        const execution = this._controller.createNotebookCellExecution(cell);
        execution.executionOrder = ++this._executionOrder;
        execution.start(Date.now());
        if (cell.outputs.length === 0) {
            await execution.replaceOutput(new vscode.NotebookCellOutput([], {}));
        }
        const cellOutput = cell.outputs[0];
        const outputItems: vscode.NotebookCellOutputItem[] = [];
        switch (cell.document.languageId) {
            case "ojs":
            case "html":
            case "dot":
            case "mermaid":
            default:
                outputItems.push(this.executeOJS(cell, notebook, otherCells));
                break;
        }
        await execution.replaceOutputItems(outputItems, cellOutput);
        execution.end(outputItems.length === 1 && outputItems[0].mime.indexOf(".stderr") < 0, Date.now());
    }

    private async execute(cells: vscode.NotebookCell[], notebook: vscode.NotebookDocument): Promise<void> {
        for (const cell of cells) {
            reporter.sendTelemetryEvent("controller.execute.cell");
            this.executeCell(cell, notebook, cells.filter(c => c !== cell));
        }
    }
}
