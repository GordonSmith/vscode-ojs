import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const distDir = resolve(rootDir, "dist");

describe("extension bundle", () => {
    it("dist/extension.js exists", () => {
        expect(existsSync(resolve(distDir, "extension.js"))).toBe(true);
    });

    it("dist/xhr-sync-worker.js exists", () => {
        expect(existsSync(resolve(distDir, "xhr-sync-worker.js"))).toBe(true);
    });

    it("bundle has reasonable size", () => {
        const stats = statSync(resolve(distDir, "extension.js"));
        expect(stats.size).toBeGreaterThan(100_000);
    });

    it("bundle exports activate and deactivate", () => {
        const src = readFileSync(resolve(distDir, "extension.js"), "utf-8");
        expect(src).toContain("activate");
        expect(src).toContain("deactivate");
    });
});
