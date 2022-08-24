# Observable JavaScript | Markdown
![Pull Build Test](https://img.shields.io/github/workflow/status/GordonSmith/vscode-ojs/Pull%20Build%20Test.svg?logo=github&label=Pull%20Build%20Test)

VS Code extension for Observable "JavaScript" and "Markdown".  This extension would not have been possible without the following:
* [ObservableHQ/parser](https://github.com/observablehq/parser)
* [ObservableHQ/runtime](https://github.com/observablehq/runtime)
* [ObservableHQ/inspector](https://github.com/observablehq/inspector)
* [ObservableHQ/stdlib](https://github.com/observablehq/stdlib)
* [@hpcc-js/observable-md](https://github.com/hpcc-systems/Visualization/tree/master/packages/observable-md)

## Quick Start with Observable Notebooks (beta)

![Demo GIF](./images/ojsDemoNotebook.gif)

1. Select "OJS: Download Notebook" from command palette.
2. Paste URL from ObservableHQ website, for Example:  `https://observablehq.com/@observablehq/five-minute-introduction`
3. Save file to known name and location (Note:  Keep the default file extension of "ojsnb").
4. In VS Code open the file.
5. Click "Run All" in the notebook toolbar.

**⚠ WARNING: Cells are rendered "on demand".**  
When a notebook is long, some cells will not be fully executed until they are scrolled into view, given the reactive nature of Observable Notebooks and the general pattern to `import` dependencies at the bottom of the notebook, this means you may need to scroll to the end, before the imported code is executed...

## Quick Start with Observable JavaScript | Markdown

![Demo GIF](./images/ojsDemo.gif)

1. Create a new file with either the `.ojs` or `.omd` extension (optional).
2. Open this file in a VS Code editor instance (optional).
3. Select "OJS: Import Notebook" from command palette.
4. Enter `https://observablehq.com/@observablehq/a-taste-of-observable` for the import URL.
5. Press `Ctrl+K V` to preview notebook.
6. Select "OJS: Export to HTML" from the command palette.
7. Double click the exported HTML file to view in browser (Note:  You may need to host the file on a webserver if it is importing other libraries).

## Commands
_All commands are prefixed with "OJS" and are available via the command palette or by default shortcut key mappings_

| Command                   | Shortcut | Description                                                      |
|---------------------------|:--------:|------------------------------------------------------------------|
|OJS: Check Syntax          |F7        | Syntax Check                                                     |
|OJS: Preview Web Page      |Ctrl+K V  | Preview notebook in an embedded Web Page                         |
|OJS: Download Notebook     |          | Download notebook from ObservableHQ                              |
|OJS: Import Notebook Cells |          | Import published or shared notebook cells into current document  |
|OJS: Export to HTML        |          | Export as a self contained HTML file                             |
|OJS: Export to ECL         |          | Export as a self contained ECL attribute                         |

## Settings
_All settings are prefixed with "ojs." and are available via `file -> preferneces -> settings` menu_

| Setting                   | Default | Description                                               |
|---------------------------|:-------:|-----------------------------------------------------------|
| ojs.refreshPreviewOnSave  | true    | Refresh preview (if visible) when OJS document is saved   |
| ojs.showRuntimeValues	    | false   | Show runtime values as diagnostic info                    |

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

``````markdown
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
 
``````

# Recommended Extensions

Other recommended extensions for working with Observable notebooks formats in [VS Code](https://code.visualstudio.com/):

| Extension | Description |
| --- | --- |
| [Observable JS Notebook Inspector](https://marketplace.visualstudio.com/items?itemName=RandomFractalsInc.js-notebook-inspector)| VS Code extension for Interactive Preview of Observable JS Notebooks, Notebook Nodes, Cells and source code |
