import { type Notebook, type Cell, parseJavaScript, serialize, deserialize, toCell, toNotebook } from "@observablehq/notebook-kit";

export type RegularFunction = (...args: any[]) => any;
interface RegularFunctionConstructor {
    /**
     * Creates a new function.
     * @param args A list of arguments the function accepts.
     */
    new(...args: string[]): RegularFunction;
    (...args: string[]): RegularFunction;
    readonly prototype: RegularFunction;
}

export type AsyncFunction = (...args: any[]) => Promise<any>;
interface AsyncFunctionConstructor {
    /**
     * Creates a new async function.
     * @param args A list of arguments the function accepts.
     */
    new(...args: string[]): AsyncFunction;
    (...args: string[]): AsyncFunction;
    readonly prototype: AsyncFunction;
}

export type GeneratorFunction = (...args: any[]) => Generator<any, any, any>;
interface GeneratorFunctionConstructor {
    /**
     * Creates a new generator function.
     * @param args A list of arguments the function accepts.
     */
    new(...args: string[]): GeneratorFunction;
    (...args: string[]): GeneratorFunction;
    readonly prototype: GeneratorFunction;
}

export type AsyncGeneratorFunction = (...args: any[]) => AsyncGenerator<any, any, any>;
interface AsyncGeneratorFunctionConstructor {
    /**
     * Creates a new async generator function.
     * @param args A list of arguments the function accepts.
     */
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

export function html2notebook(html: string): Notebook {
    return deserialize(html);
}

export function notebook2html(notebook: Notebook): string {
    return serialize(notebook);
}

const UI_ORIGIN = "https://observablehq.com";
const API_ORIGIN = "https://api.observablehq.com";

export async function download(partialUrl: string): Promise<Notebook> {
    let url = new URL(partialUrl, UI_ORIGIN);
    if (url.origin === UI_ORIGIN) {
        url = new URL(`/document${url.pathname.replace(/^\/d\//, "/")}`, API_ORIGIN);
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error(`unable to fetch: ${url}`);
    const { title, nodes } = await response.json();
    for (const node of nodes) {
        if (node.mode === "js") {
            node.mode = "ojs";
        }
    }
    return toNotebook({ title, cells: nodes });
}
