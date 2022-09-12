import type { ohq } from "@hpcc-js/observablehq-compiler";
import { Inspector } from "@observablehq/inspector";
import { Notebook } from "./notebook";
import { nullObserver, NullObserver } from "./cell";

class HookedObserver extends NullObserver {

    private _inspector: Inspector;
    private _callback: ohq.Inspector;

    constructor(private _element: HTMLElement, callback: ohq.Inspector) {
        super();
        this._inspector = new Inspector(this._element);
        this._callback = callback;
    }

    pending() {
        this._callback.pending();
        this._inspector.pending();
    }

    fulfilled(value: any) {
        this._callback.fulfilled(value);
        this._inspector.fulfilled(value);
    }

    rejected(error: any) {
        this._callback.rejected(error);
        this._inspector.rejected(error);
    }
}

export function renderOJS(ojs: string, element: HTMLElement, callback: ohq.Inspector = nullObserver) {
    const notebook = new Notebook(undefined, name => {
        const div = document.createElement("div");
        element.appendChild(div);
        return new HookedObserver(div, callback);
    });
    notebook.parseOJS(ojs);
    return notebook;
}

export function renderOMD(omd: string, element: HTMLElement, callback: ohq.Inspector = nullObserver) {
    const notebook = new Notebook(undefined, name => {
        const div = document.createElement("div");
        element.appendChild(div);
        return new HookedObserver(div, callback);
    });
    notebook.parseOMD(omd);
    return notebook;
}