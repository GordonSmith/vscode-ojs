import { DOMParser as DOMParserBase, DOMImplementation } from "@xmldom/xmldom";
import { selectOne, selectAll } from "css-select";

/**
 * DOM Polyfill for Node.js environment
 * 
 * Provides minimal DOM functionality required by @observablehq/notebook-kit
 * serialize.js, including:
 * - document.createElement()
 * - document.createTextNode()
 * - document.querySelector/querySelectorAll()
 * - Element properties: id, type, textContent, innerHTML, outerHTML
 * - Element methods: setAttribute, hasAttribute, appendChild
 * - DOMParser with querySelector support
 */

/**
 * Enhanced element property handler for better DOM compatibility
 */
function enhanceElement(element: any, tagName: string) {
    const lowerTagName = tagName.toLowerCase();

    // Properties that should sync with attributes for all elements
    const syncProperties = ['id'];

    // Additional properties for specific elements
    if (lowerTagName === 'script') {
        syncProperties.push('type');
    }

    // Set up property-attribute synchronization
    syncProperties.forEach(prop => {
        Object.defineProperty(element, prop, {
            get: function () {
                return this.getAttribute(prop) || "";
            },
            set: function (value) {
                if (value != null) {
                    this.setAttribute(prop, String(value));
                } else {
                    this.removeAttribute(prop);
                }
            },
            configurable: true,
            enumerable: true
        });
    });

    // Add textContent property for better compatibility
    if (!element.textContent && !Object.getOwnPropertyDescriptor(element, 'textContent')) {
        Object.defineProperty(element, "textContent", {
            get: function () {
                let text = "";
                for (let i = 0; i < this.childNodes.length; i++) {
                    const child = this.childNodes[i];
                    if (child.nodeType === 3) { // Text node
                        text += child.nodeValue || "";
                    } else if (child.nodeType === 1) { // Element node
                        text += child.textContent || "";
                    }
                }
                return text;
            },
            set: function (value) {
                // Clear all child nodes and add a single text node
                while (this.firstChild) {
                    this.removeChild(this.firstChild);
                }
                if (value != null) {
                    this.appendChild(this.ownerDocument.createTextNode(String(value)));
                }
            },
            configurable: true,
            enumerable: true
        });
    }

    // Add innerHTML property getter (read-only for serialization)
    Object.defineProperty(element, "innerHTML", {
        get: function () {
            let html = "";
            for (let i = 0; i < this.childNodes.length; i++) {
                const child = this.childNodes[i];
                if (child.nodeType === 1) { // Element node
                    html += child.toString();
                } else if (child.nodeType === 3) { // Text node
                    // Escape text content for HTML
                    const text = child.nodeValue || "";
                    html += text.replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                }
            }
            return html;
        },
        configurable: true,
        enumerable: false
    });

    // Add outerHTML property getter
    Object.defineProperty(element, "outerHTML", {
        get: function () {
            return this.toString();
        },
        configurable: true,
        enumerable: false
    });

    return element;
}

if (!globalThis.document) {
    // @ts-expect-error - Create HTML document for polyfill
    globalThis.document = new DOMImplementation().createHTMLDocument();

    // Store original methods
    const origCreateElement = document.createElement;
    const origCreateTextNode = document.createTextNode;

    // Enhanced createElement
    document.createElement = function (name: string) {
        const element = origCreateElement.call(this, name);
        return enhanceElement(element, name);
    };

    // Enhanced createTextNode (ensure it works properly)
    document.createTextNode = function (data: string) {
        return origCreateTextNode.call(this, data || "");
    };

    // Add querySelector and querySelectorAll to document
    document.querySelector = function (selector: string) {
        try {
            const result = selectOne(selector, this, { adapter: xmldomAdapter });
            return result || null;
        } catch (error) {
            console.error('Error in document.querySelector:', error);
            return null;
        }
    };

    document.querySelectorAll = function (selector: string) {
        try {
            const results = selectAll(selector, this, { adapter: xmldomAdapter });
            // Create a NodeList-like object with the required methods
            const nodeList = Object.assign(results, {
                item(index: number) {
                    return results[index] || null;
                },
                forEach(callback: (value: any, index: number, list: any) => void, thisArg?: any) {
                    for (let i = 0; i < results.length; i++) {
                        callback.call(thisArg, results[i], i, results);
                    }
                }
            });
            return nodeList as any;
        } catch (error) {
            console.error('Error in document.querySelectorAll:', error);
            const emptyList = Object.assign([], {
                item: () => null,
                forEach: () => { }
            });
            return emptyList as any;
        }
    };
}

