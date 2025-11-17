import * as vscode from "vscode";
import { activate as ojsActivate } from "./ojs/index";
import { activate as notebookActivate } from "./notebook/index";
import { activate as notebookKitActivate } from "./notebook-kit/index";
import { activate as telemetryActivate, deactivate as telemetryDeactivate, reporter } from "./telemetry/index";
import { runTests } from "./notebook-kit/renderers/test";
import { toolsActivate } from "./ai/index";

export function activate(context: vscode.ExtensionContext): void {
    performance.mark("extension-start");
    telemetryActivate(context);

    ojsActivate(context);
    notebookActivate(context);
    notebookKitActivate(context);
    toolsActivate(context);

    reporter.sendTelemetryEvent("initialized");

    runTests();
}

export function deactivate(): void {
    telemetryDeactivate();
}
