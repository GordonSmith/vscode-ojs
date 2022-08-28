import { parseCell } from "@observablehq/parser";
import { calcRefs, createFunction, obfuscatedImport } from "./util";

type Parse2Response = { id: string, refs: string[], func: any };

export function parse2(str: string): Parse2Response {
    const cell = parseCell(str);
    const refs = calcRefs(cell.references, str);
    const retVal: Parse2Response = {
        id: cell.id ? str.substring(cell.id.start, cell.id.end) : null,
        refs: Object.keys(refs),
        func: undefined
    };
    const body = cell.body ? str.substring(cell.body.start, cell.body.end) : "";
    if (cell.id && cell.id.type === "MutableExpression") {
        retVal.id = str.substring(cell.id.id.start, cell.id.id.end);
        retVal.func = createFunction(refs, body, cell.async, cell.generator, cell.body && cell.body.type === "BlockStatement");
    } else {
        retVal.func = createFunction(refs, body, cell.async, cell.generator, cell.body && cell.body.type === "BlockStatement");
    }
    if (cell.id && cell.id.type === "ViewExpression") {
        retVal.refs = ["Generators", retVal.id];
        retVal.id = str.substring(cell.id.id.start, cell.id.id.end);
        retVal.func = (G, _) => G.input(_);
    }
    return retVal;
}

type IdIdentifier = { type: "Identifier", name: string };
type IdViewExpression = { type: "ViewExpression", id: IdIdentifier };
type IdMutableExpression = { type: "MutableExpression", id: IdIdentifier };
type Id = null | IdIdentifier | IdViewExpression | IdMutableExpression;

type BodyType = "BinaryExpression" | "BlockStatement" | "Literal" | "YieldExpression" | "CallExpression" | "MemberExpression" | "Identifier" | "ViewExpression" | "MutableExpression" | "ImportDeclaration";
interface BodyAny {
    type: BodyType;
    [key: string]: any;
}

type Body = null | BodyAny;

interface ParsedVariable {
    id: null | string,
    refs: string[],
    func: any,
}

interface ParseResponse extends ParsedVariable {
    initialValue?: ParsedVariable
    viewofValue?: ParsedVariable;
    import?: {
        src: string;
        injections: { name: string, alias?: string }[];
        specifiers: { view: boolean, name: string, alias?: string }[];
    }
    debug: any
}

export function parse(str: string): ParseResponse {
    const cell = parseCell(str);
    const refs = calcRefs(cell.references, str);

    const retVal: ParseResponse = {
        id: null,
        refs: Object.keys(refs),
        func: undefined,
        debug: cell
    };

    const cellId = cell.id as Id;
    const bodyStr = cell.body ? str.substring(cell.body.start, cell.body.end) : "";
    switch (cellId?.type) {
        case "ViewExpression":
            retVal.id = str.substring(cell.id.start, cell.id.end);
            retVal.viewofValue = {
                id: cell?.id?.id?.name,
                refs: ["Generators", retVal.id],
                func: (G, _) => G.input(_)
            };
            break;
        case "MutableExpression":
            retVal.id = str.substring(cell.id.start, cell.id.end);
            retVal.initialValue = {
                id: `initial ${cell?.id?.id?.name}`,
                refs: Object.keys(refs),
                func: createFunction(refs, bodyStr, false, false, false)
            };
            retVal.refs = ["Mutable", retVal.initialValue.id];
            retVal.func = (M, _) => { return new M(_); };
            retVal.viewofValue = {
                id: cell?.id?.id?.name,
                refs: [retVal.id],
                func: _ => _.generator
            };
            break;
        case undefined:
            break;
        case "Identifier":
            retVal.id = str.substring(cell.id.start, cell.id.end);
            break;
        default:
            console.warn(`Unexpected cell.id.type:  ${cell.id?.type}`);
            retVal.id = str.substring(cell.id.start, cell.id.end);
    }

    switch ((cell.body as Body)?.type) {
        case "ImportDeclaration":
            retVal.import = {
                src: cell.body.source.value,
                specifiers: cell.body.specifiers?.map(spec => {
                    return {
                        view: spec.view,
                        name: spec.imported.name,
                        alias: (spec.local?.name && spec.imported.name !== spec.local.name) ? spec.local.name : spec.imported.name
                    };
                }) ?? [],
                injections: cell.body.injections?.map(inj => {
                    return {
                        name: inj.imported.name,
                        alias: inj.local?.name ?? inj.imported.name
                    };
                }) ?? [],
            };
            break;
        case undefined:
            break;
        case "ViewExpression":
        case "Identifier":
        case "BinaryExpression":
        case "BlockStatement":
        case "CallExpression":
        case "Literal":
        case "MemberExpression":
        case "YieldExpression":
            retVal.func = retVal.func ?? createFunction(refs, bodyStr, cell.async, cell.generator, ["BlockStatement"].indexOf(cell.body.type) >= 0);
            break;
        default:
            console.warn(`Unexpected cell.body.type:  ${cell.body?.type}`);
            retVal.func = retVal.func ?? createFunction(refs, bodyStr, cell.async, cell.generator, ["BlockStatement"].indexOf(cell.body.type) >= 0);
    }

    return retVal;
}