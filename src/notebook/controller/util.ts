import type { Mode } from "@hpcc-js/observablehq-compiler";

export type LanguageId = "markdown" | "ojs" | "omd" | "html" | "svg" | "dot" | "mermaid" | "tex" | "javascript";
export const Languages: LanguageId[] = ["markdown", "ojs", "omd", "html", "svg", "dot", "mermaid", "tex", "javascript"];

function encode(str: string) {
    return str
        .split("`").join("\\`")
        ;
}

export function languageId2Mode(languageId: LanguageId): Mode {
    return languageId === "markdown" ? "md" : "js";
}

export function text2value(languageId: LanguageId, text: string) {
    switch (languageId) {
        case "ojs":
            return text;
        case "omd":
            return `md\`${encode(text)}\``;
        case "html":
            return `htl.html\`${encode(text)}\``;
        case "tex":
            return `tex.block\`${encode(text)}\``;
        case "javascript":
            return `{${text}}`;
        default:
            return `${languageId}\`${text}\``;
    }
}

export function cell2node(languageId: LanguageId, text: string) {
    return {
        mode: languageId2Mode(languageId),
        value: text2value(languageId, text)
    };
}

