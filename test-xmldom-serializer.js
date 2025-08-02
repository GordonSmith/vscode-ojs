// Test the updated serializer with xmldom
import { deserialize, serialize } from "@observablehq/notebook-kit";
import { DOMParser } from "@xmldom/xmldom";

// Set up the same globals as the serializer does
if (!globalThis.DOMParser) {
    globalThis.DOMParser = DOMParser;

    globalThis.document = {
        createElement: (tagName) => {
            const element = {
                tagName: tagName.toUpperCase(),
                id: '',
                type: '',
                textContent: '',
                attributes: new Map(),
                childNodes: [],

                setAttribute(name, value) {
                    this.attributes.set(name, value);
                },

                hasAttribute(name) {
                    return this.attributes.has(name);
                },

                getAttribute(name) {
                    return this.attributes.get(name) || null;
                },

                appendChild(child) {
                    this.childNodes.push(child);
                    return child;
                },

                get outerHTML() {
                    let html = `<${tagName}`;

                    for (const [name, value] of this.attributes) {
                        if (value === '') {
                            html += ` ${name}`;
                        } else {
                            html += ` ${name}="${value}"`;
                        }
                    }

                    if (this.id) html += ` id="${this.id}"`;
                    if (this.type) html += ` type="${this.type}"`;

                    html += '>';

                    if (this.textContent) {
                        html += this.textContent;
                    }

                    for (const child of this.childNodes) {
                        if (typeof child === 'string') {
                            html += child;
                        } else if (child.outerHTML) {
                            html += child.outerHTML;
                        } else {
                            html += child.toString();
                        }
                    }

                    html += `</${tagName}>`;
                    return html;
                }
            };

            return element;
        },

        createTextNode: (text) => text
    };
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
    console.log("Testing serialize...");
    const serialized = serialize(sampleNotebook);
    console.log("✅ Serialize successful");
    console.log("Serialized length:", serialized.length);

    console.log("\nTesting deserialize...");
    const parser = new DOMParser();
    const deserialized = deserialize(serialized, { parser });
    console.log("✅ Deserialize successful");
    console.log("Deserialized title:", deserialized.title);
    console.log("Cell count:", deserialized.cells.length);

    console.log("\n✅ All tests passed!");
} catch (error) {
    console.error("❌ Test failed:", error);
}
