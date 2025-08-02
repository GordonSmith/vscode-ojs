// Simple test to verify the serializer works with Observable Kit
import { deserialize, serialize } from "@observablehq/notebook-kit";
import { JSDOM } from "jsdom";

// Set up global DOMParser for Observable Kit deserialize function
if (!globalThis.DOMParser) {
    const { window } = new JSDOM();
    globalThis.DOMParser = window.DOMParser;
    globalThis.document = window.document;
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
        },
        {
            id: 3,
            value: "greeting",
            mode: "ojs",
            pinned: true
        }
    ]
};

console.log("Original notebook:", JSON.stringify(sampleNotebook, null, 2));

// Test serialize
const serialized = serialize(sampleNotebook);
console.log("\nSerialized HTML:");
console.log(serialized);

// Test deserialize
const deserialized = deserialize(serialized);
console.log("\nDeserialized notebook:", JSON.stringify(deserialized, null, 2));

console.log("\n✅ Serializer test completed successfully!");
