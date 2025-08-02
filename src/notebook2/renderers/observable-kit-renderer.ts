import type { ActivationFunction } from "vscode-notebook-renderer";
import type { DefineState, Definition } from "@observablehq/notebook-kit/runtime";
import { define } from "@observablehq/notebook-kit/runtime";
import type { JavaScriptCell } from "@observablehq/notebook-kit";

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

function constructFunction(parsed: JavaScriptCell) {
    if (!parsed || !parsed.body) {
        return () => undefined;
    }

    try {
        // Convert AST back to executable code string
        const codeString = astToString(parsed.body);

        // Create a function that can execute this code in the Observable runtime context
        if (parsed.expression) {
            // For expressions, create a function that returns the evaluated expression
            if (parsed.async) {
                return evil(`(async function() { return ${codeString}; })`);
            } else {
                return evil(`(function() { return ${codeString}; })`);
            }
        } else {
            // For statements/programs, create a function that executes the code
            if (parsed.async) {
                return evil(`(async function() { ${codeString} })`);
            } else {
                return evil(`(function() { ${codeString} })`);
            }
        }
    } catch (error) {
        console.error('Error constructing function from AST:', error);
        return () => `Error: ${error.message}`;
    }
}

// Simple AST to string converter - this is a minimal implementation
// In a production system, you'd want to use a proper library like escodegen
function astToString(node: any): string {
    if (typeof node === 'string') {
        return node;
    }

    if (!node || typeof node !== 'object') {
        return String(node);
    }

    switch (node.type) {
        case 'Program':
            return node.body.map((stmt: any) => astToString(stmt)).join(';\n');
        case 'ExpressionStatement':
            return astToString(node.expression);
        case 'Literal':
            return JSON.stringify(node.value);
        case 'Identifier':
            return node.name;
        case 'BinaryExpression':
            return `(${astToString(node.left)} ${node.operator} ${astToString(node.right)})`;
        case 'CallExpression':
            const callee = astToString(node.callee);
            const args = node.arguments.map((arg: any) => astToString(arg)).join(', ');
            return `${callee}(${args})`;
        case 'MemberExpression':
            const object = astToString(node.object);
            const property = node.computed ? `[${astToString(node.property)}]` : `.${node.property.name}`;
            return `${object}${property}`;
        case 'BlockStatement':
            return `{ ${node.body.map((stmt: any) => astToString(stmt)).join(';\n')} }`;
        case 'ReturnStatement':
            return `return ${node.argument ? astToString(node.argument) : ''}`;
        case 'VariableDeclaration':
            const declarations = node.declarations.map((decl: any) =>
                `${decl.id.name}${decl.init ? ' = ' + astToString(decl.init) : ''}`
            ).join(', ');
            return `${node.kind} ${declarations}`;
        case 'AssignmentExpression':
            return `${astToString(node.left)} ${node.operator} ${astToString(node.right)}`;
        default:
            // For unsupported node types, return a placeholder
            console.warn(`Unsupported AST node type: ${node.type}`);
            return `/* ${node.type} */`;
    }
}

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

                    data.value.body = constructFunction(data.parsed);;
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

