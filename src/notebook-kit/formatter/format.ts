import type { BuiltInParserName, Options, Plugin } from "prettier";
import { format } from "prettier/standalone";
import babelPlugin from "prettier/plugins/babel";
import estreePlugin from "prettier/plugins/estree";
import htmlPlugin from "prettier/plugins/html";
import markdownPlugin from "prettier/plugins/markdown";
import typescriptPlugin from "prettier/plugins/typescript";

const PLUGINS: Plugin[] = [
    babelPlugin,
    estreePlugin,
    htmlPlugin,
    markdownPlugin,
    typescriptPlugin
];

const PARSERS: Readonly<Record<string, BuiltInParserName>> = {
    html: "html",
    javascript: "babel",
    markdown: "markdown",
    typescript: "typescript"
};

export const NOTEBOOK_KIT_FORMAT_LANGUAGES: readonly string[] = Object.keys(PARSERS);

/** Formats a supported Observable Notebook Kit cell. */
export async function formatNotebookCell(source: string, languageId: string, options: Options = {}): Promise<string | undefined> {
    const parser = PARSERS[languageId];
    if (!parser) {
        return undefined;
    }
    return format(source, { ...options, parser, plugins: PLUGINS });
}

/** Formats a raw Observable Notebook Kit HTML document. */
export async function formatNotebookHtml(source: string, options: Options = {}): Promise<string> {
    const formatted = await formatNotebookCell(source, "html", {
        ...options,
        embeddedLanguageFormatting: "off",
        htmlWhitespaceSensitivity: "ignore"
    }) ?? source;
    const hasFinalNewline = /(?:\r\n|\n)$/.test(source);
    return hasFinalNewline ? formatted : formatted.replace(/(?:\r\n|\n)$/, "");
}