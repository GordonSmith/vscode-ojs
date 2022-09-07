import * as vscode from "vscode";
import { activate as ojsActivate } from "./ojs/index";
import { activate as notebookActivate } from "./notebook/index";
import { activate as telemetryActivate, deactivate as telemetryDeactivate, reporter } from "./telemetry/index";

export function activate(context: vscode.ExtensionContext): void {
    performance.mark("extension-start");
    telemetryActivate(context);

    ojsActivate(context);
    notebookActivate(context);
    reporter.sendTelemetryEvent("initialized");
}

export function deactivate(): void {
    telemetryDeactivate();
}
