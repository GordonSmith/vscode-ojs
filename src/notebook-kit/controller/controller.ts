import * as vscode from "vscode";
import { type Cell } from "@observablehq/notebook-kit";
import { OBSERVABLE_KIT_MIME, vscode2observable, NotebookCell } from "../common/types";

export class NotebookKitController {
    readonly controllerId = "observable-kit-kernel";
    readonly notebookType = "onb-notebook-kit";
    readonly label = "Observable Notebook Kit";
    readonly supportedLanguages = Object.keys(vscode2observable);

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

        // Handle notebook document changes
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

    private async execute(
        cells: vscode.NotebookCell[],
        notebook: vscode.NotebookDocument,
        controller: vscode.NotebookController
    ): Promise<void> {
        for (const cell of cells) {
            await this.executeCell(cell, notebook);
        }
    }

    private async executeCell(
        cell: vscode.NotebookCell,
        notebook: vscode.NotebookDocument
    ): Promise<void> {
        const execution = this._controller.createNotebookCellExecution(cell);
        execution.executionOrder = ++this._executionOrder;
        execution.start(Date.now());

        try {
            const output = await this.executeCellContent(cell, notebook);
            if (output) {
                await execution.replaceOutput([output]);
            }
            execution.end(true, Date.now());
        } catch (error) {
            const errorOutput = new vscode.NotebookCellOutput([
                vscode.NotebookCellOutputItem.error(error as Error)
            ]);
            await execution.replaceOutput([errorOutput]);
            execution.end(false, Date.now());
        }
    }

    private async executeCellContent(
        cell: vscode.NotebookCell,
        notebook: vscode.NotebookDocument
    ): Promise<vscode.NotebookCellOutput | undefined> {
        const cellText = cell.document.getText();
        const outputData: NotebookCell = {
            metadata: cell.metadata as Cell,
            cellText
        };
        return new vscode.NotebookCellOutput([
            vscode.NotebookCellOutputItem.json(outputData, OBSERVABLE_KIT_MIME)
        ]);
    }
}
