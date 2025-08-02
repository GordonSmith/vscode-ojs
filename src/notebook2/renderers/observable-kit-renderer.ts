import type { ActivationFunction } from "vscode-notebook-renderer";
import type { DefineState, Definition } from "@observablehq/notebook-kit/runtime";
import { define } from "@observablehq/notebook-kit/runtime";

const stateById = new Map<string, DefineState>();

function add(vscodeCellID: string, definition: Definition, placeholderDiv: HTMLDivElement): void {
    let state = stateById.get(vscodeCellID);
    if (state) {
        state.variables.forEach((v) => v.delete());
        state.variables = [];
    } else {
        state = { root: placeholderDiv, expanded: [], variables: [] };
        stateById.set(vscodeCellID, state);
    }
    define(state, definition);
}

function remove(vscodeCellID: string): void {
    const state = stateById.get(vscodeCellID)!;
    state.root.remove();
    state.variables.forEach((v) => v.delete());
    stateById.delete(vscodeCellID);
}

function removeAll(): void {
    const keys = Array.from(stateById.keys());
    for (const key of keys) {
        remove(key);
    }
}

import "@observablehq/notebook-kit/index.css";

interface CellData {
    id: number;
    value: string;
    mode: string;
}

interface NotebookData {
    title: string;
    cells: CellData[];
}

interface RendererOutputData {
    cell: CellData;
    notebook: NotebookData;
}

// New interface for the actual data structure being passed
interface ExecutionData {
    cellId: string;
    code: string;
    originalCode: string;
    type: string;
}

const evil = new Function("body", "return eval(body)");

export const activate: ActivationFunction = context => {
    let cellCounter = 0;

    return {
        renderOutputItem(outputItem, element) {
            try {

                console.log('renderOutputItem called with:', outputItem);
                const data = outputItem.json();
                console.log('Parsed data:', data);

                // Handle both data structures - initial load vs execution
                let cellId: string;
                let cellCode: string;
                let cellMode: string;

                if (data.metadata) {
                    // Initial load structure
                    cellId = String(data.metadata.id);
                    cellCode = data.value;
                    cellMode = data.metadata.mode;
                } else {
                    console.error('Invalid data structure - missing cell data:', data);
                    element.innerHTML = `<div style="color: red;">Error: Invalid cell data structure: ${JSON.stringify(data, null, 2)}</div>`;
                    return;
                }

                console.log(`Processing cell ${cellId} with mode ${cellMode}`);

                // Clear any existing content in the element first
                // element.innerHTML = '';

                // Check if container already exists, if not create it
                let container = element.querySelector(`#cell-${cellId}`) as HTMLDivElement;
                if (!container) {
                    container = document.createElement('div');
                    container.className = 'observable-kit-cell-output';
                    container.id = `cell-${cellId}`;
                    element.appendChild(container);
                }
                try {
                    if (data.value.body.indexOf("function()") >= 0) {
                        data.value.body = data.value.body.replace("function()", '() =>');
                    } else if (data.value.body.indexOf(`function ${data.value.output}(`) >= 0) {
                        data.value.body = data.value.body.replace(`function ${data.value.output}(`, `(`);
                        data.value.body = data.value.body.replace(`){`, `) => {`);
                    }
                    data.value.body = evil(data.value.body);
                } catch (error) {
                    data.value.body = () => `Error: ${error.message}`;
                }
                add(outputItem.id, { id: cellId, ...data.value }, container);
                console.log('Observable Kit renderer processed cell:', cellId);
            } catch (error) {
                console.error('Error in Observable Kit renderer:', error);
                const errorElement = document.createElement('div');
                errorElement.style.color = 'red';
                errorElement.textContent = `Renderer error: ${error.message}`;
                element.appendChild(errorElement);
            }
        },

        async disposeOutputItem(id?: string) {
            console.log('Observable Kit renderer processed cell:', id);
            if (id) {
                remove(id);
            } else {
                removeAll();
            }
        }
    };
};

