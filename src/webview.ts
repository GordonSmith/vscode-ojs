import { select } from "@hpcc-js/common";
import { OJSRuntime } from "@hpcc-js/observable-md";
import { hashSum } from "@hpcc-js/util";

declare const acquireVsCodeApi: () => any;

const placeholder = select("#placeholder");

if (window["__hpcc_test"]) {
    placeholder.text("");
    const compiler = new OJSRuntime("#placeholder");

    compiler.watch(notifcations => {
        console.log(notifcations);
    });

    compiler.evaluate("", `\

xxx = FileAttachment("test.json").json();

        `);

} else {
    const vscode = acquireVsCodeApi();

    interface State {
    }

    // const currState: State = vscode.getState() || {};

    let hash;
    let compiler;
    let watcher;
    function evaluate(content: string, callbackID: string) {
        const newHash = hashSum(content);
        if (hash !== newHash) {
            hash = newHash;

            if (watcher) {
                watcher.release();
            }

            placeholder.text("");
            compiler = new OJSRuntime("#placeholder");

            // watcher = compiler.watch(notifcations => {
            //     vscode.postMessage({
            //         command: "errors",
            //         content: notifcations.map(n => n.error)
            //     });
            // });

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

    function pull(url: string, callbackID: string) {
        placeholder.text(`Importing notebook:  ${url}`);
        compiler = new OJSRuntime("#placeholder");
        compiler.pull(url).then(text => {
            placeholder.text("");
            vscode.postMessage({
                command: "pullResponse",
                content: text,
                callbackID
            });
        });
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
            case "pull":
                pull(message.url, message.callbackID);
                break;
            case "echo":
                echo(message.content);
                break;
        }
    });

    // vscode.setState(currState);
}
