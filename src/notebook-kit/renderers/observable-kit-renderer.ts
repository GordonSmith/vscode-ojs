import type { ActivationFunction } from "vscode-notebook-renderer";
import type { DefineState, Definition } from "@observablehq/notebook-kit/runtime";
import { define } from "@observablehq/notebook-kit/runtime";
import type { Expression, Program } from "acorn";
import type { JavaScriptCell, TranspiledJavaScript } from "@observablehq/notebook-kit";

import "@observablehq/notebook-kit/index.css";
import { NotebookCell } from "../util/types";

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

const FuncTypes = {
    functionType: Object.getPrototypeOf(function () { }).constructor,
    asyncFunctionType: Object.getPrototypeOf(async function () { }).constructor,
    generatorFunctionType: Object.getPrototypeOf(function* () { }).constructor,
    asyncGeneratorFunctionType: Object.getPrototypeOf(async function* () { }).constructor
};

function funcType(async: boolean = false, generator: boolean = false) {
    if (!async && !generator) return FuncTypes.functionType;
    if (async && !generator) return FuncTypes.asyncFunctionType;
    if (!async && generator) return FuncTypes.generatorFunctionType;
    return FuncTypes.asyncGeneratorFunctionType;
}

const evil = new Function("body", "return eval(body)");

function constructFunction(parsed: JavaScriptCell | Program | Expression, js: string) {
    if (!("body" in parsed)) {
        return () => `Error:  Unknown cell type: ${parsed.type}`;
    }
    const body = Array.isArray(parsed.body) ? parsed.body[0] : parsed.body;
    if (
        body.type === "ArrowFunctionExpression" ||
        body.type === "FunctionExpression" ||
        body.type === "FunctionDeclaration"
    ) {
        try {
            // Try to use the proper function constructor based on the function's properties
            const funcAsync = body.async || false;
            const funcGenerator = body.generator || false;
            const FunctionConstructor = funcType(funcAsync, funcGenerator);

            // Extract the function body and parameters
            const params = body.params?.map((param: any) => astToString(param, js)).join(", ") || "";
            const bodyCode = body.body.type === "BlockStatement" ?
                astToString(body.body, js).slice(2, -2).trim() : // Remove { }
                `return ${astToString(body.body, js)}`;

            return new FunctionConstructor(params, bodyCode);
        } catch (constructorError) {
            // Fall back to evil if function constructor fails
            console.warn("Function constructor failed, falling back to eval:", constructorError);
            const funcString = astToString(body, js);
            return evil(`(${funcString})`);
        }
    }
    return constructFunction(body as any, js);

}

