const { DOMParser } = require('@xmldom/xmldom');
const { selectOne, selectAll } = require('css-select');

// Adapter to make xmldom nodes compatible with css-select
const xmldomAdapter = {
    isTag: (node) => node.nodeType === 1, // ELEMENT_NODE

    getAttributeValue: (elem, name) => {
        return elem.getAttribute(name) || undefined;
    },

    getChildren: (node) => {
        return Array.from(node.childNodes || []);
    },

    getName: (elem) => {
        return elem.nodeName?.toLowerCase() || '';
    },

    getParent: (node) => {
        return node.parentNode;
    },

    getSiblings: (node) => {
        if (!node.parentNode) return [node];
        return Array.from(node.parentNode.childNodes || []);
    },

    getText: (node) => {
        return node.textContent || '';
    },

    hasAttrib: (elem, name) => {
        return elem.hasAttribute(name);
    },

    removeSubsets: (nodes) => {
        return nodes.filter((node, i) => {
            return !nodes.some((other, j) => {
                return i !== j && other.contains && other.contains(node);
            });
        });
    },

    equals: (a, b) => {
        return a === b;
    }
};

class DOMParserEx extends DOMParser {
    constructor() {
        super();
    }

    parseFromString(data, contentType) {
        const doc = super.parseFromString(data, contentType);
        doc["querySelector"] = (selector) => {
            try {
                // Use css-select with our xmldom adapter to find the first matching element
                // Start from the document element or the document itself
                const rootElement = doc.documentElement || doc;
                const result = selectOne(selector, rootElement, { adapter: xmldomAdapter });
                return result || null;
            } catch (error) {
                console.error('Error in querySelector:', error);
                return null;
            }
        };

        doc["querySelectorAll"] = (selector) => {
            try {
                // Use css-select with our xmldom adapter to find all matching elements
                // Start from the document element or the document itself
                const rootElement = doc.documentElement || doc;
                const results = selectAll(selector, rootElement, { adapter: xmldomAdapter });
                // Return a NodeList-like array
                return results;
            } catch (error) {
                console.error('Error in querySelectorAll:', error);
                return [];
            }
        };

        return doc;
    }
}

// Test the implementation
const parser = new DOMParserEx();
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Document</title>
</head>
<body>
    <div class="container">
        <p id="first">First paragraph</p>
        <p class="highlight">Second paragraph</p>
        <div class="box">
            <span>Inside box</span>
        </div>
    </div>
</body>
</html>
`;

const doc = parser.parseFromString(htmlContent, 'text/html');

console.log('Testing querySelector...');

// Test querySelector
const firstP = doc.querySelector('p#first');
console.log('querySelector("p#first"):', firstP ? firstP.nodeName + ' with text: "' + firstP.textContent + '"' : 'null');

const container = doc.querySelector('.container');
console.log('querySelector(".container"):', container ? container.nodeName + ' with class: "' + container.getAttribute('class') + '"' : 'null');

// Test querySelectorAll
const allPs = doc.querySelectorAll('p');
console.log('querySelectorAll("p") count:', allPs.length);

const highlightElements = doc.querySelectorAll('.highlight');
console.log('querySelectorAll(".highlight") count:', highlightElements.length);

console.log('Test completed successfully!');
