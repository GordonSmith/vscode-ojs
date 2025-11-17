import * as vscode from "vscode";
import { createWriteStream, existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, relative } from "node:path";
import { getInterpreterCachePath, getInterpreterCommand } from "../../../refs/notebook-kit/src/interpreters";
import { getInterpreterMethod, isInterpreter } from "../../../refs/notebook-kit/src/lib/interpreters";
import { type Notebook, type Cell, toCell } from "../compiler";
import { OBSERVABLE_KIT_MIME, vscode2observable, NotebookCell } from "../common/types";
import { spawn } from "node:child_process";

export class NotebookKitController {
    readonly controllerId: string;
    readonly notebookType: string;
    readonly label = "ObservableHQ Notebook";
    readonly supportedLanguages = Object.keys(vscode2observable);

    private readonly _controller: vscode.NotebookController;
    private _executionOrder = 0;

    constructor(notebookType: string) {
        this.controllerId = `${notebookType}-kernel`;
        this.notebookType = notebookType;
        this._controller = vscode.notebooks.createNotebookController(
            this.controllerId,
            this.notebookType,
            this.label
        );

        this._controller.supportedLanguages = this.supportedLanguages;
        this._controller.supportsExecutionOrder = true;
        this._controller.executeHandler = this.execute.bind(this);
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

    // Need unique cell IDs for copy+paste cells
    private _tmpID = 500000;
    private async executeCellContent(cell: vscode.NotebookCell, notebook: vscode.NotebookDocument): Promise<vscode.NotebookCellOutput | undefined> {
        // const stuff = await fetch("https://api.observablehq.com/search?query=3d+plot&sort=relevance&direction=desc&page=1").then(response => response.json());
        const cellText = cell.document.getText();
        const outputData: NotebookCell = {
            notebook: notebook.metadata as Notebook,
            cell: toCell({ id: this._tmpID + cell.index, ...cell.metadata as Cell }),
            cellText: cellText
        };
        outputData.cell.mode = vscode2observable[cell.document.languageId];
        if (isInterpreter(cell.metadata.mode)) {
            const sourcePath = notebook.uri.fsPath;
            const sourceDir = dirname(sourcePath);
            const cachePath = await getInterpreterCachePath(sourcePath, cell.metadata.mode, cell.metadata.format, cellText);
            if (!existsSync(cachePath)) {
                await mkdir(dirname(cachePath), { recursive: true });
                const [command, args] = getInterpreterCommand(cell.metadata.mode);
                const child = spawn(command, args, { cwd: sourceDir });
                child.stdin.end(cellText);
                child.stderr.pipe(process.stderr);
                child.stdout.pipe(createWriteStream(cachePath));
                await new Promise((resolve, reject) => {
                    child.on("error", reject);
                    child.on("exit", resolve); // TODO check exit code
                });
            }
            outputData.cell.mode = "js";
            outputData.cellText = `FileAttachment(${JSON.stringify(relative(sourceDir, cachePath))})${getInterpreterMethod(outputData.cell.format)}`;
            outputData.cell.value = outputData.cellText;
        }

        return new vscode.NotebookCellOutput([
            vscode.NotebookCellOutputItem.json(outputData, OBSERVABLE_KIT_MIME)
        ]);
    }
}
