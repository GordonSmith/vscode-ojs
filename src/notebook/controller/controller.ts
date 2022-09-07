import * as vscode from "vscode";
import * as path from "path";
import { observablehq as ohq } from "../../compiler/types";
import { parseCell } from "../../compiler/parser";
import { reporter } from "../../telemetry/index";

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

    private _ojsMessagaging: vscode.NotebookRendererMessaging;

    private _oldId = new Map<vscode.NotebookCell, string>();

    constructor() {
        this._controller = vscode.notebooks.createNotebookController(
            this.controllerId,
            this.notebookType,
            this.label
        );

        this._controller.supportedLanguages = this.supportedLanguages;
        this._controller.supportsExecutionOrder = true;
        this._controller.executeHandler = this.execute.bind(this);

        this._ojsMessagaging = vscode.notebooks.createRendererMessaging("ojs-notebook-renderer");
        this._ojsMessagaging.onDidReceiveMessage(event => {
            switch (event.message.command) {
                case "renderOutputItem":
                    break;
                case "disposeOutputItem":
                    break;
            }
        });

        vscode.workspace.onDidChangeNotebookDocument(evt => {
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

    private ojsOutput(cell: vscode.NotebookCell, uri: vscode.Uri): OJSOutput {

        return {
            uri: uri.toString(),
            ojsSource: this.ojsSource(cell),
            folder: path.dirname(cell.document.uri.path),
            notebook: cell.notebook.metadata.notebook
        };
    }

    private executeOJS(ojsOutput: OJSOutput): vscode.NotebookCellOutputItem {
        return vscode.NotebookCellOutputItem.json(ojsOutput, "application/gordonsmith.ojs+json");
    }

    private async executeCell(cell: vscode.NotebookCell, notebook: vscode.NotebookDocument): Promise<[string, OJSOutput, string?]> {
        const execution = this._controller.createNotebookCellExecution(cell);
        execution.executionOrder = ++this._executionOrder;
        execution.start(Date.now());
        let success = true;
        try {
            await parseCell(this.ojsSource(cell));
        } catch (e) {
            success = false;
        }
        const oldId = this._oldId.get(cell);
        const cellOutput = new vscode.NotebookCellOutput([], {});
        await execution.replaceOutput(cellOutput);
        this._oldId.set(cell, (cellOutput as any).id);
        let ojsOutput;
        switch (cell.document.languageId) {
            case "ojs":
            case "html":
                ojsOutput = this.ojsOutput(cell, notebook.uri);
                cellOutput.items.push(this.executeOJS(ojsOutput));
                break;
        }
        await execution.replaceOutput(cellOutput);
        execution.end(success, Date.now());
        return [(cellOutput as any).id, ojsOutput, oldId];
    }

    private async execute(cells: vscode.NotebookCell[], notebook: vscode.NotebookDocument): Promise<void> {
        const outputs: [string, OJSOutput, string?][] = [];
        for (const cell of cells) {
            reporter.sendTelemetryEvent("controller.execute.cell");
            outputs.push(await this.executeCell(cell, notebook));
        }
        this._ojsMessagaging.postMessage({
            command: "renderOutputItem",
            outputs
        });
    }
}
