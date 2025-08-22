import type { ActivationFunction } from "vscode-notebook-renderer";
import { type DefineState, type Definition, NotebookRuntime, observe } from "@observablehq/notebook-kit/runtime";
import { kit } from "../kit/index";
import { NotebookCell } from "../common/types";

import "@observablehq/notebook-kit/index.css";
import "@observablehq/notebook-kit/theme-slate.css";

class NotebookRuntimeEx extends NotebookRuntime {

    stateById = new Map<string, DefineState>();
    observeById = new Map<string, typeof observe>();

    constructor() {
        super();
    }

    async add(cellId: string, definition: Definition, placeholderDiv: HTMLDivElement): Promise<void> {
        let state: DefineState | undefined = this.stateById.get(cellId);
        if (state) {
            [...state.variables].forEach(v => v.delete());
        } else {
            state = { root: placeholderDiv, expanded: [], variables: [] };
        }
        this.stateById.set(cellId, state);
        await this.runtime._computing;
        this.define(state, definition);
    }

    async remove(cellId: string): Promise<void> {
        const state = this.stateById.get(cellId);
        if (!state) return;
        [...state.variables].forEach(v => v.delete());
        await this.runtime._computing;
        this.stateById.delete(cellId);
    }

    async removeAll(): Promise<void> {
        const keys = Array.from(this.stateById.keys());
        for (const key of keys) {
            this.remove(key);
        }
    }
}

const runtime = new NotebookRuntimeEx();

export const activate: ActivationFunction = context => {
    return {
        renderOutputItem(outputItem, element) {
            try {
                const data: NotebookCell = outputItem.json();

                const notebook = {
                    title: "Untitled",
                    theme: "slate" as any,
                    readOnly: true,
                    cells: [{ ...data.metadata, value: data.cellText }]
                };
                const compiled = kit.compile(notebook);
                compiled.forEach((cell) => {
                    const definition: Definition = {
                        id: cell.id,
                        body: (cell as any).body || (() => { }),
                        inputs: (cell as any).inputs,
                        outputs: (cell as any).outputs,
                        output: (cell as any).output,
                        autodisplay: (cell as any).autodisplay,
                        autoview: (cell as any).autoview,
                        automutable: (cell as any).automutable
                    };
                    runtime.add(outputItem.id, definition, element as HTMLDivElement);
                });
            } catch (error) {
                const errorElement = document.createElement("div");
                errorElement.style.color = "red";
                const message = error instanceof Error ? error.message : String(error);
                errorElement.textContent = `Renderer error: ${message}`;
                element.appendChild(errorElement);
            }
        },

        disposeOutputItem(id?: string) {
            if (id) {
                runtime.remove(id);
            } else {
                runtime.removeAll();
            }
        }
    };
};

