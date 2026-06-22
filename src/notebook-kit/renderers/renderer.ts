import type { ActivationFunction } from "vscode-notebook-renderer";
import { type Definition, Cell, compileCell } from "@hpcc-js/observablehq-compiler";
import { NotebookRuntime } from "@hpcc-js/observablehq-compiler/dist/runtime";
import { NotebookCell } from "../common/types";

import "@observablehq/notebook-kit/global.css";
import "@observablehq/notebook-kit/inspector.css";
import "@observablehq/notebook-kit/highlight.css";
import "@observablehq/notebook-kit/plot.css";
import "@observablehq/notebook-kit/index.css";
import "@observablehq/notebook-kit/syntax-dark.css";
import "@observablehq/notebook-kit/abstract-dark.css";
import "@observablehq/notebook-kit/theme-slate.css";
import "./renderer.css";

class NotebookRuntimeEx {

    vscodeCell2Cell = new Map<string, number>();
    runtime = new NotebookRuntime();

    constructor() {
    }

    has(id: string) {
        return this.vscodeCell2Cell.has(id);
    }

    empty(): boolean {
        return this.vscodeCell2Cell.size === 0;
    }

    reset() {
        this.vscodeCell2Cell.clear();
        this.runtime = new NotebookRuntime();
    }

    async add(id: string, definition: Definition) {
        if (this.vscodeCell2Cell.has(id)) {
            return this.runtime.update(definition);
        }
        this.vscodeCell2Cell.set(id, definition.id);
        return this.runtime.add(definition);
    }

    async remove(id: string) {
        if (this.vscodeCell2Cell.has(id)) {
            const cellId = this.vscodeCell2Cell.get(id);
            this.vscodeCell2Cell.delete(id);
            return this.runtime.remove(cellId);
        }
    }

    async removeAll() {
        this.runtime.removeAll();
        this.runtime = new NotebookRuntime();
    }
}

const runtime = new NotebookRuntimeEx();

// Maps VS Code output item ID → the Observable cell key rendered by that item.
const outputId2CellKey = new Map<string, string>();

async function renderCell(cell: Cell, cellSource: string = cell.value, hostElement: HTMLElement = document.body) {
    const definitions = compileCell({
        ...cell,
        value: cellSource
    }, { resolveLocalImports: true });
    await Promise.all(definitions.map(async (def) => {
        const observableDiv = await runtime.add(`cell_${def.id}`, def);
        if (observableDiv.parentElement !== hostElement) {
            hostElement.appendChild(observableDiv);
        }
    }));
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

export const activate: ActivationFunction = context => {
    return {
        async renderOutputItem(outputItem, element) {
            const nbCell: NotebookCell = outputItem.json();
            const cellKey = `cell_${nbCell.cell.id}`;
            outputId2CellKey.set(outputItem.id, cellKey);
            for (const cell of nbCell.notebook.cells) {
                if (cell.id !== nbCell.cell.id && !runtime.has(`cell_${cell.id}`)) {
                    renderCell({
                        ...cell,
                        hidden: false,
                        pinned: false,
                    });
                }
            }
            await renderCell({ ...nbCell.cell, hidden: false, pinned: false }, nbCell.cellText, element as HTMLDivElement);
        },

        disposeOutputItem(id?: string) {
            if (id) {
                const cellKey = outputId2CellKey.get(id);
                if (cellKey) {
                    runtime.remove(cellKey);
                    outputId2CellKey.delete(id);
                }
                if (runtime.empty()) {
                    runtime.reset();
                }
            } else {
                runtime.removeAll();
                outputId2CellKey.clear();
            }
        }
    };
};

