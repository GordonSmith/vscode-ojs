import { select } from "@hpcc-js/common";
import { OJSRuntime } from "@hpcc-js/observable-md";
import { hashSum } from "@hpcc-js/util";

declare const acquireVsCodeApi: () => any;

const placeholder = select("#placeholder");

if (window["__hpcc_test"]) {
    placeholder.text("");
    const compiler = new OJSRuntime("#placeholder");
    compiler.evaluate("", `\
import {chart as treemap} with {treemap_data as data} from "@d3/treemap"

mol = 42;

{
    let idx = 0;
    while(true) {
        yield ++idx;
        await Promises.delay(1000);
    }
}

treemap;
    `).then(console.log);

    setInterval(() => {
        compiler.refresh().then(console.log);
    }, 1000);
} else {
    const vscode = acquireVsCodeApi();

    interface State {
    }

    // const currState: State = vscode.getState() || {};

    let hash;
    let compiler;
    function evaluate(content: string, callbackID: string) {
        const newHash = hashSum(content);
        if (hash !== newHash) {
            hash = newHash;

            placeholder.text("");
            compiler = new OJSRuntime("#placeholder");
            compiler.evaluate("", content).then(errors => {
                vscode.postMessage({
                    command: "errors",
                    content: errors,
                    callbackID
                });
            });
        } else {
            compiler.refresh().then(errors => {
                vscode.postMessage({
                    command: "errors",
                    content: errors,
                    callbackID
                });
            });
        }
    }

    async function echo(content: string) {
        vscode.postMessage({
            command: "alert",
            content: "echo:  " + content
        });
    }

    vscode.postMessage({
        command: "loaded"
    });

    window.addEventListener("message", event => {
        const message = event.data; // The json data that the extension sent
        switch (message.command) {
            case "evaluate":
                evaluate(message.content, message.callbackID);
                break;
            case "echo":
                echo(message.content);
                break;
        }
    });

    // vscode.setState(currState);
}
