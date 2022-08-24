import { Inspector } from "@observablehq/inspector";
import type { ActivationFunction } from "vscode-notebook-renderer";
import type { OJSOutput } from "../notebook/controller";
import { OJSNotebook } from "./ojsNotebook";
import { OJSVariable } from "./ojsVariable";

export const activate: ActivationFunction = context => {

    const notebooks: { [uri: string]: OJSNotebook } = {};
    const variables: { [id: string]: OJSVariable } = {};

    return {
        renderOutputItem(outputItem, element) {
            const data: OJSOutput = outputItem.json();
            if (!notebooks[data.uri]) {
                notebooks[data.uri] = new OJSNotebook(data.notebook);
            }
            if (!variables[outputItem.id]) {
                variables[outputItem.id] = notebooks[data.uri].createVariable(new Inspector(element));
            }
            variables[outputItem.id]
                .define(data.ojsSource)
                .catch(e => {
                    element.innerText = e.message;
                });
        },

        disposeOutputItem(id?: string) {
            if (variables[id]) {
                variables[id].dispose();
            }
        }
    };
};

