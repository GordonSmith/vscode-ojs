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

export type Refs = { [key: string]: { from: string, to: string } };
export function createFunction(refs: Refs, _body: string, async = false, generator = false, blockStatement = false) {
    const args = [];
    const replace = [];
    let body = _body;
    for (const key in refs) {
        args.push(refs[key].to);
        replace.push(refs[key]);
    }

    //  Need to sort by length - otherwise it matches on prefix...
    replace.sort((l, r) => r.from.length - l.from.length);
    replace.forEach(r => {
        if (r.from !== r.to) {
            if (r.from.indexOf("mutable ") === 0) {
                body = body.split(r.from).join(`${r.to}.value`);
            } else {
                body = body.split(r.from).join(r.to);
            }
        }
    });
    return new (funcType(async, generator))(...args, blockStatement ? body : `{ return (${body}); }`);
}

export function calcRefs(refs, str): Refs {
    if (refs === undefined) return {};
    const dedup = {};
    refs.forEach(r => {
        const body = str.substring(r.start, r.end);
        const rhs = { from: body, to: body.split(" ").join("_") };
        if (r.idxxx) {
            dedup[r.id.name] = rhs;
        } else if (r.name) {
            dedup[r.name] = rhs;
        } else if (r.start !== undefined && r.end !== undefined) {
            dedup[body] = rhs;
        }
    });
    return dedup;
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
