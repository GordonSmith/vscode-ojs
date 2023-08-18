import * as vscode from "vscode";
import { parseModule } from "@hpcc-js/observable-shim";
import { reporter } from "../../telemetry/index";
import { MIME, serializer } from "./serializer";

export class Controller {
    readonly controllerId = "ojs-kernal";
    readonly notebookType = "ojs-notebook";
    readonly label = "OJS Notebook";
    readonly supportedLanguages = ["ojs", "omd", "html", "svg", "dot", "mermaid", "tex", "sql", "javascript"];

    private readonly _controller: vscode.NotebookController;
    private _executionOrder = 0;

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
            for (const contentChange of evt.contentChanges) {
                for (const removed of contentChange.removedCells) {
                    const execution = this._controller.createNotebookCellExecution(removed);
                    execution.executionOrder = ++this._executionOrder;
                    execution.start(Date.now());
                    execution.clearOutput(removed);
                    execution.end(true, Date.now());
                }
            }
        });
    }

    dispose() {
        this._controller.dispose();
    }

    private executeOJS(cell: vscode.NotebookCell, notebook: vscode.NotebookDocument, otherCells: vscode.NotebookCell[]): vscode.NotebookCellOutputItem {
        try {
            parseModule(serializer.ojsSource(cell));
        } catch (e: any) {
            const msg = e?.message ?? "Unknown Error";
            return vscode.NotebookCellOutputItem.stderr(msg);
        }
        const ojsOutput = serializer.ojsOutput(cell, notebook.uri, otherCells);
        return vscode.NotebookCellOutputItem.json(ojsOutput, MIME);
    }

    private async executeCell(cell: vscode.NotebookCell, notebook: vscode.NotebookDocument, otherCells: vscode.NotebookCell[]) {
        const execution = this._controller.createNotebookCellExecution(cell);
        execution.executionOrder = ++this._executionOrder;
        execution.start(Date.now());
        const outputItems: vscode.NotebookCellOutputItem[] = [];
        switch (cell.document.languageId) {
            // case "ecl":
            //     const eclOutputItems = await this.executeECL(cell);
            //     eclOutputItems.forEach(eclOutputItem => outputItems.push(eclOutputItem));
            //     break;
            case "ojs":
            case "omd":
            case "html":
            case "svg":
            case "dot":
            case "mermaid":
            case "tex":
            case "sql":
            case "javascript":
            default:
                outputItems.push(this.executeOJS(cell, notebook, otherCells));
                break;
        }
        // serializer.node(cell).output = outputItem;
        await execution.replaceOutput([new vscode.NotebookCellOutput(outputItems)]);
        execution.end(outputItems.every(op => op.mime.indexOf(".stderr") < 0), Date.now());
    }

    private async execute(cells: vscode.NotebookCell[], notebook: vscode.NotebookDocument): Promise<void> {
        for (const cell of cells) {
            reporter.sendTelemetryEvent("controller.execute.cell");
            this.executeCell(cell, notebook, cells.filter(c => c !== cell));
        }
    }
}
