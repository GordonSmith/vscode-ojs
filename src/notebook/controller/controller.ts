import * as vscode from "vscode";
import * as path from "path";
import { observablehq as ohq } from "../../compiler/types";
import { Notebook } from "../../compiler/notebook";
import { Cell } from "../../compiler/cell";
import { parseCell } from "../../compiler/parser";

export interface OJSOutput {
    uri: string;
    ojsSource: string;
    folder: string;
    notebook: ohq.Notebook;
}

const notebooks: { [uri: string]: { notebook: Notebook, cells: { [id: string]: Cell } } } = {};

export class Controller {
    readonly controllerId = "ojs-kernal";
    readonly notebookType = "ojs-notebook";
    readonly label = "OJS Notebook";
    readonly supportedLanguages = ["ojs", "html", "svg", "dot"];

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

        const ojsMessagaging = vscode.notebooks.createRendererMessaging("ojs-notebook-renderer");
        ojsMessagaging.onDidReceiveMessage(event => {
            switch (event.message.command) {
                case "renderOutputItem":
                    break;
                case "disposeOutputItem":
                    break;
            }
            // ojsMessagaging.postMessage({
            //     type: "fetchConfigsResponse",
            //     configurations: "hello"
            // }, event.editor);
        });

        vscode.workspace.onDidChangeNotebookDocument(evt => {
            // evt.notebook.uri.toString();
        });
    }

    dispose() {
        this._controller.dispose();
    }

    ojsSource(cell: vscode.NotebookCell) {
        return cell.document.languageId === "ojs" ?
            cell.document.getText() :
            `${cell.document.languageId}\`${cell.document.getText()}\``;
    }

    private async executeOJS(cell: vscode.NotebookCell, uri: vscode.Uri): Promise<vscode.NotebookCellOutputItem> {

        const retVal: OJSOutput = {
            uri: uri.toString(),
            ojsSource: this.ojsSource(cell),
            folder: path.dirname(cell.document.uri.path),
            notebook: cell.notebook.metadata.notebook
        };
        return vscode.NotebookCellOutputItem.json(retVal, "application/gordonsmith.ojs+json");
    }

    private async executeCell(cell: vscode.NotebookCell, notebook: vscode.NotebookDocument): Promise<void> {
        const execution = this._controller.createNotebookCellExecution(cell);
        execution.executionOrder = ++this._executionOrder;
        execution.start(Date.now());
        const success = true;
        // try {
        //     await parseCell(this.ojsSource(cell));
        // } catch (e) {
        //     success = false;
        // }
        const cellOutput = new vscode.NotebookCellOutput([], {});
        await execution.replaceOutput(cellOutput);
        switch (cell.document.languageId) {
            case "ojs":
            case "html":
                cellOutput.items.push(await this.executeOJS(cell, notebook.uri));
                break;
        }
        await execution.replaceOutput(cellOutput);
        execution.end(success, Date.now());
    }

    private async execute(cells: vscode.NotebookCell[], notebook: vscode.NotebookDocument): Promise<void> {
        // const visible = vscode.window.activeNotebookEditor?.visibleRanges;
        for (const cell of cells) {
            await this.executeCell(cell, notebook);
            // if (cells.length > 1) {
            //     await vscode.window.activeNotebookEditor?.revealRange(new vscode.NotebookRange(cell.index, cell.index));
            // }
        }
        // if (cells.length > 1 && visible?.length) {
        //     await vscode.window.activeNotebookEditor?.revealRange(visible[0]);
        // }
    }
}
