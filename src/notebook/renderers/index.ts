import { Inspector } from "@observablehq/inspector";
import type { ActivationFunction } from "vscode-notebook-renderer";
import type { OJSOutput } from "../controller/controller";
import { Notebook } from "../../compiler/notebook";
import { Cell } from "../../compiler/cell";

export const activate: ActivationFunction = context => {

    const notebooks: { [uri: string]: Notebook } = {};
    const variables: { [id: string]: Cell } = {};

    return {
        renderOutputItem(outputItem, element) {
            const data: OJSOutput = outputItem.json();
            if (!notebooks[data.uri]) {
                notebooks[data.uri] = new Notebook(data.notebook);
            }
            if (!variables[outputItem.id]) {
                variables[outputItem.id] = notebooks[data.uri].createCell(name => {
                    const div = document.createElement("div");
                    element.appendChild(div);
                    return new Inspector(div);
                });
            }
            variables[outputItem.id]
                .interpret(data.ojsSource)
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

