import * as vscode from "vscode";

const DOCTYPE_REGEX = /^\uFEFF?\s*<!doctype\s+html>/i; // allow optional BOM
const NOTEBOOK_TAG_REGEX = /<notebook\b[^>]*>/i;

export function isObservableNotebook(content: string): boolean {
    // Restrict DOCTYPE check to first 64 chars for performance.
    if (!DOCTYPE_REGEX.test(content.slice(0, 64))) {
        return false;
    }
    return NOTEBOOK_TAG_REGEX.test(content); // full scan for <notebook> tag (rare & short)
}

export function isObservableNotebookDocument(doc?: vscode.TextDocument): boolean {
    if (doc?.languageId === "html" && doc?.uri.scheme === "file") {
        const firstTwo: string[] = [];
        for (let line = 0; line < Math.min(2, doc.lineCount); ++line) {
            firstTwo.push(doc.lineAt(line).text);
        }
        return isObservableNotebook(firstTwo.join("\n"));
    }
    return false;
}

export async function isObservableNotebookUri(uri: vscode.Uri): Promise<boolean> {
    if (uri.scheme !== "file" || !uri.fsPath.toLowerCase().endsWith(".html")) {
        return false;
    }
    const doc = vscode.workspace.textDocuments.find(d => d.uri.toString() === uri.toString() && d.languageId === "html");
    if (doc) {
        return isObservableNotebookDocument(doc);
    }
    const bytes = await vscode.workspace.fs.readFile(uri);
    const slice = bytes.byteLength > 64 ? bytes.slice(0, 64) : bytes;
    const content = new TextDecoder("utf-8").decode(slice);
    return isObservableNotebook(content);
}

export class HTMLNotebookDetector implements vscode.FileDecorationProvider, vscode.Disposable {
    private readonly emitter = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
    readonly onDidChangeFileDecorations: vscode.Event<vscode.Uri | vscode.Uri[] | undefined> = this.emitter.event;
    private disposables: vscode.Disposable[] = [];

    constructor() {
        this.disposables.push(
            vscode.workspace.onDidSaveTextDocument(doc => {
                this.invalidateAndFire(doc.uri);
                this.updateContextFromActiveEditor();
            }),
            vscode.workspace.onDidChangeTextDocument(e => {
                this.invalidateAndFire(e.document.uri);
                if (vscode.window.activeTextEditor?.document === e.document) { this.updateContextFromActiveEditor(); }
            }),
            vscode.workspace.onDidCreateFiles(e => {
                e.files.forEach(f => this.emitter.fire(e.files.map(f => f)));
            }),
            vscode.workspace.onDidDeleteFiles(e => {
                e.files.forEach(f => this.emitter.fire(e.files.map(f => f)));
            }),
            vscode.workspace.onDidRenameFiles(e => {
                this.emitter.fire(e.files.map(f => f.newUri));
            }),
            vscode.workspace.onDidOpenTextDocument(doc => {
                if (doc.languageId === "html") {
                    this.updateContextFromDocument(doc);
                }
            }),
            vscode.window.onDidChangeActiveTextEditor(editor => {
                if (editor) {
                    this.updateContextFromDocument(editor.document);

                } else {
                    void this.setContext(false);

                }
            }),
            vscode.workspace.onDidOpenNotebookDocument(nb => {
                if (nb.notebookType === "notebook-kit") {
                    void this.setContext(true);
                }
            }),
            vscode.window.onDidChangeActiveNotebookEditor(nbEditor => {
                if (nbEditor && nbEditor.notebook.notebookType === "notebook-kit") {
                    void this.setContext(false);
                }
            })
        );
        this.updateContextFromActiveEditor();
    }

    async setContext(isObservableNotebook: boolean): Promise<void> {
        try {
            await vscode.commands.executeCommand("setContext", "observable-kit.isObservableNotebook", isObservableNotebook);
        } catch (error) {
            console.error("Failed to set context:", error);
        }
    }

    private updateContextFromActiveEditor(): void {
        void this.updateContextFromDocument(vscode.window.activeTextEditor?.document);
    }

    private updateContextFromDocument(doc?: vscode.TextDocument): void {
        void this.setContext(isObservableNotebookDocument(doc));
    }

    async provideFileDecoration(uri: vscode.Uri): Promise<vscode.FileDecoration | undefined> {
        if (await isObservableNotebookUri(uri)) {
            return {
                badge: "O",
                tooltip: "ObservableHQ Notebook"
            };
        }
        return undefined;
    }

    private invalidateAndFire(uri: vscode.Uri): void {
        this.maybeFire(uri);
    }

    private maybeFire(uri: vscode.Uri): void {
        if (uri.fsPath.toLowerCase().endsWith(".html")) {
            this.emitter.fire(uri);
        }
    }

    dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.emitter.dispose();
    }
}