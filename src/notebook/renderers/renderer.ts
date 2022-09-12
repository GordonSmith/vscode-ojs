import type { ohq } from "@hpcc-js/observablehq-compiler";
import { Runtime } from "@observablehq/runtime";
import { Inspector } from "@observablehq/inspector";
import { Library } from "@observablehq/stdlib";
import { compile, compileCell } from "@hpcc-js/observablehq-compiler";
import type { ActivationFunction } from "vscode-notebook-renderer";
import type { OJSOutput } from "../controller/controller";
import { nullObserver } from "../../compiler/cell";

// import "../../../src/notebook/renderers/renderer.css";

interface Renderer {
    runtime: ohq.Runtime;
    main: ohq.Module;
}

interface Cell {
    variables: any;
    text: string;
    element?: HTMLElement;
}

export const activate: ActivationFunction = context => {

    const notebooks: { [uri: string]: Renderer } = {};
    const cells: { [id: string]: Cell } = {};

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

    // , (name?: string): ohq.Inspector => {
    //     if (element) {
    //         const div = document.createElement("div");
    //         element.appendChild(div);
    //         return new Inspector(div);
    //     }
    //     return nullObserver;
    // }) as ohq.Module;

    async function render(id: string, data: OJSOutput, element?: HTMLElement) {

        if (!notebooks[data.uri]) {
            const library = new Library();
            const runtime = new Runtime(library, {}) as ohq.Runtime;
            const define = await compile({ files: data.notebook.files, nodes: [] });
            const main = define(runtime) as ohq.Nodule;

            notebooks[data.uri] = {
                runtime,
                main
            };
        }
        if (cells[id] && ((!cells[id].element && element) || cells[id].text !== data.ojsSource)) {
            disposeCell(id);
        }
        if (!cells[id]) {
            const cell = await compileCell({
                id,
                mode: "js",
                value: data.ojsSource
            }, data.folder);
            cells[id] = {
                variables: cell(notebooks[data.uri].runtime, notebooks[data.uri].main, (name?: string): ohq.Inspector => {
                    if (element) {
                        const div = document.createElement("div");
                        element.appendChild(div);
                        return new Inspector(div);
                    }
                    return nullObserver;
                }),
                text: data.ojsSource,
                element
            };
        }
    }

    async function disposeCell(id: string) {
        if (cells[id]) {
            cells[id].variables.forEach(v => {
                try {
                    v.delete();
                } catch (e) {
                }
            });
            delete cells[id];
            await notebooks[data.uri].runtime._compute();
        }

    }

    return {
        renderOutputItem(outputItem, element) {
            const data: OJSOutput = outputItem.json();
            render(outputItem.id, data, element);
        },

        async disposeOutputItem(id?: string) {
            if (id) {
                await disposeCell(id);
            } else {
                await Promise.all(Object.keys(cells).map(disposeCell));
            }
        }
    };
};

