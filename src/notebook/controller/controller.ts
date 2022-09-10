import * as vscode from "vscode";
import * as path from "path";
import { ohq, parseCell } from "@hpcc-js/observablehq-compiler";
import { reporter } from "../../telemetry/index";
import { LanguageId, Languages, text2value } from "./util";

export interface OJSOutput {
    notebook: ohq.Notebook;
    folder: string;
    uri: string;
    languageId: LanguageId;
    text: string;
}

export class Controller {
    readonly controllerId = "ojs-kernal";
    readonly notebookType = "ojs-notebook";
    readonly label = "OJS Notebook";
    readonly supportedLanguages = Languages;

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

    private ojsOutput(cell: vscode.NotebookCell, uri: vscode.Uri): OJSOutput {
        if (Languages.indexOf(cell.document.languageId as LanguageId) < 0) {
            console.error(`Unknown languageID:  ${cell.document.languageId}`);
        }
        return {
            notebook: cell.notebook.metadata.notebook,
            folder: path.dirname(cell.document.uri.path),
            uri: uri.toString(),
            languageId: cell.document.languageId as LanguageId,
            text: cell.document.getText()
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
            await parseCell(text2value(cell.document.languageId as LanguageId, cell.document.getText()));
        } catch (e) {
            success = false;
        }
        const oldId = this._oldId.get(cell);
        const cellOutput = new vscode.NotebookCellOutput([], {});
        await execution.replaceOutput(cellOutput);
        this._oldId.set(cell, (cellOutput as any).id);
        const ojsOutput = this.ojsOutput(cell, notebook.uri);
        cellOutput.items.push(this.executeOJS(ojsOutput));
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
