import * as vscode from "vscode";
import { activate as ojsActivate } from "./ojs/index";
import { activate as notebookActivate } from "./notebook/index";
import { activate as notebookKitActivate } from "./notebook-kit/index";
import { activate as telemetryActivate, deactivate as telemetryDeactivate, reporter } from "./telemetry/index";
import { HTMLNotebookDetector } from "./util/htmlNotebookDetector";

let htmlDetector: HTMLNotebookDetector;

export function activate(context: vscode.ExtensionContext): void {
    performance.mark("extension-start");
    telemetryActivate(context);

    ojsActivate(context);
    notebookActivate(context);
    notebookKitActivate(context);

    // Initialize HTML notebook detector
    htmlDetector = new HTMLNotebookDetector(context);
    context.subscriptions.push(htmlDetector);

    reporter.sendTelemetryEvent("initialized");
}

export function deactivate(): void {
    htmlDetector?.dispose();
    telemetryDeactivate();
}
