import process from "node:process";
import console from "node:console";
import { readFileSync, copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import * as esbuild from "esbuild";
import type { Plugin } from "esbuild";
import { problemMatcher, inlineCSS } from "@hpcc-js/esbuild-plugins";

const tsconfigNode: Record<string, unknown> = JSON.parse(readFileSync("./tsconfig.json", "utf8"));
const tsconfigBrowser: Record<string, unknown> = JSON.parse(readFileSync("./tsconfig.webview.json", "utf8"));

const outputDirectory: string = "dist";
const watch: boolean = process.argv.includes("--watch");
const production: boolean = !watch && process.argv.includes("--production");

// Custom alias plugin for pattern matching
const aliasPlugin: Plugin = {
    name: 'alias-plugin',
    setup(build) {
        const aliases: Array<{ find: RegExp; replacement: string }> = [
            {
                find: /^npm:(.*)$/,
                replacement: "https://cdn.jsdelivr.net/npm/$1/+esm"
            },
            {
                find: /^jsr:(.*)$/,
                replacement: "https://esm.sh/jsr/$1"
            }
        ];

        build.onResolve({ filter: /^(npm|jsr):/ }, args => {
            for (const alias of aliases) {
                const match = args.path.match(alias.find);
                if (match) {
                    const resolved = alias.replacement.replace('$1', match[1]);
                    return { path: resolved, external: true };
                }
            }
        });
    }
};

const xhrSyncWorkerPlugin: Plugin = {
    name: "xhr-sync-worker",
    setup(build) {
        const workerSource: string = path.resolve("node_modules/jsdom/lib/jsdom/living/xhr/xhr-sync-worker.js");
        build.onStart(() => {
            try {
                // Ensure the output directory exists before copying (production builds often start from a clean state)
                mkdirSync(outputDirectory, { recursive: true });
                copyFileSync(workerSource, path.join(outputDirectory, "xhr-sync-worker.js"));
            } catch {
                // Ignore if jsdom not installed; worker not needed.
            }
        });
        build.onLoad({ filter: /XMLHttpRequest-impl\.js$/ }, async (args) => {
            let contents = readFileSync(args.path, "utf8");
            // Replace only if the exact snippet exists.
            const search = 'const syncWorkerFile = require.resolve ? require.resolve("./xhr-sync-worker.js") : null;';
            if (contents.includes(search)) {
                contents = contents.replace(search, 'const syncWorkerFile = require.resolve ? require.resolve(require("node:path").join(__dirname, "xhr-sync-worker.js")) : null;');
            }
            return { contents, loader: "js" };
        });
    }
};

const jsdomPatch: Plugin = {
    name: 'jsdom-patch',
    setup(build) {
        build.onLoad({ filter: /style-rules\.js$/ }, async (args) => {
            let contents: string = readFileSync(args.path, "utf8");
            const defaultCSSPath: string = path.join(
                path.dirname(args.path),
                "../../browser/default-stylesheet.css",
            );
            const defaultCSS: string = readFileSync(defaultCSSPath, "utf8");
            contents = contents.replace(
                `const defaultStyleSheet = fs.readFileSync(
    path.resolve(__dirname, "../../browser/default-stylesheet.css"),
    { encoding: "utf-8" }
    );`,
                `const defaultStyleSheet = ${JSON.stringify(defaultCSS)};`,
            );
            return { contents, loader: "js" };
        });
    },
};

async function main(
    tsconfigRaw: Record<string, unknown>,
    entryPoint: string,
    platform: "node" | "browser",
    format: "cjs" | "esm" | "iife",
    plugins: Plugin[] = [],
    outputName: string | null = null
): Promise<void> {
    // External dependencies for browser builds - npm: protocol dependencies from Observable Kit
    const npmExternals: string[] = [
        // "npm:d3-dsv", "npm:apache-arrow", "npm:arquero", "npm:parquet-wasm",
        // "npm:lodash", "npm:d3", "npm:@duckdb/duckdb-wasm", "npm:echarts",
        // "npm:htl", "npm:@observablehq/plot", "npm:react", "npm:react-dom",
        // "npm:topojson-client", "npm:@observablehq/inputs", "npm:vega",
        // "npm:mermaid", "npm:mapbox-gl", "npm:leaflet", "npm:@viz-js/viz",
        // "npm:katex", "npm:vega-lite", "npm:vega-lite-api"
    ];

    const external: string[] = platform === "node"
        ? ["vscode", "fs", "path", "os", "console"]
        : ["vscode", ...npmExternals];

    const ctx: esbuild.BuildContext = await esbuild.context({
        tsconfigRaw,
        entryPoints: outputName ? { [outputName]: entryPoint } : [entryPoint],
        outdir: outputDirectory,
        bundle: true,
        format,
        minify: production,
        sourcemap: !production ? "linked" : false,
        platform,
        target: platform === "node" ? "node20" : "es2022",
        external,
        logLevel: production ? "silent" : "info",
        // No alias overrides currently needed; remove invalid relative alias that broke esbuild
        // We intentionally do not suppress jsdom warnings; instead we rewrite resolution for the worker.
        plugins: [
            aliasPlugin,
            ...plugins,
            problemMatcher(),
        ]
    });
    if (watch) {
        await ctx.watch();
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }
}

Promise.all([
    main(tsconfigNode, "./src/extension.ts", "node", "cjs", [xhrSyncWorkerPlugin]),
    main(tsconfigBrowser, "./src/notebook/renderers/ojsRenderer.ts", "browser", "esm"),
    main(tsconfigBrowser, "./src/notebook-kit/renderers/renderer.ts", "browser", "esm", [inlineCSS()], "observable-kit-renderer"),
    main(tsconfigBrowser, "./src/webview.ts", "browser", "iife")
]).catch((e) => {
    console.error(e);
    process.exit(1);
});

