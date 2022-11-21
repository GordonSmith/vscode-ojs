import * as vscode from "vscode";
import * as path from "path";
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from "vscode-languageclient/node";
import { scopedLogger } from "@hpcc-js/util";

const logger = scopedLogger("src/ojs/languageService.ts");

export let languageService: LanguageService;
export class LanguageService {
    protected _ctx: vscode.ExtensionContext;
    protected _client: LanguageClient;

    private constructor(ctx: vscode.ExtensionContext) {
        this._ctx = ctx;

        this.startServer();
    }

    static attach(ctx: vscode.ExtensionContext) {
        if (!languageService) {
            languageService = new LanguageService(ctx);
        }
        return languageService;
    }

    static detach(): Thenable<void> | undefined {
        if (languageService) {
            return languageService.stopServer();
        }
    }

    startServer() {
        // The server is implemented in node
        const serverModule = this._ctx.asAbsolutePath(
            path.join("dist", "server.js")
        );

        // The debug options for the server
        // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
        const debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };
        const serverOptions: ServerOptions = {
            run: { module: serverModule, transport: TransportKind.ipc },
            debug: {
                module: serverModule,
                transport: TransportKind.ipc,
                options: debugOptions
            }
        };

        // Options to control the language client
        const clientOptions: LanguageClientOptions = {
            // Register the server for plain text documents
            documentSelector: [
                { scheme: "file", language: "ojs" },
                { scheme: "file", language: "omd" },
                { scheme: "file", language: "ojsnb" }
            ],
            synchronize: {
                // Notify the server about file changes to '.clientrc files contained in the workspace
                fileEvents: vscode.workspace.createFileSystemWatcher("**/.clientrc")
            }
        };

        // Create the language client and start the client.
        this._client = new LanguageClient(
            "lsp-observable-javascript",
            "Observable JS",
            serverOptions,
            clientOptions
        );

        // Start the client. This will also launch the server
        this._client.start();
    }

    stopServer() {
        if (this._client) {
            return this._client.stop();
        }
    }
}

