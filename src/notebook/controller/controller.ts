import * as vscode from "vscode";
import * as path from "path";
import { observablehq as ohq } from "../../compiler/types";

function encodeID(id: string) {
    return id.split(" ").join("_");
}

export interface OJSOutput {
    uri: string;
    ojsSource: string;
    folder: string;
    notebook: ohq.Notebook;
}

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
                case "fetchConfigs":
                    ojsMessagaging.postMessage({
                        type: "fetchConfigsResponse",
                        configurations: "hello"
                    }, event.editor);
                    break;
            }
        });

        vscode.workspace.onDidChangeNotebookDocument(evt => {
            // evt.notebook.uri.toString();
        });
    }

    dispose() {
        this._controller.dispose();
    }

    private async executeOJS(cell: vscode.NotebookCell, uri: vscode.Uri): Promise<vscode.NotebookCellOutputItem> {

        // debugger;

        // function qt(a) {
        //     console.log(a, this);
        // }

        // const qt2 = new Function("a", "debugger; console.log(a, this);");

        // qt("111");
        // qt.call("222", "333");
        // qt2("444");
        // qt2.call("555", "666");
        // // qt.apply("444", "555");

        const retVal: OJSOutput = {
            uri: uri.toString(),
            ojsSource: cell.document.languageId === "ojs" ?
                cell.document.getText() :
                `${cell.document.languageId}\`${cell.document.getText()}\``,
            folder: path.dirname(cell.document.uri.path),
            notebook: cell.notebook.metadata.notebook
        };
        return vscode.NotebookCellOutputItem.json(retVal, "application/gordonsmith.ojs+json");
    }

    private async executeCell(cell: vscode.NotebookCell, notebook: vscode.NotebookDocument): Promise<void> {
        const execution = this._controller.createNotebookCellExecution(cell);
        execution.executionOrder = ++this._executionOrder;
        execution.start(Date.now());
        const cellOutput = new vscode.NotebookCellOutput([], {});
        await execution.replaceOutput(cellOutput);
        switch (cell.document.languageId) {
            case "ojs":
            case "html":
                cellOutput.items.push(await this.executeOJS(cell, notebook.uri));
                break;
        }
        await execution.replaceOutput(cellOutput);
        execution.end(true, Date.now());
    }

    private async execute(cells: vscode.NotebookCell[], notebook: vscode.NotebookDocument): Promise<void> {
        for (const cell of cells) {
            await this.executeCell(cell, notebook);
        }
    }
}
