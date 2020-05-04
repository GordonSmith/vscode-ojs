import { select } from "@hpcc-js/common";
import { OJSRuntime, VariableValue } from "@hpcc-js/observable-md";
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

const placeholder = select("#placeholder");

if (window["__hpcc_test"]) {
    placeholder.text("");
    const compiler = new OJSRuntime("#placeholder");

    compiler.watch(notifcations => {
        console.log(notifcations);
    });

    compiler.evaluate("", `\
{
    let i = 0;
    while(true) {
        yield Promises.tick(1000, ++i);
    }
}
`);

} else {
    const vscode = acquireVsCodeApi();

    let hash: string;
    let compiler: OJSRuntime;
    let watcher: IObserverHandle;

    function stringify(value: any): string {
        if (value instanceof Element) {
            return value.outerHTML;
        }
        const type = typeof value;
        switch (type) {
            case "string":
            case "number":
            case "bigint":
            case "boolean":
            case "symbol":
            case "undefined":
                return value.toString();
            case "function":
                return "ƒ()";
            case "object":
                if (Array.isArray(value)) {
                    return "[Array]";
                }
        }
        if (value.toString) {
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

    function evaluate(content: string, callbackID: string) {
        const newHash = hashSum(content);
        if (hash !== newHash) {
            hash = newHash;

            if (watcher) {
                watcher.release();
            }

            placeholder.text("");
            compiler = new OJSRuntime("#placeholder");

            watcher = compiler.watch(variableValues => {
                vscode.postMessage<ValueMessage>({
                    command: "values",
                    content: valuesContent(variableValues)
                });
            });

            compiler.evaluate("", content).then(variableValues => {
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
        vscode.postMessage<AlertMessage>({
            command: "alert",
            content: "echo:  " + content
        });
    }

    vscode.postMessage<LoadedMessage>({
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
