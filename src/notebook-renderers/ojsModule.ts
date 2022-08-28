import { InspectorFactory, Module } from "./observableTypes";
import { OJSNotebook } from "./ojsNotebook";
import { OJSVariable } from "./ojsVariable";

export class OJSModule {

    _notebook: OJSNotebook;
    _module: Module;

    constructor(notebook: OJSNotebook, define?) {
        this._notebook = notebook;
        this._module = notebook._runtime.module(define);
    }

    createVariable(inspector: InspectorFactory) {
        return new OJSVariable(this, inspector);
    }
}
