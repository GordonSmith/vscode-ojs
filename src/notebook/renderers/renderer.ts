import type { CellFunc, compileFunc, ohq } from "@hpcc-js/observablehq-compiler";
import { compile } from "@hpcc-js/observablehq-compiler";
import { Runtime } from "@observablehq/runtime";
import { Inspector } from "@observablehq/inspector";
import type { ActivationFunction } from "vscode-notebook-renderer";
import type { OJSOutput } from "../controller/controller";

interface Renderer {
    runtime: ohq.Runtime;
    define: compileFunc;
    main: ohq.Module;
}

interface Cell {
    text: string;
    element?: HTMLElement;
    renderer: Renderer;
}

export const activate: ActivationFunction = context => {

    const notebooks: { [uri: string]: Promise<Renderer> } = {};
    const cells: { [id: string | number]: Cell } = {};
    let vscodeId: { [id: string]: string | number } = {};

    async function update(id: string | number, renderer: Renderer, text: string, element?: HTMLElement) {

        if (cells[id] && ((!cells[id].element && element) || cells[id].text !== text)) {
            disposeCell(id);
        }
        if (!cells[id]) {
            cells[id] = {
                renderer,
                text,
                element
            };
            const cellFunc: CellFunc = await renderer.define.set({
                // ...data.node,
                id,
                mode: "js",
                value: text,
            });
            await new Promise<void>(resolve => {
                cellFunc(renderer.runtime, renderer.main, (name?: string, id?: string | number): ohq.Inspector => {
                    if (element) {
                        const div = document.createElement("div");
                        element.appendChild(div);
                        const inspector = new Inspector(div);
                        return {
                            _node: inspector._node,
                            pending() {
                                div.innerText = "...pending...";
                                inspector.pending();
                            },
                            fulfilled(value: any) {
                                resolve();
                                inspector.fulfilled(value);
                            },
                            rejected(error: any) {
                                resolve();
                                inspector.rejected(error);
                            }
                        };
                    }
                    return {
                        pending() {
                        },
                        fulfilled(value: any) {
                            resolve();
                        },
                        rejected(error: any) {
                            resolve();
                        }
                    };
                });
            });
        }
    }

    async function createRenderer(data: OJSOutput): Promise<Renderer> {
        if (!notebooks[data.uri]) {
            const runtime = new Runtime() as ohq.Runtime;
            notebooks[data.uri] = compile({ files: data.notebook.files, nodes: [] } as unknown as ohq.Notebook, { baseUrl: data.folder })
                .then(define => {
                    return {
                        runtime,
                        define,
                        main: define(runtime)
                    };
                });
        }
        return notebooks[data.uri];
    }

    async function render(id: any, data: OJSOutput, element?: HTMLElement) {
        data.folder = `https://file+.vscode-resource.vscode-cdn.net${data.folder}`;
        const renderer = await createRenderer(data);
        await update(data.cell.node.id, renderer, data.cell.ojsSource, element);
        vscodeId[id] = data.cell.node.id;

        for (const cell of data.otherCells) {
            update(cell.node.id, renderer, cell.ojsSource);
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
            return render(outputItem.id, data, element);
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

