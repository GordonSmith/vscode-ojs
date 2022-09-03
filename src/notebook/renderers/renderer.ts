import { Inspector } from "@observablehq/inspector";
import type { ActivationFunction } from "vscode-notebook-renderer";
import type { OJSOutput } from "../controller/controller";
import { Notebook } from "../../compiler/notebook";
import { Cell } from "../../compiler/cell";

export const activate: ActivationFunction = context => {

    context.onDidReceiveMessage!(e => {
    });


    const notebooks: { [uri: string]: Notebook } = {};
    const cells: { [id: string]: Cell } = {};

    function disposeCell(id: string) {
        if (cells[id]) {
            cells[id].dispose();
            delete cells[id];
        }
    }

    return {
        renderOutputItem(outputItem, element) {

            const data: OJSOutput = outputItem.json();
            if (!notebooks[data.uri]) {
                notebooks[data.uri] = new Notebook(data.notebook);
            }
            if (!cells[outputItem.id]) {
                cells[outputItem.id] = notebooks[data.uri].createCell(name => {
                    const div = document.createElement("div");
                    element.appendChild(div);
                    return new Inspector(div);
                });
            }
            cells[outputItem.id]
                .text(data.ojsSource)
                .evaluate()
                .catch(e => {
                    element.innerText = e.message;
                });
        },

        disposeOutputItem(id?: string) {
            if (id) {
                disposeCell(id);
            }
            for (const key in cells) {
                disposeCell(key);
            }
        }
    };
};

