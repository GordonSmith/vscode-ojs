import type { ActivationFunction } from "vscode-notebook-renderer";
import { NotebookRuntime } from "../compiler/runtime";
import { type Definition, Cell, compileCell } from "../compiler";
import { NotebookCell } from "../common/types";

import "@observablehq/notebook-kit/global.css";
import "@observablehq/notebook-kit/inspector.css";
import "@observablehq/notebook-kit/highlight.css";
import "@observablehq/notebook-kit/plot.css";
import "@observablehq/notebook-kit/index.css";
import "@observablehq/notebook-kit/syntax-dark.css";
import "@observablehq/notebook-kit/abstract-dark.css";
import "@observablehq/notebook-kit/theme-slate.css";
import "./observable-kit-renderer.css";

class NotebookRuntimeEx {

    vscodeCell2Cell = new Map<string, number>();
    runtime = new NotebookRuntime();

    constructor() {
    }

    has(id: string) {
        return this.vscodeCell2Cell.has(id);
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

function renderCell(cell: Cell, cellSource: string = cell.value, hostElement: HTMLElement = document.body) {
    const definitions = compileCell({
        ...cell,
        value: cellSource
    });
    definitions.forEach(async (def) => {
        const observableDiv = await runtime.add(`cell_${def.id}`, def);
        hostElement?.appendChild(observableDiv);
    });
}

export const activate: ActivationFunction = context => {
    return {
        async renderOutputItem(outputItem, element) {
            const nbCell: NotebookCell = outputItem.json();
            for (const cell of nbCell.notebook.cells) {
                if (cell.id !== nbCell.cell.id && !runtime.has(`cell_${cell.id}`)) {
                    await renderCell({
                        ...cell,
                        hidden: false,
                        pinned: false,
                    });
                }
            }
            await renderCell({ ...nbCell.cell, hidden: false, pinned: false }, nbCell.cellText, element as HTMLDivElement);
        },

        async disposeOutputItem(id?: string) {
            if (id) {
                await runtime.remove(id);
            } else {
                await runtime.removeAll();
            }
        }
    };
};

