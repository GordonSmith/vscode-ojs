# Copilot Instructions for vscode-ojs

This repo is a VS Code extension that brings Observable notebooks and Observable Notebook Kit 2.0 to VS Code. It includes: classic OJS/OMD authoring and preview, a custom notebook controller/renderer, and Notebook Kit HTML workflows.

## Architecture (big picture)

- Entry point: `src/extension.ts`
  - Activates three subsystems: `ojs` (classic OJS/OMD), `notebook` (OJS .ojsnb), and `notebook-kit` (Observable Notebook Kit 2.0 HTML flow). Also activates telemetry and an HTML notebook detector.
- Classic OJS/OMD (`src/ojs/*`)
  - `command.ts`: registers commands like preview, import, export. Converts API responses to `.ojs` or `.omd` content. Uses `@hpcc-js/observablehq-compiler` to compile notebooks.
  - `preview.ts`: hosts an interactive webview that loads `dist/webview.js`; posts messages for evaluate/values/alerts.
  - `diagnostic.ts`, `meta.ts`: collect and surface runtime metadata/diagnostics.
- Notebook (.ojsnb) (`src/notebook/*`)
  - `controller/*`: serializer, notebook controller, and commands for the native VS Code notebook experience.
  - `renderers/*`: webview-based renderers bundled to `dist/` via esbuild (`ojsRenderer.ts`, `renderer.css`).
- Notebook Kit 2.0 (`src/notebook-kit/*`)
  - Commands to create/preview/build notebooks and a dedicated renderer (`observable-kit-renderer.ts`).
- Webview runtime (`src/webview.ts`)
  - Browser-side logic used by OJS/OMD preview. Runs Observable runtime with `@observablehq/runtime`, `@observablehq/stdlib` (Library), `@observablehq/inspector` and compiler CSS from `@hpcc-js/observablehq-compiler/src/index.css`.

## Build, watch, test

- Bundling is driven by `esbuild.mjs` and targets:
  - Node: `src/extension.ts` → `dist/extension.js` (cjs)
  - Browser: `src/notebook/renderers/ojsRenderer.ts` (esm), `src/notebook-kit/renderers/observable-kit-renderer.ts` (esm), and `src/webview.ts` (iife)
- Type generation:
  - Node types: `npm run gen-node-types` (tsconfig.json; declarationOnly)
  - Webview types: `npm run gen-webview-types` (tsconfig.webview.json; declarationOnly)
- Common scripts:
  - `npm run build` → `run-p gen-types build-ts`
  - `npm run build-ts` → `node esbuild.mjs --production`
  - `npm run build-ts-watch` → `node esbuild.mjs --watch --development`
  - `npm run watch` → parallel type generation watch + esbuild watch
  - `npm run lint` → uses flat config `eslint.config.mjs` (ESLint v9)
- Debugging: use “Run Extension” (Extension Host). Webview assets are served from `dist/` and referenced via `asWebviewUri` in `preview.ts`.

## ESLint & code style

- Flat config at `eslint.config.mjs` using `@eslint/js`, `typescript-eslint` flat presets, and `eslint-plugin-react-hooks`.
- Project-specific rules mirror legacy behavior; notable customizations:
  - `no-inner-declarations: off`, `semi: always`, `quotes: "double"`, and permissive TS rules for this codebase.
- Generated sources ignored: `src/grammar/**/*`.

## Project conventions & patterns

- Module resolution:
  - Runtime-only browser code imports Observable packages directly; `Library` comes from `@observablehq/stdlib`, `Runtime` from `@observablehq/runtime`, `Inspector` from `@observablehq/inspector`.
  - Compiler stylesheet: import `@hpcc-js/observablehq-compiler/src/index.css` in `src/webview.ts`.
- Messaging between extension and webview:
  - Types for messages live in `src/webview.ts` (e.g., `LoadedMessage`, `ValueMessage`).
  - `src/ojs/preview.ts` posts messages `{ command, content, callbackID }` and resolves promises on replies.
- HTML preview shell is built in `getHtmlForWebview` (`src/ojs/preview.ts`) and injects `dist/webview.js` via `asWebviewUri`.
- Telemetry: `src/telemetry/index.ts` uses `@vscode/extension-telemetry` v1 API. Instantiate `new TelemetryReporter(connectionString)` and make sure to dispose on deactivate.

## External dependencies of note

- Observable stack: `@observablehq/runtime`, `@observablehq/inspector`, `@observablehq/stdlib`.
- Compiler: `@hpcc-js/observablehq-compiler` (also provides CSS).
- Rendering & bundling: `esbuild`, `@hpcc-js/esbuild-plugins` (`problemMatcher`).
- Node-fetch for network calls in the extension process.

## Gotchas / tips for agents

- Don’t import `Library` or `Inspector` from `@observablehq/runtime`; use `@observablehq/stdlib` and `@observablehq/inspector` respectively.
- Webview bundle is IIFE; avoid Node-only modules there. Use browser-safe APIs.
- When editing message contracts, update both ends: `src/webview.ts` and `src/ojs/preview.ts`.
- tsconfig targets:
  - Extension (Node): `module: nodenext`, `target: ES2022`.
  - Webview: `module: NodeNext`, `target: ESNext`, `lib: [esnext, dom]`.
- If you add renderer/webview files, wire them into `esbuild.mjs` entryPoints and adjust `localResourceRoots` if needed.

## Examples in-repo

- Webview runtime entry: `src/webview.ts` shows how to compile and run a notebook, stream values back, and apply Inspector to DOM nodes.
- Export template: `src/ojs/command.ts#exportTpl` shows a static export wiring Runtime + Inspector with compiler.

## CI/Release

- `vscode:prepublish` runs `clean` then `build` before packaging.
- Packaging: `npm run package` outputs `gordonsmith.observable-js.vsix`.

Feedback: If any of the above feels off or you have different local workflows, tell me what to adjust and I’ll refine these instructions.
