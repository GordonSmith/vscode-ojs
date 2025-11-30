# ObservableHQ Notebook

[![Pull Build Test](https://github.com/GordonSmith/vscode-ojs/actions/workflows/pull-build-test.yml/badge.svg)](https://github.com/GordonSmith/vscode-ojs/actions/workflows/pull-build-test.yml)
![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/GordonSmith.observable-js)

## New: ObservableHQ Notebook 2.0 Support

This extension now supports the new **ObservableHQ Notebook 2.0** format! 🎉

### Key Features

- **Vanilla JavaScript**: No need to learn Observable JavaScript dialect
- **Open HTML Format**: Git-friendly notebooks with clear diffs
- **Modern Imports**: Support for npm, JSR, and local imports
- **Static Site Generation**: Build notebooks to static sites
- **Backwards Compatibility**: Continue using existing `.ojsnb` format

### Quick Start with ObservableHQ Notebook

1. Run the Command Palette entry **"Observable Kit: Observable Kit Notebook"** to scaffold a new notebook
2. Choose a name (e.g., `my-notebook`) – the command creates `my-notebook.onb.html`
3. Click **Switch to Notebook View** (toolbar button or command) to open the interactive editor and start writing vanilla JavaScript with `display()`
4. Use **Switch to Text View** any time you want to edit the underlying HTML shell or metadata
5. Run **Observable Kit: Build Static Site** when you are ready to produce deployable output

### HTML File Detection & View Switching

The extension automatically detects Observable notebooks vs regular HTML files and provides seamless switching:

**Smart File Opening**:
When you open an HTML file, VS Code will:

- **Regular HTML files**: Open in text editor by default
- **Observable notebook files**: Show a choice dialog - "Select Editor for .html files" with options:
  - **Text Editor** (default HTML editor)
  - **ObservableHQ Notebook** (interactive notebook view)

**Seamless View Switching**:
Once a file is open, you can switch between views using toolbar buttons:

- **📖 Switch to Notebook View** - Appears when viewing Observable notebook HTML as text
- **📝 Switch to Text View** - Appears when viewing notebook, switches back to HTML source
- **No temporary files** - Everything works directly with your original `.html` files

**File Extensions**:

- `*.html` - Can be opened as either text or notebook (VS Code will ask)
- `*.onb.html` - Reserved for explicit notebook files (opens as notebook by default)

**Benefits**:

- **No workflow interruption** - You choose how to open files
- **Direct file editing** - No temporary files or complex file management
- **Flexible switching** - Toggle between text and notebook views instantly

**Manual Commands** (always available):

- **Right-click menu**: Right-click HTML file in Explorer → "Observable Kit: Open HTML as Observable Notebook"
- **Command Palette**: "Observable Kit: Convert HTML to Observable Notebook" (permanently renames to `.onb.html`)

[Learn more about ObservableHQ Notebook →](https://observablehq.com/notebook-kit/)

## Supports

- [JavaScript](https://www.javascript.com/)
- [ObservableHQ JavaScript](https://observablehq.com/@observablehq/introduction-to-code?collection=@observablehq/notebook-fundamentals)
- [Markdown](https://www.markdownguide.org/)
- [ObservableHQ Markdown](https://observablehq.com/@observablehq/markdown-quick-reference?collection=@observablehq/notebook-fundamentals)
- [HTML](https://developer.mozilla.org/en-US/docs/Web/HTML)
- [SQL](https://en.wikipedia.org/wiki/SQL)
- [SVG](https://developer.mozilla.org/en-US/docs/Web/SVG)
- [GraphViz (DOT)](https://graphviz.org/)
- [Mermaid](https://mermaid-js.github.io/mermaid/#/)
- [LaTeX](https://www.latex-project.org/about/)

## Recommended Extension Pack

To get the full experience, install this extension as part of the [JavaScript Notebook](https://marketplace.visualstudio.com/items?itemName=GordonSmith.js-notebook-extension-pack) extension pack.

## Quick Start with ObservableHQ Notebook-Kit

![Demo GIF](./images/notebook-kit-demo.gif)

1. Open a `notebook-kit` notebook (extension .html)
2. Click "Switch to Notebook View" in the text toolbar.
3. Edit, run and save your notebook.
4. Optionally click "Switch to Text View" to go back to the HTML source.

## Quick Start with Observable Notebooks

![Demo GIF](./images/ojsDemoNotebook.gif)

1. Select "OJS: Download Notebook" from command palette.
2. Paste URL from ObservableHQ website, for Example: `https://observablehq.com/@observablehq/five-minute-introduction`
3. Save file to known name and location (Note: Keep the default file extension of "ojsnb").
4. In VS Code open the file.
5. Click "Run All" in the notebook toolbar.

## Quick Start with ObservableHQ JavaScript (.ojs) | Markdown (.omd)

![Demo GIF](./images/ojsDemo.gif)

1. Create a new file with either the `.ojs` or `.omd` extension (optional).
2. Open this file in a VS Code editor instance (optional).
3. Select "OJS: Import Notebook" from command palette.
4. Enter `https://observablehq.com/@observablehq/a-taste-of-observable` for the import URL.
5. Press `Ctrl+K V` to preview notebook.
6. Select "OJS: Export to HTML" from the command palette.
7. Double click the exported HTML file to view in browser (Note: You may need to host the file on a webserver if it is importing other libraries).

## Commands

_Legacy commands are prefixed with "OJS"; Notebook Kit commands appear under "Observable Kit" in the Command Palette_

### Legacy OJS Commands

| Command                    | Shortcut | Description                                                     |
| -------------------------- | :------: | --------------------------------------------------------------- |
| OJS: Check Syntax          |    F7    | Syntax Check                                                    |
| OJS: Preview Web Page      | Ctrl+K V | Preview notebook in an embedded Web Page                        |
| OJS: Download Notebook     |          | Download notebook from ObservableHQ                             |
| OJS: Import Notebook Cells |          | Import published or shared notebook cells into current document |
| OJS: Export to HTML        |          | Export as a self contained HTML file                            |
| OJS: Export to ECL         |          | Export as a self contained ECL attribute                        |

### ObservableHQ Notebook Commands

| Command                                             | Description                                                      |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| Observable Kit: Create New Notebook                 | Create a new ObservableHQ Notebook HTML notebook                 |
| Observable Kit: Preview                             | Preview notebook using ObservableHQ Notebook CLI                 |
| Observable Kit: Build Static Site                   | Build static site from notebooks                                 |
| Observable Kit: Convert from Legacy                 | Convert .ojsnb files to Observable Kit HTML format               |
| Observable Kit: Convert HTML to Observable Notebook | Convert HTML file to ObservableHQ Notebook format (renames file) |
| Observable Kit: Open HTML as Observable Notebook    | Open HTML file as Observable Notebook (temporary)                |
| Observable Kit: Setup Workspace                     | Install and configure ObservableHQ Notebook                      |

## Settings

_All settings are prefixed with "ojs." and are available via `File -> Preferences -> Settings`_

| Setting                  | Default | Description                                             |
| ------------------------ | :-----: | ------------------------------------------------------- |
| ojs.refreshPreviewOnSave |  true   | Refresh preview (if visible) when OJS document is saved |
| ojs.showRuntimeValues    |  false  | Show runtime values as diagnostic info                  |

## Sample OJS File (myfile.ojs)

```javascript
md`# Generator Test`;

function* range(n) {
  for (let i = 0; i < n; ++i) {
    yield i;
  }
}

{
  for (const i of range(Infinity)) {
    yield Promises.tick(1000, i + 1);
  }
}

md`# Import Test`;

import {viewof selection as cars} from "@d3/brushable-scatterplot";
viewof cars;

md`### Selection:
~~~json
${JSON.stringify(cars, undefined, 2)}
~~~
`;
```

## Sample OMD File (myfile.omd)

````markdown
# Generator Test

_Simple Generator test_

```
function* range(n) {
  for (let i = 0; i < n; ++i) {
    yield i;
  }
}

{
  for (const i of range(Infinity)) {
    yield Promises.tick(1000, i + 1);
  }
}
```

# Import Test

_Simple Import Test_

```
import {viewof selection as cars} from "@d3/brushable-scatterplot";
viewof cars;
```

### Selection:

```json
${JSON.stringify(cars, undefined, 2)}
```
````

## Credits

This extension would not have been possible without the following:

- [ObservableHQ/parser](https://github.com/observablehq/parser)
- [ObservableHQ/runtime](https://github.com/observablehq/runtime)
- [ObservableHQ/inspector](https://github.com/observablehq/inspector)
- [ObservableHQ/stdlib](https://github.com/observablehq/stdlib)
- [@hpcc-js/observablehq-compiler](https://github.com/hpcc-systems/Visualization/tree/trunk/packages/observablehq-compiler)

## Recommended Extensions

Other recommended extensions for working with Observable notebooks formats in [VS Code](https://code.visualstudio.com/):

| Extension                                                                                                                       | Description                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [Observable JS Notebook Inspector](https://marketplace.visualstudio.com/items?itemName=RandomFractalsInc.js-notebook-inspector) | VS Code extension for Interactive Preview of Observable JS Notebooks, Notebook Nodes, Cells and source code |
