import * as vscode from "vscode";
import { activate as ojsActivate } from "./ojs/index";
import { activate as notebookActivate } from "./notebook/index";
import { activate as notebookKitActivate } from "./notebook-kit/index";
import { activate as telemetryActivate, deactivate as telemetryDeactivate, reporter } from "./telemetry/index";
import { HTMLNotebookDetector } from "./util/htmlNotebookDetector";

let htmlNotebookDecorationProvider: HTMLNotebookDetector;

export function activate(context: vscode.ExtensionContext): void {
    performance.mark("extension-start");
    telemetryActivate(context);

    ojsActivate(context);
    notebookActivate(context);
    notebookKitActivate(context);

    htmlNotebookDecorationProvider = new HTMLNotebookDetector();
    context.subscriptions.push(
        vscode.window.registerFileDecorationProvider(htmlNotebookDecorationProvider),
        htmlNotebookDecorationProvider,
    );

    reporter.sendTelemetryEvent("initialized");
}

export function deactivate(): void {
    htmlNotebookDecorationProvider?.dispose();
    telemetryDeactivate();
}
