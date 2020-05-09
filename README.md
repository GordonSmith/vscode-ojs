# Observable JS

VS Code extension for "Observable JavaScript" by [ObservableHQ](https://observablehq.com/).  This extension would not have been possible without the following:
* [ObservableHQ/parser](https://github.com/observablehq/parser)
* [ObservableHQ/runtime](https://github.com/observablehq/runtime)
* [@hpcc-js/observable-md](https://github.com/hpcc-systems/Visualization/tree/master/packages/observable-md)

## Getting Started

1. Create a new file with the `.ojs` extension.
2. Enter "Observable JavaScript" as you would with any language.
3. Press `Ctrl+K V` to preview notebook.

## Commands
_All commands are prefixed with "OJS" and are available via the command palette or by default shortcut key mappings_

| Command                   | Shortcut | Description                                    |
|---------------------------|:--------:|------------------------------------------------|
|OJS: Check Syntax          |F7        | Syntax Check                                   |
|OJS: Preview Web Page      |Ctrl+K V  | Preview notebook in an embedded Web Page       |
|OJS: Import Notebook       |          | Import notebook cells into current document    |
|OJS: Export to HTML        |          | Export as a self contained HTML file           |

## Settings
_All settings are prefixed with "ojs." and are available via `file -> preferneces -> settings` menu_

| Setting                   | Description                                               |
|---------------------------|-----------------------------------------------------------|
| ojs.refreshPreviewOnSave  | Refresh preview (if visible) when OJS document is saved   |

## Sample File (myfile.ojs)
_Sample content to get started with_

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
