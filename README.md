# Observable JS

VS Code extension for "Observable JavaScript" by [ObservableHQ](https://observablehq.com/).  This extension would not have been possible without the following:
* [ObservableHQ/parser](https://github.com/observablehq/parser)
* [ObservableHQ/runtime](https://github.com/observablehq/runtime)
* [@hpcc-js/observable-md](https://github.com/hpcc-systems/Visualization/tree/master/packages/observable-md)

## Quick Start

1. Create a new file with the `.ojs` extension.
2. Enter "Observable JavaScript" as you would with any language.
3. Commands:
  * `OJS: Check Syntax`
  * `OJS: Preview WebPage`
  * `OJS: Export WebPage (todo)`

## Sample File (myfile.ojs)

Som sample content to get started with

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
