import { Inspector } from "@observablehq/inspector";
import { observablehq as ohq } from "./types";
import { Notebook } from "./notebook";
import { parseCell } from "./parser";
import { obfuscatedImport } from "./util";

export class Cell {

    protected _notebook: Notebook;
    protected _variable: ohq.Variable;                                                  //  Regular variable
    protected _initialValue: ohq.Variable;                                              //  Cell is "mutable"
    protected _variableValue: ohq.Variable;                                             //  Cell is a "viewof" or "mutable"
    protected _imported: { variable: ohq.Variable, variableValue?: ohq.Variable }[];    //  Cell is an import
    protected _observer: ohq.InspectorFactory;

    constructor(notebook: Notebook, observer: ohq.InspectorFactory) {
        this._notebook = notebook;
        this._observer = observer;
    }

    reset() {
        this._imported?.forEach(v => {
            v.variable.delete();
            v.variableValue?.delete();
        });
        this._initialValue?.delete();
        this._variable?.delete();
        this._variableValue?.delete();
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
        if (parsed.import) {
            const impMod: any = [".", "/"].indexOf(parsed.import.src[0]) === 0 ?
                await this.importFile(parsed.import.src) :
                await this.importNotebook(parsed.import.src);

            let mod = this._notebook.createModule(impMod.default);
            if (parsed.import.injections.length) {
                mod = mod.derive(parsed.import.injections, this._notebook.main());
            }

            this._imported = parsed.import.specifiers.map(spec => {
                const viewof = spec.view ? "viewof " : "";
                const retVal = {
                    variable: this._notebook.importVariable(viewof + spec.name, viewof + spec.alias, mod),
                    variableValue: undefined
                };
                if (spec.view) {
                    retVal.variableValue = this._notebook.importVariable(spec.name, spec.alias, mod);
                }
                return retVal;
            });
            this._variable = this._notebook.createVariable(this._observer());
            this._variable.define(undefined, ["md"], md => {
                return md`\`\`\`JavaScript
${cellSource}
\`\`\``;
            });
        } else {
            if (parsed.initialValue) {
                this._initialValue = this._notebook.createVariable();
                this._initialValue.define(parsed.initialValue.id, parsed.initialValue.inputs, parsed.initialValue.func);
            }
            this._variable = this._notebook.createVariable(this._observer(parsed.id));
            this._variable.define(parsed.id, parsed.inputs, parsed.func);
            if (parsed.viewofValue) {
                this._variableValue = this._notebook.createVariable(parsed.initialValue && this._observer(parsed.viewofValue.id));
                this._variableValue.define(parsed.viewofValue.id, parsed.viewofValue.inputs, parsed.viewofValue.func);
            }
        }
    }
}
