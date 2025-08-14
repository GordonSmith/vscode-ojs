# ObservableHQ Notebook

![Pull Build Test](https://img.shields.io/github/workflow/status/GordonSmith/vscode-ojs/Pull%20Build%20Test.svg?logo=github&label=Pull%20Build%20Test)

## New: Observable Notebook Kit 2.0 Support

This extension now supports the new **Observable Notebook Kit 2.0** format! 🎉

### Key Features
- **Vanilla JavaScript**: No need to learn Observable JavaScript dialect  
- **Open HTML Format**: Git-friendly notebooks with clear diffs
- **Modern Imports**: Support for npm, JSR, and local imports
- **Static Site Generation**: Build notebooks to static sites
- **Backwards Compatibility**: Continue using existing `.ojsnb` format

### Quick Start with Observable Notebook Kit
1. Use Command Palette: "Observable Kit: Create New Notebook"
2. Choose a name (e.g., `my-notebook`) - will create `my-notebook.onb.html`
3. Start writing vanilla JavaScript with `display()` function
4. Use "Observable Kit: Preview" to see live preview
5. Use "Observable Kit: Build Static Site" for deployment

### HTML File Detection & View Switching
The extension automatically detects Observable notebooks vs regular HTML files and provides seamless switching:

**Smart File Opening**:
When you open an HTML file, VS Code will:
- **Regular HTML files**: Open in text editor by default
- **Observable notebook files**: Show a choice dialog - "Select Editor for .html files" with options:
  - **Text Editor** (default HTML editor)
  - **Observable Notebook Kit** (interactive notebook view)

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

[Learn more about Observable Notebook Kit →](https://observablehq.com/notebook-kit/)

## Supports

- [JavaScript](https://www.javascript.com/) via [ObservableHQ JavaScript](https://observablehq.com/@observablehq/introduction-to-code?collection=@observablehq/notebook-fundamentals)
- [Markdown](https://www.markdownguide.org/)
- [ObservableHQ Markdown](https://observablehq.com/@observablehq/markdown-quick-reference?collection=@observablehq/notebook-fundamentals)
- [HTML](https://developer.mozilla.org/en-US/docs/Web/HTML)
- [SQL](https://en.wikipedia.org/wiki/SQL)
- [SVG](https://developer.mozilla.org/en-US/docs/Web/SVG)
- [GraphViz (DOT)](https://graphviz.org/)
- [Mermaid](https://mermaid-js.github.io/mermaid/#/)
- [LaTeX](https://www.latex-project.org/about/)

## Recommended Extension Pack

To get the full experience, it is recommended to install this extension as part of the [JavsaScript Notebook](https://marketplace.visualstudio.com/items?itemName=GordonSmith.js-notebook-extension-pack) extension pack.

## Quick Start with Observable Notebooks (beta)

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

_All commands are prefixed with "OJS" and are available via the command palette or by default shortcut key mappings_

### Legacy OJS Commands

| Command                    | Shortcut | Description                                                     |
| -------------------------- | :------: | --------------------------------------------------------------- |
| OJS: Check Syntax          |    F7    | Syntax Check                                                    |
| OJS: Preview Web Page      | Ctrl+K V | Preview notebook in an embedded Web Page                        |
| OJS: Download Notebook     |          | Download notebook from ObservableHQ                             |
| OJS: Import Notebook Cells |          | Import published or shared notebook cells into current document |
| OJS: Export to HTML        |          | Export as a self contained HTML file                            |
| OJS: Export to ECL         |          | Export as a self contained ECL attribute                        |

### Observable Notebook Kit Commands

| Command                           | Description                                               |
| --------------------------------- | --------------------------------------------------------- |
| Observable Kit: Create New Notebook | Create a new Observable Notebook Kit HTML notebook      |
| Observable Kit: Preview           | Preview notebook using Observable Notebook Kit CLI       |
| Observable Kit: Build Static Site | Build static site from notebooks                         |
| Observable Kit: Convert from Legacy | Convert .ojsnb files to Observable Kit HTML format     |
| Observable Kit: Convert HTML to Observable Notebook | Convert HTML file to Observable Notebook Kit format (renames file) |
| Observable Kit: Open HTML as Observable Notebook | Open HTML file as Observable Notebook (temporary) |
| Observable Kit: Setup Workspace   | Install and configure Observable Notebook Kit            |

## Settings

_All settings are prefixed with "ojs." and are available via `file -> preferneces -> settings` menu_

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
- [@hpcc-js/observable-md](https://github.com/hpcc-systems/Visualization/tree/master/packages/observable-md)

## Recommended Extensions

Other recommended extensions for working with Observable notebooks formats in [VS Code](https://code.visualstudio.com/):

| Extension                                                                                                                       | Description                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [Observable JS Notebook Inspector](https://marketplace.visualstudio.com/items?itemName=RandomFractalsInc.js-notebook-inspector) | VS Code extension for Interactive Preview of Observable JS Notebooks, Notebook Nodes, Cells and source code |