// Adapter to make xmldom nodes compatible with css-select
const xmldomAdapter = {
    isTag: (node: any): node is Element => {
        return node && node.nodeType === 1; // ELEMENT_NODE
    },

    getAttributeValue: (elem: any, name: string): string | undefined => {
        if (!elem || typeof elem.getAttribute !== 'function') return undefined;
        const value = elem.getAttribute(name);
        return value === null ? undefined : value;
    },

    getChildren: (node: any): any[] => {
        if (!node || !node.childNodes) return [];
        const children = [];
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child.nodeType === 1) { // Only element nodes
                children.push(child);
            }
        }
        return children;
    },

    getName: (elem: any): string => {
        return elem && elem.nodeName ? elem.nodeName.toLowerCase() : '';
    },

    getParent: (node: any): any | null => {
        return node && node.parentNode ? node.parentNode : null;
    },

    getSiblings: (node: any): any[] => {
        if (!node || !node.parentNode) return [node];
        const siblings = [];
        const parent = node.parentNode;
        for (let i = 0; i < parent.childNodes.length; i++) {
            const child = parent.childNodes[i];
            if (child.nodeType === 1) { // Only element nodes
                siblings.push(child);
            }
        }
        return siblings;
    },

    getText: (node: any): string => {
        if (!node) return '';
        if (typeof node.textContent === 'string') return node.textContent;
        if (node.nodeType === 3) return node.nodeValue || ''; // Text node

        // Fallback: collect text from all child text nodes
        let text = '';
        if (node.childNodes) {
            for (let i = 0; i < node.childNodes.length; i++) {
                const child = node.childNodes[i];
                if (child.nodeType === 3) {
                    text += child.nodeValue || '';
                }
            }
        }
        return text;
    },

    hasAttrib: (elem: any, name: string): boolean => {
        if (!elem || typeof elem.hasAttribute !== 'function') return false;
        return elem.hasAttribute(name);
    },

    removeSubsets: (nodes: any[]): any[] => {
        return nodes.filter((node, i) => {
            return !nodes.some((other, j) => {
                return i !== j && other && typeof other.contains === 'function' && other.contains(node);
            });
        });
    },

    equals: (a: any, b: any): boolean => {
        return a === b;
    }
};

export class DOMParser extends DOMParserBase {
    constructor() {
        super();
    }

    parseFromString(data: string, contentType: string) {
        const doc = super.parseFromString(data, contentType);

        // Add querySelector method to the parsed document
        (doc as any).querySelector = (selector: string) => {
            try {
                // Use css-select with our xmldom adapter to find the first matching element
                // Start from the document element or the document itself
                const rootElement = doc.documentElement || doc as any;
                const result = selectOne(selector, rootElement, { adapter: xmldomAdapter });
                return result || null;
            } catch (error) {
                console.error('Error in querySelector:', error);
                return null;
            }
        };

        // Add querySelectorAll method to the parsed document
        (doc as any).querySelectorAll = (selector: string) => {
            try {
                // Use css-select with our xmldom adapter to find all matching elements
                // Start from the document element or the document itself
                const rootElement = doc.documentElement || doc as any;
                const results = selectAll(selector, rootElement, { adapter: xmldomAdapter });
                // Create a NodeList-like object with the required methods
                const nodeList = Object.assign(results, {
                    item(index: number) {
                        return results[index] || null;
                    },
                    forEach(callback: (value: any, index: number, list: any) => void, thisArg?: any) {
                        for (let i = 0; i < results.length; i++) {
                            callback.call(thisArg, results[i], i, results);
                        }
                    }
                });
                return nodeList;
            } catch (error) {
                console.error('Error in querySelectorAll:', error);
                const emptyList = Object.assign([], {
                    item: () => null,
                    forEach: () => { }
                });
                return emptyList;
            }
        };

        return doc;
    }
}

