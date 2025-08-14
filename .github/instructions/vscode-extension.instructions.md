---
applyTo: "**"
---

# GitHub Copilot Instructions for VS Code Extension Projects

> **Note:** These instructions are in addition to the [general project instructions](.github/instructions/general.instructions.md). If there is any overlap, follow the general instructions and refer to this file for VS Code extension–specific requirements.

- Implement and document the `activate` and `deactivate` functions in `extension.ts`
- Dispose of all resources on deactivation
- Register all commands in `package.json` under `contributes.commands`
- Document each command with a clear description
- Document public functions, classes, and extension APIs with JSDoc comments
- Include usage instructions and examples in the README
- Validate that the extension builds and runs in the VS Code Extension Host

Repo-specific guidance:
- Entry point `src/extension.ts` wires three subsystems: `ojs`, `notebook`, and `notebook-kit`, plus telemetry and an HTML notebook detector.
- Webview runtime code is bundled to `dist/webview.js` from `src/webview.ts` (IIFE). Use browser-safe imports only; do not import Node-only modules.
- Observable imports: import `Runtime` from `@observablehq/runtime`, `Library` from `@observablehq/stdlib`, and `Inspector` from `@observablehq/inspector`.
- Compiler stylesheet: import `@hpcc-js/observablehq-compiler/src/index.css` (note `src/` path). The `dist/` CSS is not present in the installed package.
- If you change the webview or add renderers, wire new entry points in `esbuild.mjs` and update `localResourceRoots` in `src/ojs/preview.ts` if needed.
- Telemetry uses `@vscode/extension-telemetry` v1: instantiate `new TelemetryReporter(connectionString)` and dispose it on deactivate.
- Linting is ESLint v9 flat config (`eslint.config.mjs`). Run `npm run lint`.
- Build/watch: `npm run build` for a one-off build, `npm run build-ts-watch` for watch. Types are generated via `gen-node-types` and `gen-webview-types`.
- Debugging: use the "Run Extension" launch to start an Extension Host; preview uses `getHtmlForWebview` in `src/ojs/preview.ts` to load `dist/webview.js`.

**Useful Links:**
- [VS Code API Reference](https://code.visualstudio.com/api/references/vscode-api)
- [VS Code Extension Authoring Guide](https://code.visualstudio.com/api/get-started/your-first-extension)
- [VS Code Extension Samples](https://github.com/microsoft/vscode-extension-samples)

For questions, contact project maintainers or see CONTRIBUTING.md.
