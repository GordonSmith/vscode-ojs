import { createConnection, TextDocuments, Diagnostic, DiagnosticSeverity, ProposedFeatures, InitializeParams, DidChangeConfigurationNotification, CompletionItem, CompletionItemKind, TextDocumentPositionParams, TextDocumentSyncKind, InitializeResult, HoverParams } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { compile, ohq, ojs2notebook, omd2notebook } from "@hpcc-js/observablehq-compiler";
import { ACTIVE_FILE, env } from "./tsserver";

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true
			},
			hoverProvider: true
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log("Workspace folder change event received.");
		});
	}
});

// The example settings
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <ExampleSettings>(
			(change.settings.ojs || defaultSettings)
		);
	}

	// Revalidate all open text documents
	documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: "ojs"
		});
		documentSettings.set(resource, result);
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	// In this simple example we get the settings for every validate run.
	const settings = await getDocumentSettings(textDocument.uri);

	// The validator creates diagnostics for all uppercase words length 2 and more
	const text = textDocument.getText();

	let diagnostics: Diagnostic[] = [];
	diagnostics = [];

	let notebook: ohq.Notebook | undefined;
	try {
		switch (textDocument.languageId) {
			case "ojs":
				notebook = ojs2notebook(text);
				break;
			case "omd":
				notebook = omd2notebook(text);
				break;
			default:
				throw new Error(`Unknown language:  ${textDocument.languageId}`);
		}
	} catch (e: any) {
		if (e.message) {
			const diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Error,
				range: {
					start: textDocument.positionAt(e.pos),
					end: textDocument.positionAt(e.raisedAt)
				},
				message: e?.message ?? "Unknown",
				source: "ObservableJS"
			};
			diagnostics.push(diagnostic);
		}
	}

	let js: string = " ";
	let map = {
		mappings: {}
	};
	if (notebook) {
		try {
			const prog = await compile(notebook);
			js = prog.toString();
			map = prog.toMap();
		} catch (e: any) {
			diagnostics.push({
				message: e.message,
				range: {
					start: { line: 0, character: 0 },
					end: { line: 0, character: 0 }
				}
			});
		}
	}

	// const fsMap = createDefaultMapFromNodeModules({ target: ts.ScriptTarget.ES2015, allowJs: true });
	// fsMap.set("index.js", js.toString());
	// const system = createSystem(fsMap);
	// const compilerOpts: CompilerOptions = { target: ts.ScriptTarget.ES2015, module: ts.ModuleKind.ES2015, esModuleInterop: true, allowJs: true };
	// const env = createVirtualTypeScriptEnvironment(system, ["index.js"], ts, compilerOpts);/*, {
	// 	before: [context => {
	// 		return node => {
	// 			return node;
	// 		};
	// 	}],
	// 	after: [context => {
	// 		return node => {
	// 			return node;
	// 		};
	// 	}],
	// 	afterDeclarations: [context => {
	// 		return node => {
	// 			return node;
	// 		};s
	// 	}]
	// });*/

	//	env.updateFile(ACTIVE_FILE, js);
	env.updateFile(ACTIVE_FILE, js);
	// env.updateFile("active.map", map);
	const tscDiagnostics = env.languageService.getSyntacticDiagnostics(ACTIVE_FILE);

	diagnostics = [...diagnostics, ...tscDiagnostics.map((row): Diagnostic => {
		const start = textDocument.positionAt(row.start);
		const node: ohq.Node | undefined = map.mappings[start.line];
		const range = {
			start: textDocument.positionAt(row.start - (node?.start ?? 0)),
			end: textDocument.positionAt(row.start - (node?.start ?? 0) + row.length)
		};
		// for (let i = 0; i < notebook?.nodes.length ?? 0; ++i) {
		// 	const node = notebook.nodes[i];
		// 	if (node.start) { }
		// }
		return {
			message: row.messageText as string,
			range
		};
	})];

	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
});

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log("We received an file change event");
});

// This handler provides the initial list of the completion items.
connection.onCompletion((_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
	// The pass parameter contains the position of the text document in
	// which code complete got requested. For the example we ignore this
	// info and always provide the same completion items.
	return [
		{
			label: "TypeScript",
			kind: CompletionItemKind.Text,
			data: 1
		},
		{
			label: "JavaScript",
			kind: CompletionItemKind.Text,
			data: 2
		}
	];
});

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		if (item.data === 1) {
			item.detail = "TypeScript details";
			item.documentation = "TypeScript documentation";
		} else if (item.data === 2) {
			item.detail = "JavaScript details";
			item.documentation = "JavaScript documentation";
		}
		return item;
	}
);

connection.onHover((params: HoverParams) => {
	const defs = env.languageService.getDefinitionAtPosition(ACTIVE_FILE, 0);
	const x = defs?.map(def => def.name).join("\n");
	return x ? {
		contents: x
	} : null;
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
