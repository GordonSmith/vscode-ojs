import * as vscode from "vscode";
import TelemetryReporter from "@vscode/extension-telemetry";

class MyTelemetryReporter extends TelemetryReporter {

    dispose(): Promise<any> {
        reporter.sendTelemetryEvent("MyTelemetryReporter.dispose");
        return super.dispose();
    }
}

// telemetry reporter
export let reporter: any;

export function activate(context: vscode.ExtensionContext) {
    const extPackageJSON = context.extension.packageJSON;
    reporter = new MyTelemetryReporter("GodonSmith.ojs", extPackageJSON.version, "0bd5634a-3457-44c2-aaf3-43b03a68eb45");
    context.subscriptions.push(reporter);

    reporter.sendTelemetryEvent("activate");
}

export function deactivate(): void {
    reporter.sendTelemetryEvent("deactivate");

    reporter.dispose();
}
