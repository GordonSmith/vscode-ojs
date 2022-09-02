import { observablehq as ohq } from "./types";
import { Notebook } from "./notebook";
import { parseCell, ParsedImportCell, ParsedVariable } from "./parser";
import { obfuscatedImport } from "./util";

function escape(str: string) {
    return str
        .split("`").join("\\`")
        ;
}

export class Writer {

    protected _imports: string[] = [];
    protected _functions: string[] = [];
    protected _defines: string[] = [];
    protected _defineUid = 0;
    protected _functionUid = 0;

    constructor() {
    }

    toString() {
        return `\
${this._imports.join("\n")}

${this._functions.join("\n").split("\n) {").join("){")}

export default function define(runtime, observer) {
  const main = runtime.module();

  ${this._defines.join("\n  ")}

  return main;
}\n`;
    }

    import(imp: ParsedImportCell) {
        this._imports.push(`import define${++this._defineUid} from "${imp.src}"; `);
        const injections = imp.injections.map(inj => {
            return inj.name === inj.alias ?
                `"${inj.name}"` :
                `{name: "${inj.name}", alias: "${inj.alias}"}`;
        });
        const derive = imp.injections.length ? `.derive([${injections.join(", ")}], main)` : "";
        this._defines.push(`const child${this._defineUid} = runtime.module(define${this._defineUid})${derive};`);
        imp.specifiers.forEach(s => {
            this._defines.push(`main.import("${s.name}"${s.alias && s.alias !== s.name ? `, "${s.alias}"` : ""}, child${this._defineUid}); `);
        });
        // if (imp.specifiers.filter(s => s.view).length) {
        //     this._defines.push(`main.import(${imp.specifiers.filter(s => s.view).map(s => s.name + (s.alias ? `as ${s.alias}` : "")).join(", ")}, child${this._defineUid}); `);
        // }
        // this._defines.push(`main.import("selection", "cars", child1); `);
    }

    function(variable: ParsedVariable) {
        let id = variable.id ?? `${++this._functionUid}`;
        const idParts = id.split(" ");
        id = `_${idParts[idParts.length - 1]}`;
        this._functions.push(`${variable.func?.toString()?.replace("anonymous", `${id}`)}`);
        return id;
    }

    define(variable: ParsedVariable, observable = true, inlineFunc = false, funcId: string = variable.id) {
        const observe = observable ? `.variable(observer(${variable.id ? JSON.stringify(variable.id) : ""}))` : "";
        const id = variable.id ? `${JSON.stringify(variable.id)}, ` : "";
        const inputs = variable.inputs.length ? `[${variable.inputs.map(i => JSON.stringify(i)).join(", ")}], ` : "";
        const func = inlineFunc ?
            variable.func?.toString() :
            funcId;
        this._defines.push(`main${observe}.define(${id}${inputs}${func});`);
    }
}

export class Cell {

    protected _notebook: Notebook;
    protected _id: string | number;
    protected _observer: ohq.InspectorFactory;
    protected _variables: ohq.Variable[] = [];

    constructor(notebook: Notebook, id: string | number, observer: ohq.InspectorFactory) {
        this._notebook = notebook;
        this._id = id;
        this._observer = observer;
    }

    reset() {
        this._variables?.forEach(v => v.delete());
        this._variables = [];
    }

    dispose() {
        this._notebook.disposeCell(this._id);
    }

    async importFile(partial) {
        //  TODO  ---
        // const path = join(this._folder, partial);
        // let ojs = await this.fetchUrl(path);
        // if (partial.indexOf(".omd") > 1) {
        //     ojs = omd2ojs(ojs).ojsArr.map(row => row.ojs).join("\n");
        // }

        // const context = this;
        // return {
        //     default: function define(runtime, observer) {
        //         const newModule = runtime.module();
        //         const ojsModule = new OJSModule(context._ojsRuntime, partial, newModule, ojs, dirname(path));
        //         ojsModule.parse(true);
        //     }
        // };
    }

    protected async importNotebook(partial) {
        return obfuscatedImport(`https://api.observablehq.com/${partial[0] === "@" ? partial : `d/${partial}`}.js?v=3`);
    }

    protected _cellSource: string = "";
    text(cellSource: string, languageId: string = "ojs") {
        if (languageId === "markdown") {
            languageId = "md";
        }
        this._cellSource = languageId === "ojs" ? cellSource : `${languageId}\`${escape(cellSource)}\``;
        return this;
    }

    async evaluate() {
        this.reset();

        const parsed = parseCell(this._cellSource);
        switch (parsed.type) {
            case "import":
                const impMod: any = [".", "/"].indexOf(parsed.src[0]) === 0 ?
                    await this.importFile(parsed.src) :
                    await this.importNotebook(parsed.src);

                let mod = this._notebook.createModule(impMod.default);
                if (parsed.injections.length) {
                    mod = mod.derive(parsed.injections, this._notebook.main());
                }

                parsed.specifiers.forEach(spec => {
                    const viewof = spec.view ? "viewof " : "";
                    this._variables.push(this._notebook.importVariable(viewof + spec.name, viewof + spec.alias, mod));
                    if (spec.view) {
                        this._variables.push(this._notebook.importVariable(spec.name, spec.alias, mod));
                    }
                });
                this._variables.push(this._notebook.createVariable(this._observer(), undefined, ["md"], md => {
                    return md`\`\`\`JavaScript
${this._cellSource}
\`\`\``;
                }));
                break;
            case "viewof":
                this._variables.push(this._notebook.createVariable(this._observer(parsed.variable.id), parsed.variable.id, parsed.variable.inputs, parsed.variable.func));
                this._variables.push(this._notebook.createVariable(this._observer(parsed.variableValue.id), parsed.variableValue.id, parsed.variableValue.inputs, parsed.variableValue.func));
                break;
            case "mutable":
                this._variables.push(this._notebook.createVariable(undefined, parsed.initial.id, parsed.initial.inputs, parsed.initial.func));
                this._variables.push(this._notebook.createVariable(this._observer(parsed.variable.id), parsed.variable.id, parsed.variable.inputs, parsed.variable.func));
                this._variables.push(this._notebook.createVariable(this._observer(parsed.variableValue.id), parsed.variableValue.id, parsed.variableValue.inputs, parsed.variableValue.func));
                break;
            case "variable":
                this._variables.push(this._notebook.createVariable(this._observer(parsed.id), parsed.id, parsed.inputs, parsed.func));
                break;
        }
    }

    compile(writer: Writer) {
        const parsed = parseCell(this._cellSource);
        let id;
        switch (parsed.type) {
            case "import":
                writer.import(parsed);
                break;
            case "viewof":
                id = writer.function(parsed.variable);
                writer.define(parsed.variable, true, false, id);
                writer.define(parsed.variableValue, true, true);
                break;
            case "mutable":
                id = writer.function(parsed.initial);
                writer.define(parsed.initial, false, false, id);
                writer.define(parsed.variable, true, true);
                writer.define(parsed.variableValue, true, true);
                break;
            case "variable":
                id = writer.function(parsed);
                writer.define(parsed, true, false, id);
                break;
        }
    }
}
