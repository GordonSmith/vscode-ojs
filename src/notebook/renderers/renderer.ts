import type { ActivationFunction } from "vscode-notebook-renderer";
import { Notebook, Mode, Node, Observer, nullObserver, ohq } from "@hpcc-js/observablehq-compiler";
import type { OJSOutput } from "../controller/controller";
import { cell2node, languageId2Mode, text2value } from "../controller/util";

// import "../../../src/notebook/renderers/renderer.css";

export const activate: ActivationFunction = context => {

    const notebooks: { [uri: string]: Notebook } = {};
    const nodes: { [id: string]: { node: Node, element?: HTMLElement } } = {};

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
            notebooks[data.uri] = new Notebook()
                .ohqNotebook(data.notebook)
                ;
        }
        if (nodes[id] && !nodes[id].element && element) {
            disposeCell(id);
        }
        if (!nodes[id]) {
            nodes[id] = {
                node: notebooks[data.uri].createCell((name): ohq.Inspector => {
                    if (element) {
                        const div = document.createElement("div");
                        element.appendChild(div);
                        return new Observer(div);
                    }
                    return nullObserver;
                })
            };
        }
        const { mode, value } = cell2node(data.languageId, data.text);
        if (nodes[id].node.mode() !== mode || nodes[id].node.value() !== value) {
            nodes[id].node
                .mode(mode)
                .value(value)
                .interpret()
                ;
        }
    }

    function disposeCell(id: string) {
        if (nodes[id]) {
            nodes[id].node.dispose();
            delete nodes[id];
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
                Object.keys(nodes).forEach(disposeCell);
            }
        }
    };
};

