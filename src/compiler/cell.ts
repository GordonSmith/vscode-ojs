import { observablehq as ohq } from "./types";
import { Notebook } from "./notebook";
import { parseCell } from "./parser";
import { obfuscatedImport } from "./util";

export class Cell {

    protected _notebook: Notebook;
    protected _variables: ohq.Variable[] = [];
    protected _observer: ohq.InspectorFactory;

    constructor(notebook: Notebook, observer: ohq.InspectorFactory) {
        this._notebook = notebook;
        this._observer = observer;
    }

    reset() {
        this._variables?.forEach(v => v.delete());
        this._variables = [];
    }

    dispose() {
        this.reset();
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

    async interpret(cellSource: string) {
        this.reset();

        const parsed = parseCell(cellSource);
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
${cellSource}
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
}
