import { resolve } from "node:path";
import { runTests } from "@vscode/test-electron";

async function main(): Promise<void> {
    const extensionDevelopmentPath = resolve(__dirname, "..", "..", "..");
    const extensionTestsPath = resolve(__dirname, "suite/index");
    const workspacePath = resolve(extensionDevelopmentPath, "samples");

    await runTests({
        extensionDevelopmentPath,
        extensionTestsPath,
        launchArgs: [
            workspacePath,
            "--disable-extensions",
            "--disable-gpu",
        ],
    });
}

main().catch((err) => {
    console.error("Failed to run tests:", err);
    process.exit(1);
});
