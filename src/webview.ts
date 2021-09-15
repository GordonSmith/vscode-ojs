/* eslint-disable no-inner-declarations */
import { OJSRuntime, OMDRuntime, VariableValue } from "@hpcc-js/observable-md";
import { hashSum, IObserverHandle } from "@hpcc-js/util";

export interface Message {
    callbackID?: string;
}

export interface LoadedMessage extends Message {
    command: "loaded";
    content?: unknown;
}

export interface AlertMessage extends Message {
    command: "alert";
    content: string;
}

export interface Value {
    uid: string;
    error: boolean;
    value: string;
}

export interface ValueMessage extends Message {
    command: "values";
    content: Value[];
}

interface VSCodeAPI {
    postMessage: <T extends Message>(msg: T) => void;
    setState: (newState) => void;
    getState: () => any;
}

declare const acquireVsCodeApi: () => VSCodeAPI;

const placeholder = document.getElementById("placeholder");

if (window["__hpcc_test"]) {
    placeholder.innerText = "";
    const compiler = new OMDRuntime("#placeholder");

    compiler.watch(notifcations => {
        console.log(notifcations);
    });

    compiler.evaluate("", `\
# OMD Generator Test

~~~
function* range(n) {
    for (let i = 0; i < n; ++i) {
        yield i;
    }
}

{
    for(const i of range (Infinity)); {
        yield Promises.tick(1000, i + 1);
    }
}
~~~
# Import Test

~~~;
import { selection as cars viewof } from "@d3/brushable-scatterplot";
viewof; cars;
~~~

### Selection:
~~~json
\${JSON.stringify(cars, undefined, 2)}
~~~

`, ".");
} else {
    const vscode = acquireVsCodeApi();

    let hash: string;
    let compiler: OJSRuntime | OMDRuntime;
    let watcher: IObserverHandle;

    function stringify(value: any): string {
        if (value instanceof Element) {
            return value.outerHTML;
        }
        const type = typeof value;
        switch (type) {
            case "function":
                return "ƒ()";
            case "object":
                if (Array.isArray(value)) {
                    return "[Array]";
                }
                break;
            case "string":
            case "number":
            case "bigint":
            case "boolean":
            case "symbol":
            case "undefined":
                break;
        }
        if (value?.toString) {
            return value.toString();
        }
        return value;
    }

    function valuesContent(variableValues: VariableValue[]): Value[] {
        return variableValues.map(n => {
            return {
                uid: n.variable.uid(),
                error: n.type === "rejected",
                value: stringify(n.value)
            };
        });
    }

    function evaluate(content: string, languageId: string, folder: string, callbackID: string) {
        const newHash = hashSum(content);
        if (hash !== newHash) {
            hash = newHash;

            if (watcher) {
                watcher.release();
            }

            placeholder.innerText = "";
            compiler = languageId === "omd" ? new OMDRuntime("#placeholder") : new OJSRuntime("#placeholder");

            watcher = compiler.watch(variableValues => {
                vscode.postMessage<ValueMessage>({
                    command: "values",
                    content: valuesContent(variableValues)
                });
            });

            compiler.evaluate("", content, folder).then(variableValues => {
                vscode.postMessage<ValueMessage>({
                    command: "values",
                    content: valuesContent(variableValues),
                    callbackID
                });
            });
        } else {
            compiler.refresh().then(variableValues => {
                vscode.postMessage<ValueMessage>({
                    command: "values",
                    content: valuesContent(variableValues),
                    callbackID
                });
            });
        }
    }

    function pull(url: string, callbackID: string) {
        placeholder.innerText = `Importing notebook:  ${url}`;
        compiler = new OJSRuntime("#placeholder");
        compiler.pull(url).then(text => {
            placeholder.innerText = "";
            vscode.postMessage({
                command: "pullResponse",
                content: text,
                callbackID
            });
        });
    }

    async function echo(content: string) {
        vscode.postMessage<AlertMessage>({
            command: "alert",
            content: "echo:  " + content
        });
    }

    window.addEventListener("message", event => {
        const message = event.data; // The json data that the extension sent
        switch (message.command) {
            case "evaluate":
                evaluate(message.content, message.languageId, message.folder, message.callbackID);
                vscode.setState(message);
                break;
            case "pull":
                pull(message.url, message.callbackID);
                break;
            case "echo":
                echo(message.content);
                break;
        }
    });

    vscode.postMessage<LoadedMessage>({
        command: "loaded"
    });

    const prevState = vscode.getState();
    if (prevState) {
        evaluate(prevState.content, prevState.languageId, prevState.callbackID, prevState.folder);
    }

}
