
import { type Notebook, transpile } from "@observablehq/notebook-kit";
import { type Definition } from "@observablehq/notebook-kit/runtime";
import { constructFunction } from "./util";

export interface CompileKitOptions {
    inline?: boolean;
}

export function compileKit(notebook: Notebook, options: CompileKitOptions = { inline: true }): Definition[] {
    const retVal: Definition[] = [];
    let id = 1;
    for (const cell of notebook.cells) {
        try {
            const compiled = transpile(cell);
            retVal.push({
                id: id,
                ...compiled,
                body: options.inline ? constructFunction(compiled.body, `cell_${id}`) : compiled.body
            });
        } catch (error) {
            console.error(`Error compiling cell ${id}:`, error);
        }
        id++;
    }
    return retVal;
}
