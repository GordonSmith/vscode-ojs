import * as vscode from "vscode";

export interface NotebookCellSummary {
    index: number;               // 0-based cell index in notebook
    language: string;            // VS Code language identifier
    kind: vscode.NotebookCellKind; // Code / Markdown
    text: string;                // Raw source text
    executionSummary?: vscode.NotebookCellExecutionSummary; // If available
    name?: string;               // Derived variable / cell name if detectable
    dependsOn: string[];         // Variable names this cell references
    exports: string[];           // Variable names this cell declares / exports
}

export interface NotebookContextSummary {
    notebookUri: vscode.Uri;
    type: string | undefined; // notebookType metadata
    cells: NotebookCellSummary[];
    /** Quick lookup from exported symbol -> cell index */
    symbolIndex: Record<string, number>;
}

/** Very small regex heuristics for JS style variable exports inside cells. */
const DECL_RE = /^(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm;
const REF_RE = /([A-Za-z_$][\w$]*)/g;

function isNotebookDocument(doc: vscode.NotebookDocument | undefined): doc is vscode.NotebookDocument {
    return !!doc; // Simple runtime guard
}

/** Extract a probable exported variable list from a cell's text (heuristic). */
function extractExports(text: string, language: string): string[] {
    if (language !== "javascript" && language !== "ojs") {
        return [];
    }
    const out: string[] = [];
    for (const match of text.matchAll(DECL_RE)) {
        const v = match[1];
        if (v && !out.includes(v)) {
            out.push(v);
        }
    }
    return out.slice(0, 10); // Cap to avoid huge contexts
}

/** Extract referenced identifiers (very naive) */
function extractRefs(text: string, exports: string[], language: string): string[] {
    if (language !== "javascript" && language !== "ojs") {
        return [];
    }
    const refs: Set<string> = new Set();
    for (const match of text.matchAll(REF_RE)) {
        const id = match[1];
        if (!exports.includes(id) && !isLikelyKeyword(id)) {
            refs.add(id);
        }
        if (refs.size > 40) {
            break;
        }
    }
    return [...refs];
}

// Minimal keyword filter (JS + OJS common globals could be extended) */
const KEYWORDS = new Set([
    "const", "let", "var", "import", "from", "export", "return", "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "function", "class", "new", "await", "async", "yield", "try", "catch", "finally", "throw", "null", "true", "false", "undefined", "this"
]);

function isLikelyKeyword(id: string): boolean {
    return KEYWORDS.has(id);
}

/**
 * Build a summary for the active OJS / Observable notebook, if any.
 */
export function buildActiveNotebookContext(): NotebookContextSummary | undefined {
    const editor = vscode.window.activeNotebookEditor;
    if (!editor || !isNotebookDocument(editor.notebook)) {
        return undefined;
    }
    const nb = editor.notebook;
    const cells: NotebookCellSummary[] = [];
    const symbolIndex: Record<string, number> = {};
    nb.getCells().forEach((cell, idx) => {
        const language = cell.document.languageId;
        const text = cell.document.getText();
        const exports = extractExports(text, language);
        const dependsOn = extractRefs(text, exports, language);
        exports.forEach(sym => { symbolIndex[sym] = idx; });
        cells.push({
            index: idx,
            language,
            kind: cell.kind,
            text,
            executionSummary: cell.executionSummary,
            name: exports[0],
            dependsOn,
            exports
        });
    });
    return {
        notebookUri: nb.uri,
        type: (nb as any).notebookType, // VS Code internal property
        cells,
        symbolIndex
    };
}

/**
 * Format a concise textual context block suitable for Large Language Models.
 * The format intentionally keeps per-cell size limited.
 */
export function formatNotebookContext(summary: NotebookContextSummary): string {
    const header = `Notebook: ${summary.notebookUri.fsPath} (type: ${summary.type ?? "unknown"})`;
    const body = summary.cells.map(c => formatCell(c)).join("\n\n");
    return `${header}\nCells:\n${body}`;
}

function formatCell(cell: NotebookCellSummary): string {
    const lines = cell.text.split(/\r?\n/).slice(0, 20); // limit lines per cell
    const src = lines.join("\n");
    return [
        `#${cell.index} (${vscode.NotebookCellKind[cell.kind]}) lang=${cell.language}`,
        cell.name ? `name: ${cell.name}` : undefined,
        cell.exports.length ? `exports: ${cell.exports.join(", ")}` : undefined,
        cell.dependsOn.length ? `dependsOn: ${cell.dependsOn.slice(0, 15).join(", ")}` : undefined,
        "---",
        src
    ].filter(Boolean).join("\n");
}

/** Command ID used to fetch context on demand */
export const CMD_GET_COPILOT_CONTEXT = "ojs.copilot.context";

/**
 * Register command returning formatted context; can be invoked by chat participant or user.
 */
export function registerCopilotContextCommands(ctx: vscode.ExtensionContext): void {
    ctx.subscriptions.push(
        vscode.commands.registerCommand(CMD_GET_COPILOT_CONTEXT, () => {
            const summary = buildActiveNotebookContext();
            if (!summary) {
                return "No active OJS/Observable notebook.";
            }
            return formatNotebookContext(summary);
        })
    );
}

/**
 * Provide inline extra context for Copilot Chat via the experimental Chat API if available.
 * We guard dynamically to avoid crashing on older VS Code versions.
 */
export function registerChatParticipant(ctx: vscode.ExtensionContext): void {
    const anyVS: any = vscode as any;
    const chat = anyVS.chat || anyVS.chatParticipants || anyVS.aiChat; // future-proofing
    if (!chat) {
        return; // Chat API not available in this VS Code version
    }
    // Use stable `chat.requestChatParticipant` contribution id pattern if needed.
    const participant = chat.createChatParticipant?.("ojsCopilot", {
        iconPath: new vscode.ThemeIcon("notebook"),
        label: "OJS Context"
    }, async (request: any, context: any, progress: any, token: vscode.CancellationToken) => {
        void context; void progress; void token; void request; // Unused for now
        const summary = buildActiveNotebookContext();
        if (!summary) {
            return { role: "assistant", content: [{ type: "markdown", value: "No active OJS/Observable notebook." }] };
        }
        return {
            role: "assistant",
            content: [{ type: "markdown", value: "```ojs\n" + formatNotebookContext(summary) + "\n```" }]
        };
    });
    if (participant) {
        ctx.subscriptions.push(participant);
    }
}

/**
 * Basic completion provider with domain keywords to help guide Copilot's in-file suggestions.
 */
export function registerDomainCompletions(ctx: vscode.ExtensionContext): void {
    const DOMAIN_KEYWORDS = [
        "viewof", // Observable syntax
        "Inputs.text", "Inputs.checkbox", "Plot.plot", "FileAttachment", "Mutable", "Generators", "display" // common runtime helpers
    ];
    ctx.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(["ojs", "javascript"], {
            provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                const linePrefix = document.lineAt(position.line).text.slice(0, position.character);
                if (/^[A-Za-z_$]*$/.test(linePrefix.split(/\W/).pop() || "")) {
                    return DOMAIN_KEYWORDS.map(k => new vscode.CompletionItem(k, vscode.CompletionItemKind.Keyword));
                }
                return undefined;
            }
        }, ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
        )
    );
}
