---
applyTo: "src/notebook-kit/**"
---

# Observable Notebook Kit 2.0 Subsystem

This document describes the **implemented** Observable Notebook Kit 2.0 support in the extension
(`src/notebook-kit/*`). It is the open, HTML-based notebook format that lives alongside the legacy
custom `.ojsnb` format (`src/notebook/*`). When working in this subsystem, follow the structure and
patterns described here.

## Background

### Observable Notebook Kit 2.0

Observable's **Notebook Kit 2.0** introduces an open notebook format:

- **Open file format**: HTML-based, human-readable, and git-friendly.
- **Vanilla JavaScript**: Standard JS (`type="module"`) plus a backwards-compatible Observable JS mode.
- **Static site generation**: Notebooks can be built into static sites.

References:
- GitHub: https://github.com/observablehq/notebook-kit (vendored under `refs/notebook-kit/` for reference)
- Docs: https://observablehq.com/notebook-kit/
- System guide: https://observablehq.com/notebook-kit/system-guide
- npm: `@observablehq/notebook-kit` (a dependency of this repo)
- VS Code Notebook API: https://code.visualstudio.com/api/extension-guides/notebook

### File format

The format is HTML with a root `<notebook>` element:

```html
<!doctype html>
<notebook theme="air">
  <title>Notebook Title</title>
  <script id="1" type="text/markdown">
    # Markdown Content
  </script>
  <script id="2" type="module" pinned>
    const data = [1, 2, 3];
    display(data);
  </script>
  <script id="3" type="observablejs">
    oldStyleCell = "legacy syntax"
  </script>
</notebook>
```

- Optional `<title>` element and `theme` attribute on `<notebook>`.
- Each cell is a `<script>` with a unique `id` and a `type` (cell mode).
- Optional `pinned` attribute controls source visibility.

## Implemented architecture (`src/notebook-kit/*`)

- `index.ts` — `activate(ctx)` registers everything:
  - Two notebook types via `workspace.registerNotebookSerializer` + `NotebookKitController`:
    - `notebook-kit-default` — default for `*.observable.html` and `*.observable.js`.
    - `notebook-kit-option` — opt-in for plain `*.html` / `*.js`, surfaced on demand through a
      `FileDecorationProvider` (`HTMLNotebookDetector`).
  - `Commands.attach(ctx)` registers all `observable-kit.*` commands.
- `controller/serializer.ts` — `NotebookKitSerializer` (singleton via `attach()`):
  - `deserializeNotebook` detects JS vs HTML (`isObservableJSNotebook`) and records the source kind in
    `metadata.type` (`"javascript"` or `"html"`); `serializeNotebook` branches on that metadata.
  - HTML ↔ notebook uses `html2notebook` / `notebook2html`; JS ↔ notebook uses `notebook2js` / `js2notebook`
    from `../compiler`.
- `controller/controller.ts` — `NotebookKitController` executes cells using the Observable runtime.
- `commands.ts` — `Commands` class registering `observable-kit.*` commands, e.g.:
  `build`, `createNotebook`, `convertFromLegacy`, `setupWorkspace`, `export`, `openHtmlAsNotebook`,
  `switchToNotebookView`, `switchToTextView`, `notebook.setTitle`, `notebook.setTheme`,
  `notebook.setReadOnly` / `setReadWrite`, `cell.pin` / `cell.unpin`, `cell.hide` / `cell.show`,
  `cell.setNodeMode` / `cell.setJsMode`. Also owns the title/theme status bar items and cell-context updates.
- `compiler/` — `index.ts` (`notebook2js`, `js2notebook`, `DECL`), `jsSerializer.ts`, and `index.css`.
- `common/notebook-detector.ts` — detection helpers (`isObservableNotebook`, `isObservableHTMLNotebook`,
  `isObservableJSNotebook`, `isNotebookKitType`) and the `HTMLNotebookDetector` decoration provider.
- `common/types.ts` — `OBSERVABLE_KIT_MIME`, cell-mode maps (`vscode2observable` / `observable2vscode`),
  `NotebookCell` interface, and `NOTEBOOK_THEMES` / `NotebookTheme`.
- `renderers/renderer.ts` — output renderer, bundled by esbuild to `dist/observable-kit-renderer.js`
  (registered in `package.json` as renderer id `observable-kit-renderer`). `renderers/renderer.css` is
  inlined via the esbuild `inline-css` plugin.

### Cell mode mapping

Cell modes map between Observable Kit and VS Code languages via `common/types.ts`. Update both
`vscode2observable` and `observable2vscode` together when adding a mode:

| Observable mode | VS Code language |
| --------------- | ---------------- |
| `md`            | `markdown`       |
| `js`            | `javascript`     |
| `ojs`           | `ojs`            |
| `html`          | `html`           |
| `tex`           | `tex`            |
| `sql`           | `sql`            |
| `dot`           | `dot`            |
| `node`          | `javascript` (deserialized as `javascript`) |
| `python`        | `python`         |
| `ts`            | `typescript`     |
| `r`             | `r`              |

## Conventions for this subsystem

- Conversion between formats goes through `@hpcc-js/observablehq-compiler` (`html2notebook`,
  `notebook2html`) and the local `compiler/` module (`notebook2js`, `js2notebook`) — do not hand-roll
  HTML parsing.
- Keep the serializer's `metadata.type` (`"html"` vs `"javascript"`) authoritative for round-tripping;
  serialize back to the same on-disk format the document was opened as.
- Register new commands under the `observable-kit.*` namespace, wire them in `commands.ts`, and add the
  matching `contributes.commands` / menu `when`-clauses in `package.json`
  (`notebookType == notebook-kit-default || notebookType == notebook-kit-option`).
- The renderer is browser/ESM and bundled separately; keep it browser-safe (no Node-only modules) and
  add new renderer entry points to `esbuild.mjs` if needed.
- Themes must come from `NOTEBOOK_THEMES`; don't introduce free-form theme strings.

## Testing & build

- Unit specs: Vitest, `tests/**/*.spec.ts` (`npm run unit-test`).
- Integration: VS Code test host (`npm run integration-test`).
- Build: `npm run build` (esbuild + type generation). The renderer bundle output is
  `dist/observable-kit-renderer.js`.
