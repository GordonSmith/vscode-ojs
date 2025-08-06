import type { ohq } from "@hpcc-js/observablehq-compiler";

export interface WUOutput {
    configuration: string;
    wuid: string;
    results: { [id: string]: object };
}

export interface OJSCell {
    nodeId: string | number;
    ojsSource: string;
}

export interface OJSOutput {
    notebookId: string;
    folder: string;
    files: ohq.File[], // notebook: onb.Notebook;
    cell: OJSCell;
    otherCells: OJSCell[];
}
