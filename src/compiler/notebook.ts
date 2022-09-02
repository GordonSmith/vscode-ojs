import { Runtime, Library } from "@observablehq/runtime";
import { FileAttachments } from "@observablehq/stdlib";
import { Cell, Writer } from "./cell";
import { observablehq as ohq } from "./types";

export class Notebook {

    protected _runtime: ohq.Runtime;
    protected _main: ohq.Module;
    protected _cells: { [id: string]: Cell } = {};

    constructor(notebook?: ohq.Notebook, plugins: object = {}) {
        const files = {};
        notebook?.files?.forEach(f => files[f.name] = f.url);

        const library = new Library();
        library.FileAttachment = function () {
            return FileAttachments(name => {
                return files[name];
            });
        };

        const domDownload = library.DOM.download;
        library.DOM.download = function (blob, file) {
            return domDownload(blob, files[file]);
        };

        this._runtime = new Runtime({ ...library, ...plugins });
        this._main = this._runtime.module();
    }

    dispose() {
        this._runtime.dispose();
        delete this._runtime;
        delete this._main;
        this._cells = {};
    }

    createCell(id: string | number, inspector?: ohq.InspectorFactory): Cell {
        this.disposeCell(id);
        const newCell = new Cell(this, id, inspector);
        this._cells[id] = newCell;
        return newCell;
    }

    disposeCell(id: string | number) {
        this._cells[id]?.reset();
        delete this._cells[id];
    }

    compile(writer: Writer) {
        for (const key in this._cells) {
            try {
                this._cells[key].compile(writer);
            } catch (e) {
            }
        }
    }

    //  ObservableHQ  ---
    main(): ohq.Module {
        return this._main;
    }

    createModule(define): ohq.Module {
        return this._runtime.module(define);
    }

    createVariable(inspector?: ohq.Inspector, name?: string | null, inputs?: string[], definition?: any): ohq.Variable {
        const retVal = this._main.variable(inspector);
        if (arguments.length > 1) {
            retVal.define(name, inputs, definition);
        }
        return retVal;
    }

    importVariable(name: string, alias: string, otherModule: ohq.Module): ohq.Variable {
        return this._main.import(name, alias, otherModule);
    }
}