import * as esbuild from "esbuild";
import copyStaticFiles from "esbuild-copy-static-files";
import process from "node:process";
import path from "node:path";
import { problemMatcher, removeStrict, nodeTpl } from "@hpcc-js/esbuild-plugins";
import { readFileSync } from "node:fs";

const tsconfigNode = JSON.parse(readFileSync("./tsconfig.json", "utf8"));
const tsconfigBrowser = JSON.parse(readFileSync("./tsconfig.webview.json", "utf8"));

const outputDirectory = "dist";
const watch = process.argv.includes("--watch");
const production = !watch && process.argv.includes("--production");

async function main(tsconfigRaw, entryPoint, platform, format, plugins = [], outputName = null) {
    const ctx = await esbuild.context({
        tsconfigRaw,
        entryPoints: [entryPoint],
        outdir: outputDirectory,
        outExtension: outputName ? { '.js': `.js` } : undefined,
        bundle: true,
        format,
        minify: production,
        sourcemap: !production ? "linked" : false,
        platform,
        target: platform === "node" ? "node20" : "es2022",
        external: ["vscode", "fs", "path", "os"],
        logLevel: production ? "silent" : "info",
        plugins: [
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
    main(tsconfigNode, "./src/extension.ts", "node", "cjs"),
    main(tsconfigBrowser, "./src/notebook/renderers/ojsRenderer.ts", "browser", "esm"),
    main(tsconfigBrowser, "./src/notebook2/renderers/renderer.ts", "browser", "esm"),
    main(tsconfigBrowser, "./src/webview.ts", "browser", "iife")
]).catch((e) => {
    console.error(e);
    process.exit(1);
});
