import { OJSRuntime } from "@hpcc-js/observable-md";

import "../src/runtime.css";

import "@observablehq/inspector/dist/inspector.css";

export function renderTo(domNode, ojs) {
    const compiler = new OJSRuntime(domNode);
    compiler.evaluate("", ojs);
}
