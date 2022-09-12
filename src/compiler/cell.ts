import type { ohq } from "@hpcc-js/observablehq-compiler";
import { Notebook } from "./notebook";
import { parseCell } from "./parser";
import { obfuscatedImport } from "./util";
import { Writer } from "./writer";

function encode(str: string) {
    return str
        // .split("\\").join("\\\\")
        .split("`").join("\\`")
        // .split("$").join("\\$")
        ;
}

export class NullObserver implements ohq.Inspector {
    pending() {
    }
    fulfilled(value: any) {
    }
    rejected(error: any) {
    }
}
export const nullObserver = new NullObserver();

export const nullObserverFactory: ohq.InspectorFactory = (name?: string) => nullObserver;

export class Cell {

    protected _notebook: Notebook;
    protected _id: string | number;
    protected _observer: ohq.InspectorFactory;
    protected _variables = new Set<ohq.Variable>();

    constructor(notebook: Notebook, observer: ohq.InspectorFactory = nullObserverFactory) {
        this._notebook = notebook;
        this._observer = observer;
    }

    reset() {
        this._variables?.forEach(v => v.delete());
        this._variables.clear();
    }

    dispose() {
        this._notebook.disposeCell(this);
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
    text(): string;
    text(cellSource: string, languageId?: string): this;
    text(cellSource?: string, languageId: string = "ojs"): string | this {
        if (arguments.length === 0) return this._cellSource;
        if (languageId === "markdown") {
            languageId = "md";
        }
        this._cellSource = languageId === "ojs" ? cellSource! : `${languageId}\`${encode(cellSource!)}\``;
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
                    this._variables.add(this._notebook.importVariable(viewof + spec.name, viewof + spec.alias, mod));
                    if (spec.view) {
                        this._variables.add(this._notebook.importVariable(spec.name, spec.alias, mod));
                    }
                });
                this._variables.add(this._notebook.createVariable(this._observer(), undefined, ["md"], md => {
                    return md`\`\`\`JavaScript
${this._cellSource}
\`\`\``;
                }));
                break;
            case "viewof":
                this._variables.add(this._notebook.createVariable(this._observer(parsed.variable.id), parsed.variable.id, parsed.variable.inputs, parsed.variable.func));
                this._variables.add(this._notebook.createVariable(undefined, parsed.variableValue.id, parsed.variableValue.inputs, parsed.variableValue.func));
                break;
            case "mutable":
                this._variables.add(this._notebook.createVariable(undefined, parsed.initial.id, parsed.initial.inputs, parsed.initial.func));
                this._variables.add(this._notebook.createVariable(undefined, parsed.variable.id, parsed.variable.inputs, parsed.variable.func));
                this._variables.add(this._notebook.createVariable(this._observer(parsed.variableValue.id), parsed.variableValue.id, parsed.variableValue.inputs, parsed.variableValue.func));
                break;
            case "variable":
                this._variables.add(this._notebook.createVariable(this._observer(parsed.id), parsed.id, parsed.inputs, parsed.func));
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
                writer.define(parsed.variableValue, false, true);
                break;
            case "mutable":
                id = writer.function(parsed.initial);
                writer.define(parsed.initial, false, false, id);
                writer.define(parsed.variable, false, true);
                writer.define(parsed.variableValue, true, true);
                break;
            case "variable":
                id = writer.function(parsed);
                writer.define(parsed, true, false, id);
                break;
        }
    }
}
