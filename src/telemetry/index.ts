import * as vscode from "vscode";
import { TelemetryReporter } from "@vscode/extension-telemetry";

// telemetry reporter
export let reporter: TelemetryReporter;

export function activate(context: vscode.ExtensionContext) {
    // Instantiate telemetry reporter with connection string
    reporter = new TelemetryReporter("b785b2bb-e170-421b-8bd8-baaf895fe88b");
    context.subscriptions.push({ dispose: () => reporter.dispose() });

    reporter.sendTelemetryEvent("activate");
}

export function deactivate(): void {
    reporter.sendTelemetryEvent("deactivate");

    void reporter.dispose();
}
