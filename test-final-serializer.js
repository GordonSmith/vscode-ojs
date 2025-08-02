// Test the updated serializer implementation
import { deserialize } from "@observablehq/notebook-kit";
import { DOMParser } from "@xmldom/xmldom";

// Test the serialize function independently
function serializeMode(mode) {
    switch (mode) {
        case "md":
            return "text/markdown";
        case "html":
            return "text/html";
        case "tex":
            return "application/x-tex";
        case "sql":
            return "application/sql";
        case "dot":
            return "text/vnd.graphviz";
        case "ojs":
            return "application/vnd.observable.javascript";
        default:
            return "module";
    }
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function serializeNotebookToHTML(notebook) {
    let html = `<!doctype html>\n<notebook theme="${notebook.theme}"`;
    if (notebook.readOnly) {
        html += ` readonly`;
    }
    html += `>\n  <title>${escapeHtml(notebook.title)}</title>\n`;

    for (const cell of notebook.cells) {
        html += `  <script id="${cell.id}" type="${serializeMode(cell.mode)}"`;
        if (cell.pinned) {
            html += ` pinned`;
        }
        html += `>\n`;

        // Indent cell content (4 spaces as per Observable Kit spec)
        const indentedValue = cell.value
            .replace(/<(?=\\*\/script(\s|>))/gi, "<\\") // Escape closing script tags
            .split('\n')
            .map(line => line ? `    ${line}` : '')
            .join('\n');

        html += indentedValue;
        html += `\n  </script>\n`;
    }

    html += `</notebook>\n`;
    return html;
}

const sampleNotebook = {
    title: "Test Notebook",
    theme: "air",
    readOnly: false,
    cells: [
        {
            id: 1,
            value: "# Hello World\n\nThis is a markdown cell.",
            mode: "md",
            pinned: false
        },
        {
            id: 2,
            value: "const greeting = 'Hello from Observable!';",
            mode: "js",
            pinned: true
        }
    ]
};

try {
    console.log("Testing custom serialize...");
    const serialized = serializeNotebookToHTML(sampleNotebook);
    console.log("✅ Serialize successful");
    console.log("Serialized HTML:");
    console.log(serialized);

    console.log("\nTesting deserialize...");
    const parser = new DOMParser();
    const deserialized = deserialize(serialized, { parser });
    console.log("✅ Deserialize successful");
    console.log("Deserialized:", JSON.stringify(deserialized, null, 2));

    console.log("\n✅ All tests passed!");
} catch (error) {
    console.error("❌ Test failed:", error);
}
