import { type Notebook, transpile } from "@observablehq/notebook-kit";
import { type Definition } from "@observablehq/notebook-kit/runtime";
import { constructFunction } from "./util";

export function compile(notebook: Notebook) {
    const retVal: Definition[] = [];
    for (const cell of notebook.cells) {
        const compiled = transpile(cell);
        retVal.push({
            id: cell.id,
            ...compiled,
            body: constructFunction(compiled.body)
        });
    }
    return retVal;
}
