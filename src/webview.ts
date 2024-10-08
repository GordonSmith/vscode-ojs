/* eslint-disable no-inner-declarations */
import { Library, Runtime, Inspector } from "@observablehq/runtime";
import { compile, omd2notebook, ojs2notebook } from "@hpcc-js/observablehq-compiler";
import { hashSum, scopedLogger } from "@hpcc-js/util";

import "@hpcc-js/observablehq-compiler/dist/index.css";

const logger = scopedLogger("src/webview.ts");

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
    uid: string | number;
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

const placeholder = document.getElementById("placeholder")!;

if (window["__hpcc_test"]) {
    placeholder.innerText = "";

    const ohqnb = omd2notebook(`\
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

`);
    compile(ohqnb).then(compiledNB => {
        const library = new Library();
        const runtime = new Runtime(library);
        compiledNB(runtime, name => {
            const div = document.createElement("div");
            placeholder.appendChild(div);
            return new Inspector(div);
        });
    });
} else {
    const vscode = acquireVsCodeApi();

    let hash: string;

    function stringify(value: any): string {
        if (value instanceof Element) {
            return value.outerHTML;
            // } else if (value instanceof Module) {

        }
        const type = typeof value;
        switch (type) {
            case "function":
                return "ƒ()";
            case "object":
                if (Array.isArray(value)) {
                    return "[Array]";
                } else if (!value.toString) {
                    return "[object]";
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

    // function valuesContent(variableValues: VariableValue[]): Value[] {
    //     return variableValues.map(n => {
    //         return {
    //             uid: n.variable.uid(),
    //             error: n.type === "rejected",
    //             value: stringify(n.value)
    //         };
    //     });
    // }

    // function encode(str: string) {
    //     return str
    //         // .split("\\").join("\\\\")
    //         // .split("`").join("\\`")
    //         // .split("$").join("\\$")
    //         ;
    // }

    async function evaluate(content: string, languageId: string, folder: string, callbackID: string) {
        const newHash = hashSum(content);
        if (hash !== newHash) {
            hash = newHash;

            placeholder.innerText = "";

            const ohqnb =
                languageId === "omd" ? omd2notebook(content) :
                    languageId === "ojs" ? ojs2notebook(content) :
                        JSON.parse(content);
            const compiledNB = await compile(ohqnb, { baseUrl: folder }).catch(e => {
                logger.error(e);
            });
            const library = new Library();
            try {
                const runtime = new Runtime(library);
                if (compiledNB) {
                    compiledNB(runtime, (name, cellId) => {
                        const div = document.createElement("div");
                        placeholder.appendChild(div);
                        const inspector = new Inspector(div);
                        return {
                            pending() {
                                inspector.pending();
                            },

                            fulfilled(value: any) {
                                vscode.postMessage<ValueMessage>({
                                    command: "values",
                                    content: [{
                                        uid: cellId,
                                        error: false,
                                        value: stringify(value)
                                    }],
                                    callbackID
                                });
                                inspector.fulfilled(value);
                            },

                            rejected(error: any) {
                                vscode.postMessage<ValueMessage>({
                                    command: "values",
                                    content: [{
                                        uid: cellId,
                                        error: true,
                                        value: stringify(error)
                                    }],
                                    callbackID
                                });
                                inspector.rejected(error);
                            }
                        };
                    });
                }
            } catch (e: any) {
                logger.error(e);
            }

            // watcher = compiler.watch(variableValues => {
            //     vscode.postMessage<ValueMessage>({
            //         command: "values",
            //         content: valuesContent(variableValues)
            //     });
            // });

            // compiler.evaluate("", encode(content), folder)
            //     .then(variableValues => {
            //         vscode.postMessage<ValueMessage>({
            //             command: "values",
            //             content: valuesContent(variableValues),
            //             callbackID
            //         });
            //     }).catch((e: OJSSyntaxError) => {
            //         // this._errors = [new OJSRuntimeError("error", e.start, e.end, e.message)];
            //         // this.runtimeUpdated();
            //     });
        } else {
            // compiler.refresh().then(variableValues => {
            //     vscode.postMessage<ValueMessage>({
            //         command: "values",
            //         content: valuesContent(variableValues),
            //         callbackID
            //     });
            // });
        }
    }

    function pull(url: string, callbackID: string) {
        // placeholder.innerText = `Importing notebook:  ${url}`;
        // compiler = new OJSRuntime("#placeholder");
        // compiler.pull(url).then(text => {
        //     placeholder.innerText = "";
        //     vscode.postMessage({
        //         command: "pullResponse",
        //         content: text,
        //         callbackID
        //     });
        // });
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
        evaluate(prevState.content, prevState.languageId, prevState.folder, prevState.callbackID);
    }

}
