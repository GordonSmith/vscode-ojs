import { Runtime, Library } from "@observablehq/runtime";
import { FileAttachments } from "@observablehq/stdlib";
import { OJSModule } from "./ojsModule";
import { InspectorFactory } from "./observableTypes";
import { OJSVariable } from "./ojsVariable";
import { Notebook } from "../notebook/types";

export class OJSNotebook {

    _runtime: Runtime;
    _mainModule: OJSModule;

    constructor(notebook?: Notebook, plugins: object = {}) {
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
        this._mainModule = this.createModule();
    }

    dispose() {
        this._runtime.dispose();
        delete this._runtime;
    }

    createModule(define?) {
        const retVal = new OJSModule(this, define);
        return retVal;
    }

    createVariable(inspector: InspectorFactory): OJSVariable {
        return this._mainModule.createVariable(inspector);
    }

    removeCell(id: string) {
    }
}