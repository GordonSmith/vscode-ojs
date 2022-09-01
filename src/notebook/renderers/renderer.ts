import { Inspector } from "@observablehq/inspector";
import type { ActivationFunction } from "vscode-notebook-renderer";
import type { OJSOutput } from "../controller/controller";
import { Notebook } from "../../compiler/notebook";
import { Cell, nullObserver } from "../../compiler/cell";
import { observablehq } from "src/compiler/types";

export const activate: ActivationFunction = context => {

    const notebooks: { [uri: string]: Notebook } = {};
    const cells: { [id: string]: { cell: Cell, element?: HTMLElement } } = {};

    context.onDidReceiveMessage!(e => {
        switch (e.command) {
            case "renderOutputItem":
                e.outputs.forEach(([id, data, oldId]) => {
                    if (oldId && oldId !== id) {
                        disposeCell(oldId);
                    }
                    render(id, data);
                });
                break;
            case "disposeOutputItem":
                disposeCell(e.id);
        }
    });

    function render(id: string, data: OJSOutput, element?: HTMLElement) {
        if (!notebooks[data.uri]) {
            notebooks[data.uri] = new Notebook(data.notebook);
        }
        if (cells[id] && !cells[id].element && element) {
            disposeCell(id);
        }
        if (!cells[id]) {
            cells[id] = {
                cell: notebooks[data.uri].createCell((name): observablehq.Inspector => {
                    if (element) {
                        const div = document.createElement("div");
                        element.appendChild(div);
                        return new Inspector(div);
                    }
                    return nullObserver;
                }),
            };
        }
        if (cells[id].cell.text() !== data.ojsSource) {
            cells[id].cell
                .text(data.ojsSource)
                .evaluate()
                .catch(e => {
                    if (element) {
                        element.innerText = `ERROR:  ${e.message}`;
                    }
                });
        }
    }

    function disposeCell(id: string) {
        if (cells[id]) {
            cells[id].cell.dispose();
            delete cells[id];
        }
    }

    return {
        renderOutputItem(outputItem, element) {
            const data: OJSOutput = outputItem.json();
            render(outputItem.id, data, element);
        },

        disposeOutputItem(id?: string) {
            if (id) {
                disposeCell(id);
            } else {
                Object.keys(cells).forEach(disposeCell);
            }
        }
    };
};

