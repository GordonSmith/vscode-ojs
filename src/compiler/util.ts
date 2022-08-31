import { ancestor, simple } from "acorn-walk";
import { walk } from "@observablehq/parser";

interface Ref {
    start: number,
    end: number,
    newText: string
}

export interface Refs {
    inputs: string[];
    args: string[];
    patches: Ref[];
}

export function calcRefs(cellAst, cellStr): Refs {
    if (cellAst.references === undefined) return { inputs: [], args: [], patches: [] };

    const dedup = {};
    cellAst.references.forEach(r => dedup[cellStr.substring(r.start, r.end)] = true);
    const retVal: Refs = {
        inputs: Object.keys(dedup),
        args: Object.keys(dedup).map(r => r.split(" ").join("_")),
        patches: []
    };
    const pushPatch = (node, newText) => retVal.patches.push({ start: node.start - cellAst.body.start, end: node.end - cellAst.body.start, newText });
    ancestor(cellAst.body, {
        Identifier(node) {
            const value = cellStr.substring(node.start, node.end);
            if (dedup[value]) {
            }
        },
        MutableExpression(node) {
            const value = cellStr.substring(node.start, node.end);
            const newText = value.split(" ").join("_") + ".value";
            pushPatch(node, newText);
        },
        ViewExpression(node) {
            const value = cellStr.substring(node.start, node.end);
            const newText = value.split(" ").join("_");
            pushPatch(node, newText);
        },
        ThisExpression(node, ancestors: acorn.Node[]) {
            const value = cellStr.substring(node.start, node.end);
            if (value === "this" && !ancestors.find(n => n.type === "FunctionExpression")) {
                pushPatch(node, "(this === window ? undefined : this.valueOf())");
            }
        }
    }, walk);
    return retVal;
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

//  Hide "import" from bundlers as they have a habit of replacing "import" with "require"
export async function obfuscatedImport(url: string) {
    return new FuncTypes.asyncFunctionType("url", "return import(url)")(url);
}

export function createFunction(refs: Refs, body: string, async = false, generator = false, blockStatement = false) {
    refs.patches.sort((l, r) => r.start - l.start);
    refs.patches.forEach(r => {
        body = body.substring(0, r.start) + r.newText + body.substring(r.end);
    });
    return new (funcType(async, generator))(...refs.args, blockStatement ? body.substring(1, body.length - 1).trim() : `return (${body});`);
}

export function encodeOMD(str: string) {
    return str
        .split("`").join("\`")
        .split("$").join("\$")
        ;
}

export function encodeMD(str: string) {
    return str
        .split("`").join("\\`")
        .split("$").join("\\$")
        ;
}

export function encodeBacktick(str: string) {
    return str
        .split("`").join("\\`")
        ;
}

export type OJSVariableMessageType = "error" | "pending" | "fulfilled" | "rejected";
export class OJSSyntaxError {
    name = "OJSSyntaxError";

    constructor(public start: number, public end: number, public message: string) {
    }
}

export class OJSRuntimeError {
    name = "OJSRuntimeError";

    constructor(public severity: OJSVariableMessageType, public start: number, public end: number, public message: string) {
    }
}
