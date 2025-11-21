import * as vscode from "vscode";
import { activate as ojsActivate } from "./ojs/index";
import { activate as notebookActivate } from "./notebook/index";
import { activate as notebookKitActivate } from "./notebook-kit/index";
import { activate as telemetryActivate, deactivate as telemetryDeactivate, reporter } from "./telemetry/index";
import { runTests } from "./notebook-kit/renderers/test";
import { toolsActivate } from "./ai/index";
import { registerCopilotContextCommands, registerChatParticipant, registerDomainCompletions } from "./notebook-kit/copilotContext";

export function activate(context: vscode.ExtensionContext): void {
    performance.mark("extension-start");
    telemetryActivate(context);

    ojsActivate(context);
    notebookActivate(context);
    notebookKitActivate(context);
    toolsActivate(context);

    // Copilot / Chat enhancements (safe no-op on older VS Code versions)
    registerCopilotContextCommands(context);
    registerChatParticipant(context);
    registerDomainCompletions(context);

    reporter.sendTelemetryEvent("initialized");

    runTests();
}

export function deactivate(): void {
    telemetryDeactivate();
}
