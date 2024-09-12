import * as vscode from "vscode";
import TelemetryReporter from "@vscode/extension-telemetry";

class MyTelemetryReporter extends TelemetryReporter {

    dispose(): Promise<any> {
        reporter.sendTelemetryEvent("MyTelemetryReporter.dispose");
        return super.dispose();
    }
}

// telemetry reporter
export let reporter: TelemetryReporter;

export function activate(context: vscode.ExtensionContext) {
    const extPackageJSON = context.extension.packageJSON;
    reporter = new MyTelemetryReporter("b785b2bb-e170-421b-8bd8-baaf895fe88b");
    context.subscriptions.push(reporter);

    reporter.sendTelemetryEvent("activate");
}

export function deactivate(): void {
    reporter.sendTelemetryEvent("deactivate");

    reporter.dispose();
}
