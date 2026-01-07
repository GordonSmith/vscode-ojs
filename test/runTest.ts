/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as path from "path";
import * as fs from "fs/promises";

import { downloadAndUnzipVSCode, runTests } from "@vscode/test-electron";

type PackageJson = {
    devDependencies?: Record<string, string>;
    engines?: {
        vscode?: string;
    };
};

async function readJsonFile<T>(filePath: string): Promise<T | undefined> {
    try {
        const contents = await fs.readFile(filePath, { encoding: "utf8" });
        return JSON.parse(contents) as T;
    } catch {
        return undefined;
    }
}

function normalizeVSCodeVersion(version: string | undefined): string | undefined {
    if (!version) {
        return undefined;
    }

    const trimmed = version.trim();
    const match = /(\d+\.\d+\.\d+)/.exec(trimmed);
    return match?.[1];
}

async function inferVSCodeVersion(extensionDevelopmentPath: string): Promise<string> {
    const packageJsonPath = path.join(extensionDevelopmentPath, "package.json");
    const packageJson = await readJsonFile<PackageJson>(packageJsonPath);

    const fromTypes = normalizeVSCodeVersion(packageJson?.devDependencies?.["@types/vscode"]);
    if (fromTypes) {
        return fromTypes;
    }

    const fromEngines = normalizeVSCodeVersion(packageJson?.engines?.vscode);
    if (fromEngines) {
        return fromEngines;
    }

    return "1.102.0";
}

async function pathExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

function normalizeExecutablePath(executablePath: string | undefined): string | undefined {
    if (!executablePath) {
        return undefined;
    }

    const trimmed = executablePath.trim();
    if (!trimmed) {
        return undefined;
    }

    return trimmed.replace(/^\"|\"$/g, "");
}

async function findCachedVSCodeExecutable(extensionDevelopmentPath: string): Promise<string | undefined> {
    const cacheRoot = path.join(extensionDevelopmentPath, ".vscode-test");
    let entries: Array<import("node:fs").Dirent>;

    try {
        entries = await fs.readdir(cacheRoot, { withFileTypes: true });
    } catch {
        return undefined;
    }

    const candidateDirs = entries
        .filter((entry) => entry.isDirectory() && entry.name.startsWith("vscode-"))
        .map((entry) => entry.name);

    const executableNames =
        process.platform === "win32"
            ? ["Code.exe", "Code - Insiders.exe"]
            : process.platform === "darwin"
                ? [
                    "Visual Studio Code.app/Contents/MacOS/Electron",
                    "Visual Studio Code - Insiders.app/Contents/MacOS/Electron"
                ]
                : ["code", "Code"];

    for (const dirName of candidateDirs) {
        const installRoot = path.join(cacheRoot, dirName);
        for (const executableName of executableNames) {
            const candidatePath = path.join(installRoot, executableName);
            if (await pathExists(candidatePath)) {
                return candidatePath;
            }
        }
    }

    return undefined;
}

async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        // Passed to `--extensionDevelopmentPath`
        const extensionDevelopmentPath = path.resolve(__dirname, "../");

        // The path to test runner
        // Passed to --extensionTestsPath
        const extensionTestsPath = path.resolve(__dirname, "./index");

        // Prefer an explicit version so we don't need a network call just to "resolve latest".
        // This also makes CI/offline dev more reliable when a cached VS Code already exists.
        const vscodeVersion =
            normalizeVSCodeVersion(process.env.VSCODE_TEST_VERSION) ??
            (await inferVSCodeVersion(extensionDevelopmentPath));

        const isCI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

        let vscodeExecutablePath: string;
        const configuredExecutable =
            normalizeExecutablePath(process.env.VSCODE_TEST_EXECUTABLE_PATH) ??
            normalizeExecutablePath(process.env.VSCODE_EXECUTABLE_PATH);

        if (configuredExecutable) {
            if (!(await pathExists(configuredExecutable))) {
                throw new Error(
                    "VSCODE_TEST_EXECUTABLE_PATH/VSCODE_EXECUTABLE_PATH does not exist: " +
                    configuredExecutable
                );
            }

            vscodeExecutablePath = configuredExecutable;
        } else {
            const cached = await findCachedVSCodeExecutable(extensionDevelopmentPath);
            if (cached) {
                vscodeExecutablePath = cached;
            } else {
                try {
                    vscodeExecutablePath = await downloadAndUnzipVSCode(vscodeVersion);
                } catch (downloadError) {
                    if (isCI) {
                        throw downloadError;
                    }

                    console.warn(
                        "Skipping VS Code integration tests: failed to download VS Code " +
                        vscodeVersion +
                        " and no cached install was found. " +
                        "If you want to run integration tests offline, set VSCODE_TEST_EXECUTABLE_PATH to a VS Code executable " +
                        "(or run once online to populate .vscode-test)."
                    );
                    process.exit(0);
                }
            }
        }

        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            vscodeExecutablePath
        });
    } catch (err) {
        console.error("Failed to run tests");
        console.error(err);
        process.exit(1);
    }
}

main();
