import { type Notebook, type Cell, toCell, toNotebook, parseJavaScript, serialize, deserialize } from "@observablehq/notebook-kit";

export type { Notebook, Cell };

// Shared function constructor utilities to avoid duplication between util modules.

export type RegularFunction = (...args: any[]) => any;
interface RegularFunctionConstructor {
    new(...args: string[]): RegularFunction;
    (...args: string[]): RegularFunction;
    readonly prototype: RegularFunction;
}

export type AsyncFunction = (...args: any[]) => Promise<any>;
interface AsyncFunctionConstructor {
    new(...args: string[]): AsyncFunction;
    (...args: string[]): AsyncFunction;
    readonly prototype: AsyncFunction;
}

export type GeneratorFunction = (...args: any[]) => Generator<any, any, any>;
interface GeneratorFunctionConstructor {
    new(...args: string[]): GeneratorFunction;
    (...args: string[]): GeneratorFunction;
    readonly prototype: GeneratorFunction;
}

export type AsyncGeneratorFunction = (...args: any[]) => AsyncGenerator<any, any, any>;
interface AsyncGeneratorFunctionConstructor {
    new(...args: string[]): AsyncGeneratorFunction;
    (...args: string[]): AsyncGeneratorFunction;
    readonly prototype: AsyncGeneratorFunction;
}

export type AnyFunction = RegularFunction | AsyncFunction | GeneratorFunction | AsyncGeneratorFunction;

export const FunctionConstructors: {
    regular: RegularFunctionConstructor;
    async: AsyncFunctionConstructor;
    generator: GeneratorFunctionConstructor;
    asyncGenerator: AsyncGeneratorFunctionConstructor;
} = {
    regular: Object.getPrototypeOf(function () { }).constructor as RegularFunctionConstructor,
    async: Object.getPrototypeOf(async function () { }).constructor as AsyncFunctionConstructor,
    generator: Object.getPrototypeOf(function* () { }).constructor as GeneratorFunctionConstructor,
    asyncGenerator: Object.getPrototypeOf(async function* () { }).constructor as AsyncGeneratorFunctionConstructor,
};

function funcType(async: boolean = false, generator: boolean = false) {
    if (!async && !generator) return FunctionConstructors.regular;
    if (async && !generator) return FunctionConstructors.async;
    if (!async && generator) return FunctionConstructors.generator;
    return FunctionConstructors.asyncGenerator;
}

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

export function createFunction(refs: Refs, async = false, generator = false, blockStatement = false, body?: string) {
    if (body === undefined) {
        return undefined;
    }

    refs.patches.sort((l, r) => r.start - l.start);
    refs.patches.forEach(r => {
        body = body!.substring(0, r.start) + r.newText + body!.substring(r.end);
    });
    return new (funcType(async, generator))(...refs.args, blockStatement ?
        body.substring(1, body.length - 1).trim() :
        `return (\n${body}\n);`);
}

function join(baseURL: string, relativeURL: string) {
    return relativeURL
        ? baseURL.replace(/\/+$/, "") + "/" + relativeURL.replace(/^\/+/, "")
        : baseURL;
}

export const isRelativePath = (path: string) => path[0] === ".";
export const fixRelativeUrl = (path: string, basePath: string) => {
    if (isRelativePath(path)) {
        return join(basePath, path);
    }
    return path;
};

//  Hide "import" from bundlers as they have a habit of replacing "import" with "require"
const obfuscatedImportFunction = new FunctionConstructors.async("url", "return import(url)");
export async function obfuscatedImport(url: string) {
    return obfuscatedImportFunction(url);
}

function _constructFunction(body, bodyStr: string) {
    if (body.type !== "FunctionExpression" && body.type !== "FunctionDeclaration" && body.type !== "ArrowFunctionExpression") {
        throw new Error(`Unsupported function type: ${body.type}`);
    }
    const func = body.async && body.generator ?
        FunctionConstructors.asyncGenerator :
        body.async ?
            FunctionConstructors.async :
            body.generator ?
                FunctionConstructors.generator :
                FunctionConstructors.regular;

    const params = body.params?.map((param) => bodyStr.slice(param.start, param.end)).join(", ") ?? "";
    const isBlock = body.body.type === "BlockStatement";
    const { start, end } = body.body;
    const inner = isBlock
        ? bodyStr.slice(start + 1, end - 1)
        : `return ${bodyStr.slice(start, end)}`;
    return func(params, inner);
}

export function constructFunction(bodyStr: string) {
    const { body } = parseJavaScript(bodyStr);
    if (body.type === "Program") {
        if (body.body.length !== 1) {
            throw new Error(`Expected a single function, but found ${body.body.length} statements`);
        }
        return _constructFunction(body.body[0], bodyStr);
    }
    return _constructFunction(body, bodyStr);
}

export const html2notebook = (html: string): Notebook => deserialize(html);
export const notebook2html = (notebook: Notebook): string => serialize(notebook);
