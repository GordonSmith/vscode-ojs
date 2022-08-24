import { parseCell as ohqParseCell } from "@observablehq/parser";
import { calcRefs, createFunction } from "./util";

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

interface ParsedCell {
    type: "ParsedImport"
}

interface ParsedImportCell extends ParsedCell {
    type: "ParsedImport"
    src: string;
    injections: { name: string, alias: string }[];
    specifiers: { view: boolean, name: string, alias?: string }[];
}

interface ParsedVariable {
    id: null | string,
    inputs: string[],
    func: any,
}

interface ParseResponse extends ParsedVariable {
    initialValue?: ParsedVariable
    viewofValue?: ParsedVariable;
    import?: ParsedImportCell;
    debug: any
}

function parseImportDeclaration(cellAst): ParsedImportCell {
    return {
        type: "ParsedImport",
        src: cellAst.body.source.value,
        specifiers: cellAst.body.specifiers?.map(spec => {
            return {
                view: spec.view,
                name: spec.imported.name,
                alias: (spec.local?.name && spec.imported.name !== spec.local.name) ? spec.local.name : spec.imported.name
            };
        }) ?? [],
        injections: cellAst.body.injections?.map(inj => {
            return {
                name: inj.imported.name,
                alias: inj.local?.name ?? inj.imported.name
            };
        }) ?? [],
    };
}

// function parseBody(cellStr: string, cellAst) {
//     switch ((cellAst.body as Body)?.type) {
//         case "ImportDeclaration":
//             return parseImportDeclaration(cellStr);
//         case undefined:
//             break;
//         case "ViewExpression":
//         case "Identifier":
//         case "BinaryExpression":
//         case "BlockStatement":
//         case "CallExpression":
//         case "Literal":
//         case "MemberExpression":
//         case "YieldExpression":
//             retVal.func = retVal.func ?? createFunction(refs, bodyStr, cellAst.async, cellAst.generator, ["BlockStatement"].indexOf(cellAst.body.type) >= 0);
//             break;
//         default:
//             console.warn(`Unexpected cell.body.type:  ${cellAst.body?.type}`);
//             retVal.func = retVal.func ?? createFunction(refs, bodyStr, cellAst.async, cellAst.generator, ["BlockStatement"].indexOf(cellAst.body.type) >= 0);
//     }

// }

export function parseCell(cellStr: string): ParseResponse {
    const cellAst = ohqParseCell(cellStr);
    const refs = calcRefs(cellAst, cellStr);

    const retVal: ParseResponse = {
        id: null,
        inputs: refs.inputs,
        func: undefined,
        debug: cellAst
    };

    const cellId = cellAst.id as Id;
    const bodyStr = cellAst.body ? cellStr.substring(cellAst.body.start, cellAst.body.end) : "";
    switch (cellId?.type) {
        case "ViewExpression":
            retVal.id = cellStr.substring(cellAst.id.start, cellAst.id.end);
            retVal.viewofValue = {
                id: cellAst?.id?.id?.name,
                inputs: ["Generators", retVal.id],
                func: (G, _) => G.input(_)
            };
            break;
        case "MutableExpression":
            retVal.initialValue = {
                id: `initial ${cellAst?.id?.id?.name}`,
                inputs: refs.inputs,
                func: createFunction(refs, bodyStr, cellAst.async, cellAst.generator, ["BlockStatement"].indexOf(cellAst.body.type) >= 0)
            };
            retVal.id = cellStr.substring(cellAst.id.start, cellAst.id.end);
            retVal.inputs = ["Mutable", retVal.initialValue.id];
            retVal.func = (M, _) => new M(_);
            retVal.viewofValue = {
                id: cellAst?.id?.id?.name,
                inputs: [retVal.id],
                func: _ => _.generator
            };
            break;
        case undefined:
            break;
        case "Identifier":
            retVal.id = cellStr.substring(cellAst.id.start, cellAst.id.end);
            break;
        default:
            console.warn(`Unexpected cell.id.type:  ${cellAst.id?.type}`);
            retVal.id = cellStr.substring(cellAst.id.start, cellAst.id.end);
    }

    switch ((cellAst.body as Body)?.type) {
        case "ImportDeclaration":
            retVal.import = {
                type: "ParsedImport",
                src: cellAst.body.source.value,
                specifiers: cellAst.body.specifiers?.map(spec => {
                    return {
                        view: spec.view,
                        name: spec.imported.name,
                        alias: (spec.local?.name && spec.imported.name !== spec.local.name) ? spec.local.name : spec.imported.name
                    };
                }) ?? [],
                injections: cellAst.body.injections?.map(inj => {
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
            retVal.func = retVal.func ?? createFunction(refs, bodyStr, cellAst.async, cellAst.generator, ["BlockStatement"].indexOf(cellAst.body.type) >= 0);
            break;
        default:
            // console.warn(`Unexpected cell.body.type:  ${cellAst.body?.type}`);
            retVal.func = retVal.func ?? createFunction(refs, bodyStr, cellAst.async, cellAst.generator, ["BlockStatement"].indexOf(cellAst.body.type) >= 0);
    }

    return retVal;
}
