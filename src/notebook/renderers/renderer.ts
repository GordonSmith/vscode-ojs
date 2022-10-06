import type { CellFunc, compileFunc, ohq } from "@hpcc-js/observablehq-compiler";
import { compile } from "@hpcc-js/observablehq-compiler";
import { Runtime } from "@observablehq/runtime";
import { Inspector } from "@observablehq/inspector";
import { Library } from "@observablehq/stdlib";
import type { ActivationFunction } from "vscode-notebook-renderer";
import type { OJSCell, OJSOutput } from "../controller/controller";

// import "../../../src/notebook/renderers/renderer.css";

class NullObserver implements ohq.Inspector {
    pending() {
    }
    fulfilled(value: any) {
    }
    rejected(error: any) {
    }
}
const nullObserver = new NullObserver();

interface Renderer {
    runtime: ohq.Runtime;
    define: compileFunc;
    main: ohq.Module;
}

interface Cell {
    text: string;
    element?: HTMLElement;
    renderer: Renderer;
    cellFunc: CellFunc;
}

export const activate: ActivationFunction = context => {

    const notebooks: { [uri: string]: Renderer } = {};
    const cells: { [id: string | number]: Cell } = {};
    let vscodeId: { [id: string]: string | number } = {};

    async function update(id: string | number, renderer: Renderer, text: string, element?: HTMLElement) {

        if (cells[id] && ((!cells[id].element && element) || cells[id].text !== text)) {
            disposeCell(id);
        } else if (cells[id]) {
        }
        if (!cells[id]) {
            const cellFunc: CellFunc = await renderer.define.set({
                // ...data.node,
                id,
                mode: "js",
                value: text,
            });
            try {
                cellFunc(renderer.runtime, renderer.main, (name?: string, id?: string | number): ohq.Inspector => {
                    if (element) {
                        element.replaceChildren(...[]);
                        const div = document.createElement("div");
                        element.appendChild(div);
                        const inspector = new Inspector(div);
                        return {
                            pending() {
                                div.innerText = "...pending...";
                                inspector.pending();
                            },
                            fulfilled(value: any) {
                                inspector.fulfilled(value);
                            },
                            rejected(error: any) {
                                inspector.rejected(error);
                            }
                        };
                    }
                    return nullObserver;
                });
            } catch (e) {
            }
            cells[id] = {
                renderer,
                cellFunc,
                text,
                element
            };
        }
    }

    async function render(id: any, data: OJSOutput, element?: HTMLElement) {
        data.folder = `https://file+.vscode-resource.vscode-cdn.net${data.folder}`;
        if (!notebooks[data.uri]) {
            const library = new Library();
            const runtime = new Runtime(library) as ohq.Runtime;
            const define = await compile({ files: data.notebook.files, nodes: [] } as unknown as ohq.Notebook, { baseUrl: data.folder });
            const main = define(runtime);

            notebooks[data.uri] = {
                runtime,
                define,
                main
            };
        }
        update(data.cell.node.id, notebooks[data.uri], data.cell.ojsSource, element);
        vscodeId[id] = data.cell.node.id;

        for (const cell of data.otherCells) {
            update(cell.node.id, notebooks[data.uri], cell.ojsSource);
        }
    }

    function disposeCell(id: string | number) {
        if (cells[id]) {
            cells[id].renderer.define.delete(id);
            delete cells[id];
        }
    }

    return {
        renderOutputItem(outputItem, element) {
            const data: OJSOutput = outputItem.json();
            render(outputItem.id, data, element);
        },

        async disposeOutputItem(id?: string) {
            if (id) {
                disposeCell(vscodeId[id]);
                delete vscodeId[id];
            } else {
                Object.keys(cells).map(disposeCell);
                vscodeId = {};
            }
        }
    };
};

