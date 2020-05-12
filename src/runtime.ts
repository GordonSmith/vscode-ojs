import { OJSRuntime, OMDRuntime } from "@hpcc-js/observable-md";

import "../src/runtime.css";

import "@observablehq/inspector/dist/inspector.css";

export function renderTo(domNode, languageId, ojs) {
    const compiler = languageId === "omd" ? new OMDRuntime(domNode) : new OJSRuntime(domNode);

    compiler.evaluate("", ojs);
}
