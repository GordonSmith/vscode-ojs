import type { ActivationFunction } from "vscode-notebook-renderer";
import { type DefineState, type Definition, NotebookRuntime, observe } from "@observablehq/notebook-kit/runtime";
import { Cell, compileKit, type Notebook } from "../compiler";
import { NotebookCell } from "../common/types";

import "@observablehq/notebook-kit/global.css";
import "@observablehq/notebook-kit/inspector.css";
import "@observablehq/notebook-kit/highlight.css";
import "@observablehq/notebook-kit/plot.css";
import "@observablehq/notebook-kit/index.css";
import "@observablehq/notebook-kit/syntax-dark.css";
import "@observablehq/notebook-kit/abstract-dark.css";
import "@observablehq/notebook-kit/theme-slate.css";

class NotebookRuntimeEx extends NotebookRuntime {

    stateById = new Map<string, DefineState>();
    observeById = new Map<string, typeof observe>();

    constructor() {
        super();
    }

    has(cellId: string): boolean {
        return this.stateById.has(cellId);
    }

    async add(cellId: string, definition: Definition, placeholderDiv: HTMLDivElement): Promise<void> {
        let state: DefineState | undefined = this.stateById.get(cellId);
        if (state) {
            this.remove(cellId);
        }
        state = { root: placeholderDiv, expanded: [], variables: [] };
        this.stateById.set(cellId, state);
        this.define(state, definition);
        // await this.runtime._computeNow();
    }

    async remove(cellId: string): Promise<void> {
        const state = this.stateById.get(cellId);
        if (!state) return;
        [...state.variables].forEach(v => v.delete());
        this.stateById.delete(cellId);
        state.root?.remove();
        // await this.runtime._computeNow();
    }

    async removeAll(): Promise<void> {
        const keys = [...this.stateById.keys()];
        for (const key of keys) {
            this.remove(key);
        }
        // await this.runtime._computeNow();
    }
}

let runtime = new NotebookRuntimeEx();

function renderCell(cell: Cell, cellSource: string = cell.value, hostElement: HTMLElement = document.body) {
    const id = `cell_placeholder_${cell.id}`;
    const placeholder = (hostElement?.querySelector(`#${id}`) as HTMLDivElement | null) ?? document.createElement("div");
    placeholder.className = "observablehq observablehq--cell";
    placeholder.id = id;
    try {
        const notebook: Notebook = {
            title: "Untitled",
            theme: "slate",
            readOnly: true,
            cells: [{ ...cell, value: cellSource }]
        };

        const compiled = compileKit(notebook);
        compiled.forEach((cell) => {
            const definition: Definition = {
                id: cell.id,
                body: (cell as any).body ?? (() => { }),
                inputs: (cell as any).inputs,
                outputs: (cell as any).outputs,
                output: (cell as any).output,
                autodisplay: (cell as any).autodisplay,
                autoview: (cell as any).autoview,
                automutable: (cell as any).automutable
            };
            runtime.add(`cell_${definition.id}`, definition, placeholder);
        });
    } catch (error) {
        placeholder.style.color = "red";
        const message = error instanceof Error ? error.message : String(error);
        placeholder.textContent = `Renderer error: ${message}`;
    }
    hostElement?.appendChild(placeholder);
}

export const activate: ActivationFunction = context => {
    return {
        renderOutputItem(outputItem, element) {

            const nbCell: NotebookCell = outputItem.json();
            for (const cell of nbCell.notebook.cells) {
                if (cell.id !== nbCell.cell.id && !runtime.has(`cell_${cell.id}`)) {
                    renderCell(cell);
                }
            }
            renderCell(nbCell.cell, nbCell.cellText, element as HTMLDivElement);
        },

        disposeOutputItem(id?: string) {
            if (id) {
                runtime.remove(id);
            } else {
                runtime.removeAll();
                runtime = new NotebookRuntimeEx();
            }
        }
    };
};

