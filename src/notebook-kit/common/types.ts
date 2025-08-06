import { Cell, JavaScriptCell, TranspiledJavaScript } from "@observablehq/notebook-kit";

export const OBSERVABLE_KIT_MIME = "application/observable-kit+json";

export const vscode2observable: Record<string, Cell["mode"]> = {
    "markdown": "md",
    "javascript": "js",
    "ojs": "ojs",
    "html": "html",
    "css": "html", // CSS is treated as HTML in Observable Kit
    "tex": "tex",
    "sql": "sql",
    "dot": "dot"
};

export const observable2vscode: Record<Cell["mode"], string> = {
    "md": "markdown",
    "js": "javascript",
    "ojs": "ojs",
    "html": "html",
    "tex": "tex",
    "sql": "sql",
    "dot": "dot"
};

export interface NotebookCell {
    metadata: Cell;
    parsed: JavaScriptCell | undefined;
    transpiled: TranspiledJavaScript;
}