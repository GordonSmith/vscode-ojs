import * as vscode from "vscode";
import { TextDecoder, TextEncoder } from "util";
import { deserialize, serialize, type Notebook, type Cell } from "@observablehq/notebook-kit";
import { DOMParser } from "./dom-polyfill";

// Mapping between VS Code language IDs and Observable Kit modes
const VSCODE_TO_OBSERVABLE_MODE_MAP: Record<string, Cell["mode"]> = {
    'markdown': 'md',
    'javascript': 'js',
    'ojs': 'ojs',
    'html': 'html',
    'css': 'html', // CSS is treated as HTML in Observable Kit
    'tex': 'tex',
    'sql': 'sql',
    'dot': 'dot'
};

const OBSERVABLE_TO_VSCODE_MODE_MAP: Record<Cell["mode"], string> = {
    'md': 'markdown',
    'js': 'javascript',
    'ojs': 'ojs',
    'html': 'html',
    'tex': 'tex',
    'sql': 'sql',
    'dot': 'dot'
};

export const OBSERVABLE_KIT_MIME = "application/observable-kit+json";

let serializer: NotebookKitSerializer;

export class NotebookKitSerializer implements vscode.NotebookSerializer {

    private readonly _textDecoder = new TextDecoder();
    private readonly _textEncoder = new TextEncoder();

    protected constructor() { }

    static attach(): NotebookKitSerializer {
        if (!serializer) {
            serializer = new NotebookKitSerializer();
        }
        return serializer;
    }

    async deserializeNotebook(
        content: Uint8Array,
        token: vscode.CancellationToken
    ): Promise<vscode.NotebookData> {
        const contentStr = this._textDecoder.decode(content);

        // Detect format - Observable Kit HTML or legacy VSCode XML
        if (this.isObservableKitFormat(contentStr)) {
            return this.deserializeObservableKitFormat(contentStr);
        } else {
            return this.deserializeVSCodeFormat(contentStr);
        }
    }

    async serializeNotebook(
        data: vscode.NotebookData,
        token: vscode.CancellationToken
    ): Promise<Uint8Array> {
        // Default to Observable Kit format for new notebooks
        const htmlContent = this.serializeToObservableKitFormat(data);
        return this._textEncoder.encode(htmlContent);
    }

    private isObservableKitFormat(content: string): boolean {
        return content.includes('<notebook') && content.includes('<!doctype html>');
    }

    private deserializeObservableKitFormat(content: string): vscode.NotebookData {
        // Use the official Observable Kit deserialize function with xmldom parser
        const parser = new DOMParser();

        const notebook: Notebook = deserialize(content, { parser: parser as any });
        const cells: vscode.NotebookCellData[] = [];

        for (const cell of notebook.cells) {
            const cellKind = cell.mode === 'md'
                ? vscode.NotebookCellKind.Markup
                : vscode.NotebookCellKind.Code;

            const language = OBSERVABLE_TO_VSCODE_MODE_MAP[cell.mode] || 'javascript';

            const cellData = new vscode.NotebookCellData(
                cellKind,
                cell.value,
                language
            );

            cellData.metadata = {
                id: cell.id.toString(),
                pinned: cell.pinned,
                originalMode: cell.mode
            };

            cells.push(cellData);
        }

        const notebookData = new vscode.NotebookData(cells);
        notebookData.metadata = {
            title: notebook.title,
            theme: notebook.theme,
            readOnly: notebook.readOnly
        };

        return notebookData;
    }

    private deserializeVSCodeFormat(content: string): vscode.NotebookData {
        // Parse legacy VSCode XML format
        const cells: vscode.NotebookCellData[] = [];
        const cellRegex = /<VSCode\.Cell(?:\s+id="([^"]*)")?(?:\s+language="([^"]*)")?>([^]*?)<\/VSCode\.Cell>/g;

        let match;
        while ((match = cellRegex.exec(content)) !== null) {
            const [, id, language, cellContent] = match;
            const trimmedContent = cellContent.trim();

            const cellKind = language === 'markdown'
                ? vscode.NotebookCellKind.Markup
                : vscode.NotebookCellKind.Code;

            const cellData = new vscode.NotebookCellData(
                cellKind,
                trimmedContent,
                language || 'javascript'
            );

            if (id) {
                cellData.metadata = { id };
            }

            cells.push(cellData);
        }

        return new vscode.NotebookData(cells);
    }

    private serializeToObservableKitFormat(data: vscode.NotebookData): string {
        // Convert VSCode notebook data to Observable Kit format
        const cells: Cell[] = [];
        let cellIdCounter = 1;

        for (const cell of data.cells) {
            const cellId = cell.metadata?.id ? parseInt(cell.metadata.id) : cellIdCounter++;
            const mode = VSCODE_TO_OBSERVABLE_MODE_MAP[cell.languageId] || 'js';
            const pinned = cell.metadata?.pinned !== undefined
                ? cell.metadata.pinned
                : (mode === 'js' || mode === 'ojs'); // Default pinned behavior from Observable Kit

            cells.push({
                id: cellId,
                value: cell.value,
                mode,
                pinned
            });
        }

        const notebook: Notebook = {
            title: data.metadata?.title || 'Untitled Notebook',
            theme: data.metadata?.theme || 'air',
            readOnly: data.metadata?.readOnly || false,
            cells
        };

        // Use the official Observable Kit serialize function
        return serialize(notebook);
    }

    private mapObservableKitTypeToLanguage(type: string): string {
        // This method is kept for backward compatibility with VSCode format
        const mapping: { [key: string]: string } = {
            'text/markdown': 'markdown',
            'module': 'javascript',
            'observablejs': 'ojs',
            'text/html': 'html',
            'text/css': 'css'
        };
        return mapping[type] || 'javascript';
    }
}