// Enhanced AST to string converter that utilizes the original source code when possible
function astToString(node: any, originalCode?: string): string {
    if (typeof node === "string") {
        return node;
    }

    if (!node || typeof node !== "object") {
        return String(node);
    }

    // If we have the original code and the node has position information,
    // extract the exact text from the original source - this is now the primary method
    if (originalCode && node.start !== undefined && node.end !== undefined) {
        const extracted = originalCode.slice(node.start, node.end);
        // Only use extracted text if it seems reasonable (not empty and not too long)
        if (extracted && extracted.length > 0 && extracted.length < 10000) {
            return extracted;
        }
    }

    // Fallback to AST reconstruction (only used when no position info available)
    switch (node.type) {
        case "Program":
            // If we have position info for the whole program, use it directly
            if (originalCode && node.start !== undefined && node.end !== undefined) {
                return originalCode.slice(node.start, node.end);
            }
            return node.body.map((stmt: any) => astToString(stmt, originalCode)).join(";\n");
        case "ExpressionStatement":
            // Use position info if available, otherwise delegate
            if (originalCode && node.start !== undefined && node.end !== undefined) {
                return originalCode.slice(node.start, node.end);
            }
            return astToString(node.expression, originalCode);
        case "Literal":
            // Use position info if available
            if (originalCode && node.start !== undefined && node.end !== undefined) {
                return originalCode.slice(node.start, node.end);
            }
            return JSON.stringify(node.value);
        case "Identifier":
            // Use position info if available
            if (originalCode && node.start !== undefined && node.end !== undefined) {
                return originalCode.slice(node.start, node.end);
            }
            return node.name;
        case "BinaryExpression":
            // Use position info if available
            if (originalCode && node.start !== undefined && node.end !== undefined) {
                return originalCode.slice(node.start, node.end);
            }
            return `(${astToString(node.left, originalCode)} ${node.operator} ${astToString(node.right, originalCode)})`;
        case "CallExpression":
            // Use position info if available
            if (originalCode && node.start !== undefined && node.end !== undefined) {
                return originalCode.slice(node.start, node.end);
            }
            const callee = astToString(node.callee, originalCode);
            const args = node.arguments.map((arg: any) => astToString(arg, originalCode)).join(", ");
            return `${callee}(${args})`;
        case "MemberExpression":
            // Use position info if available
            if (originalCode && node.start !== undefined && node.end !== undefined) {
                return originalCode.slice(node.start, node.end);
            }
            const object = astToString(node.object, originalCode);
            const property = node.computed ? `[${astToString(node.property, originalCode)}]` : `.${node.property.name}`;
            return `${object}${property}`;
        case "BlockStatement":
            // Use position info if available
            if (originalCode && node.start !== undefined && node.end !== undefined) {
                return originalCode.slice(node.start, node.end);
            }
            return `{ ${node.body.map((stmt: any) => astToString(stmt, originalCode)).join(";\n")} }`;
        case "ReturnStatement":
            // Use position info if available
            if (originalCode && node.start !== undefined && node.end !== undefined) {
                return originalCode.slice(node.start, node.end);
            }
            return `return ${node.argument ? astToString(node.argument, originalCode) : ""}`;
        case "VariableDeclaration":
            // Use position info if available
            if (originalCode && node.start !== undefined && node.end !== undefined) {
                return originalCode.slice(node.start, node.end);
            }
            const declarations = node.declarations.map((decl: any) =>
                `${decl.id.name}${decl.init ? " = " + astToString(decl.init, originalCode) : ""}`
            ).join(", ");
            return `${node.kind} ${declarations}`;
        case "AssignmentExpression":
            // Use position info if available
            if (originalCode && node.start !== undefined && node.end !== undefined) {
                return originalCode.slice(node.start, node.end);
            }
            return `${astToString(node.left, originalCode)} ${node.operator} ${astToString(node.right, originalCode)}`;
        case "ArrowFunctionExpression":
            // Use position info if available
            if (originalCode && node.start !== undefined && node.end !== undefined) {
                return originalCode.slice(node.start, node.end);
            }
            const params = node.params.map((param: any) => astToString(param, originalCode)).join(", ");
            const body = node.body.type === "BlockStatement" ?
                astToString(node.body, originalCode) :
                astToString(node.body, originalCode);
            const asyncPrefix = node.async ? "async " : "";
            const arrowBody = node.body.type === "BlockStatement" ? body : `=> ${body}`;
            return `${asyncPrefix}(${params}) ${arrowBody}`;
        case "FunctionExpression":
            // Use position info if available
            if (originalCode && node.start !== undefined && node.end !== undefined) {
                return originalCode.slice(node.start, node.end);
            }
            const funcParams = node.params.map((param: any) => astToString(param, originalCode)).join(", ");
            const funcBody = astToString(node.body, originalCode);
            const asyncFunc = node.async ? "async " : "";
            const generator = node.generator ? "*" : "";
            const funcName = node.id ? node.id.name : "";
            return `${asyncFunc}function${generator} ${funcName}(${funcParams}) ${funcBody}`;
        case "FunctionDeclaration":
            // Use position info if available
            if (originalCode && node.start !== undefined && node.end !== undefined) {
                return originalCode.slice(node.start, node.end);
            }
            const declParams = node.params.map((param: any) => astToString(param, originalCode)).join(", ");
            const declBody = astToString(node.body, originalCode);
            const asyncDecl = node.async ? "async " : "";
            const generatorDecl = node.generator ? "*" : "";
            return `${asyncDecl}function${generatorDecl} ${node.id.name}(${declParams}) ${declBody}`;
        default:
            // For unsupported node types, try position info first
            if (originalCode && node.start !== undefined && node.end !== undefined) {
                return originalCode.slice(node.start, node.end);
            }
            console.warn(`Unsupported AST node type: ${node.type}`);
            return `/* ${node.type} */`;
    }
}

export const activate: ActivationFunction = context => {
    const cellCounter = 0;

    return {
        renderOutputItem(outputItem, element) {
            try {
                const data: NotebookCell = outputItem.json();

                // Handle both data structures - initial load vs execution
                let cellId: string;
                let cellMode: string;

                if (data.metadata) {
                    // Initial load structure
                    cellId = String(data.metadata.id);
                    cellMode = data.metadata.mode;
                } else {
                    element.innerHTML = `<div style="color: red;">Error: Invalid cell data structure: ${JSON.stringify(data, null, 2)}</div>`;
                    return;
                }

                // Clear any existing content in the element first
                // element.innerHTML = '';

                // Check if container already exists, if not create it
                let container = element.querySelector(`#cell-${cellId}`) as HTMLDivElement;
                if (!container) {
                    container = document.createElement("div");
                    container.className = "observable-kit-cell-output";
                    container.id = `cell-${cellId}`;
                    element.appendChild(container);
                }
                try {
                    data.transpiled.body = constructFunction(data.parsed, data.transpiled.body);
                } catch (error) {
                    data.transpiled.body = () => `Error: ${error.message}`;
                }
                add(outputItem.id, { id: cellId, ...data.transpiled }, container);
            } catch (error) {
                const errorElement = document.createElement("div");
                errorElement.style.color = "red";
                errorElement.textContent = `Renderer error: ${error.message}`;
                element.appendChild(errorElement);
            }
        },

        async disposeOutputItem(id?: string) {
            if (id) {
                remove(id);
            } else {
                removeAll();
            }
        }
    };
};

