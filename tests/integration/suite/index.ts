import { resolve } from "node:path";
import { globSync } from "node:fs";

// Patch globalThis.window BEFORE importing Mocha.
// The VS Code Extension Host (Electron renderer process) defines `document`
// but not `window`.  Mocha 11's utils.js uses `typeof document` to detect
// browser vs Node and then accesses `window.location`, which crashes.
if (typeof globalThis.window === "undefined") {
    (globalThis as Record<string, unknown>).window = {
        location: (globalThis as Record<string, unknown>).location || { href: "" },
    };
}

import Mocha from "mocha";

export function run(): Promise<void> {
    const mocha = new Mocha({
        ui: "tdd",
        timeout: 30_000,
        color: true,
    });

    const testFiles = globSync("*.test.js", { cwd: __dirname });
    for (const f of testFiles) {
        mocha.addFile(resolve(__dirname, f));
    }

    return new Promise((resolveP, reject) => {
        mocha.run((failures) => {
            if (failures > 0) {
                reject(new Error(`${failures} test(s) failed.`));
            } else {
                resolveP();
            }
        });
    });
}
