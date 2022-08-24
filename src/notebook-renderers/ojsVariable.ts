import { debug } from "console";
import { InspectorFactory, Module, Variable } from "./observableTypes";
import { OJSModule } from "./ojsModule";
import { OJSNotebook } from "./ojsNotebook";
import { parse, parse2 } from "./parser";
import { obfuscatedImport } from "./util";

export class OJSVariable {
    _notebook: OJSNotebook;
    _module: OJSModule;
    _initialValue: Variable;
    _variable: Variable;
    _variableValue: Variable;
    _imported: { variable: Variable, variableValue?: Variable }[];

    constructor(module: OJSModule, inspector: InspectorFactory) {
        this._notebook = module._notebook;
        this._module = module;
        this._variable = module._module.variable(inspector);
    }

    dispose() {
        this._imported?.forEach(v => {
            v.variable.delete();
            v.variableValue?.delete();
        });
        this._variableValue?.delete();
        this._variable.delete();
        this._initialValue?.delete();
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

    async importNotebook(partial) {
        return obfuscatedImport(`https://api.observablehq.com/${partial[0] === "@" ? partial : `d/${partial}`}.js?v=3`);
    }

    async define(ojsSource: string) {
        this._initialValue?.delete();
        this._variableValue?.delete();
        this._imported?.forEach(v => {
            v.variable.delete();
            v.variableValue?.delete();
        });

        const parsed = parse(ojsSource);
        if (parsed.import) {
            const impMod: any = [".", "/"].indexOf(parsed.import.src[0]) === 0 ?
                await this.importFile(parsed.import.src) :
                await this.importNotebook(parsed.import.src);

            let mod = this._notebook._runtime.module(impMod.default);

            if (parsed.import.injections.length) {
                mod = mod.derive(parsed.import.injections, this._module._module);
            }

            this._imported = parsed.import.specifiers.map(spec => {
                const viewof = spec.view ? "viewof " : "";
                const retVal = {
                    variable: this._module._module.import(viewof + spec.name, viewof + spec.alias, mod),
                    variableValue: undefined
                };
                if (spec.view) {
                    retVal.variableValue = this._module._module.import(spec.name, spec.alias, mod);
                }
                return retVal;
            });
            const md = "md`" + "```javascript\n" + ojsSource + "\n```";
            this._variable.define(undefined, ["md"], md => {
                return md`\`\`\`JavaScript
${ojsSource}
\`\`\``;
            });
        } else {
            if (parsed.initialValue) {
                this._initialValue = this._module._module.variable();
                this._initialValue.define(parsed.initialValue.id, parsed.initialValue.refs, parsed.initialValue.func);
            }
            this._variable.define(parsed.id, parsed.refs, parsed.func);
            if (parsed.viewofValue) {
                this._variableValue = this._module._module.variable();
                this._variableValue.define(parsed.viewofValue.id, parsed.viewofValue.refs, parsed.viewofValue.func);
            }
        }
    }
}
