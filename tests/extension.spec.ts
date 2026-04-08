import { describe, it, expect } from "vitest";
import { copyFileSync, existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const distDir = resolve(rootDir, "dist");

/**
 * Sets up a fake node_modules/vscode ESM package under dist/ so that the
 * bundled extension can be imported outside the VS Code Extension Host.
 * Also copies css-tree data files that the bundle requires at init.
 *
 * Returns a cleanup function and a helper to run scripts against the bundle.
 */
function prepareBundleEnv() {
    const fakeVscodeDir = resolve(distDir, "node_modules", "vscode");
    const patchDataDir = resolve(rootDir, "data");
    const cleanupPaths: string[] = [];

    mkdirSync(fakeVscodeDir, { recursive: true });
    cleanupPaths.push(resolve(distDir, "node_modules"));

    const mkProxy = "new Proxy(function(){},{get:(_,k)=>k===\"__esModule\"?true:P(),apply:()=>undefined,construct:()=>({})})";
    writeFileSync(resolve(fakeVscodeDir, "index.mjs"), [
        `const P = () => ${mkProxy};`,
        "export class NotebookData { constructor(cells) { this.cells = cells; } }",
        "export class NotebookCellData { constructor(kind, value, lang) {} }",
        "export const NotebookCellKind = { Markup: 2, Code: 1 };",
        "export class NotebookCellOutput { constructor(items) { this.items = items; } }",
        "export class NotebookCellOutputItem { static json(d, m) { return { data: Buffer.from(JSON.stringify(d)), mime: m }; } }",
        "export class EventEmitter { event = () => {}; fire() {} dispose() {} }",
        "export const Uri = { file: f => ({ fsPath: f, toString: () => f }), parse: s => s, joinPath: (...a) => a[0] };",
        "export class TreeItem {}",
        "export class ThemeIcon {}",
        "export const workspace = P();",
        "export const window = P();",
        "export const commands = P();",
        "export const languages = P();",
        "export const notebooks = P();",
        "export const env = P();",
        "export const extensions = P();",
        "export const tasks = P();",
        "export const debug = P();",
        "export const scm = P();",
        "export const tests = P();",
        "export const l10n = P();",
        "export const authentication = P();",
        "export const chat = P();",
        "export const comments = P();",
        "export default P();",
    ].join("\n"));
    writeFileSync(resolve(fakeVscodeDir, "package.json"), JSON.stringify({ name: "vscode", type: "module", exports: "./index.mjs" }));

    const cssPatchSrc = resolve(rootDir, "node_modules", "css-tree", "data", "patch.json");
    if (existsSync(cssPatchSrc) && !existsSync(patchDataDir)) {
        mkdirSync(patchDataDir, { recursive: true });
        copyFileSync(cssPatchSrc, resolve(patchDataDir, "patch.json"));
        cleanupPaths.push(patchDataDir);
    }

    const extensionUrl = new URL("extension.js", `file://${distDir}/`).href;

    function runScript(script: string): string {
        return execFileSync(
            process.execPath,
            ["--input-type=module", "-e", script],
            { timeout: 30000, stdio: "pipe", encoding: "utf-8" },
        );
    }

    function cleanup() {
        for (const p of cleanupPaths) {
            rmSync(p, { recursive: true, force: true });
        }
    }

    return { extensionUrl, runScript, cleanup };
}

describe("extension bundle", () => {
    it("dist/extension.js exists", () => {
        expect(existsSync(resolve(distDir, "extension.js"))).toBe(true);
    });

    it("dist/xhr-sync-worker.js exists", () => {
        expect(existsSync(resolve(distDir, "xhr-sync-worker.js"))).toBe(true);
    });

    it("loads without throwing", () => {
        const { extensionUrl, runScript, cleanup } = prepareBundleEnv();
        try {
            const script = `const m = await import(${JSON.stringify(extensionUrl)}); if (typeof m.activate !== "function") process.exit(1);`;
            const result = runScript(script);
            expect(result).toBeDefined();
        } finally {
            cleanup();
        }
    }, 30000);

    it("exports activate and deactivate functions", () => {
        const { extensionUrl, runScript, cleanup } = prepareBundleEnv();
        try {
            const script = [
                `const m = await import(${JSON.stringify(extensionUrl)});`,
                "const results = JSON.stringify({",
                "    hasActivate: typeof m.activate === \"function\",",
                "    hasDeactivate: typeof m.deactivate === \"function\",",
                "});",
                "process.stdout.write(results);",
            ].join("\n");
            const output = runScript(script);
            const results = JSON.parse(output);
            expect(results.hasActivate).toBe(true);
            expect(results.hasDeactivate).toBe(true);
        } finally {
            cleanup();
        }
    }, 30000);
});
