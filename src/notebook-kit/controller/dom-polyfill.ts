/**
 * Simple Element implementation
 */
class MockElement {
    public tagName: string;
    public attributes: Map<string, string> = new Map();
    public childNodes: (MockElement | MockTextNode)[] = [];
    private _textContent: string = "";

    constructor(tagName: string) {
        this.tagName = tagName.toLowerCase();
    }

    get id(): string {
        return this.getAttribute("id") || "";
    }

    set id(value: string) {
        this.setAttribute("id", value);
    }

    get type(): string {
        return this.getAttribute("type") || "";
    }

    set type(value: string) {
        this.setAttribute("type", value);
    }

    get textContent(): string {
        if (this.childNodes.length === 0) {
            return this._textContent;
        }
        return this.childNodes
            .map(child => (child as any).textContent || (child as any).data || "")
            .join("");
    }

    set textContent(value: string) {
        this._textContent = value || "";
        this.childNodes = [];
    }

    setAttribute(name: string, value: string): void {
        this.attributes.set(name.toLowerCase(), value);
    }

    getAttribute(name: string): string | null {
        return this.attributes.get(name.toLowerCase()) || null;
    }

    hasAttribute(name: string): boolean {
        return this.attributes.has(name.toLowerCase());
    }

    removeAttribute(name: string): void {
        this.attributes.delete(name.toLowerCase());
    }

    appendChild(child: MockElement | MockTextNode): void {
        this.childNodes.push(child);
    }

    get innerHTML(): string {
        return this.childNodes
            .map(child => {
                if (child instanceof MockElement) {
                    return child.outerHTML;
                }
                // For text nodes, check if parent should escape content
                const textData = (child as any).data || "";
                return this.shouldEscapeTextContent() ? escapeHtml(textData) : textData;
            })
            .join("");
    }

    get outerHTML(): string {
        const attrs = Array.from(this.attributes.entries())
            .map(([name, value]) => ` ${name}="${escapeAttr(value)}"`)
            .join("");

        const content = this.childNodes.length > 0
            ? this.innerHTML
            : this.shouldEscapeTextContent() ? escapeHtml(this._textContent) : this._textContent;

        return `<${this.tagName}${attrs}>${content}</${this.tagName}>`;
    }

    private shouldEscapeTextContent(): boolean {
        // Don't escape content for script tags and other tags that contain raw content
        return this.tagName !== "script" && this.tagName !== "style";
    }

    querySelector(selector: string): MockElement | null {
        return querySelector(this, selector);
    }

    querySelectorAll(selector: string): MockElement[] {
        return querySelectorAll(this, selector);
    }
}

/**
 * Simple TextNode implementation
 */
class MockTextNode {
    public data: string;
    public nodeType = 3; // TEXT_NODE

    constructor(data: string) {
        this.data = data || "";
    }

    get textContent(): string {
        return this.data;
    }

    set textContent(value: string) {
        this.data = value || "";
    }
}

/**
 * Simple Document implementation
 */
class MockDocument {
    createElement(tagName: string): MockElement {
        return new MockElement(tagName);
    }

    createTextNode(data: string): MockTextNode {
        return new MockTextNode(data);
    }

    querySelector(selector: string): MockElement | null {
        return null;
    }

    querySelectorAll(selector: string): MockElement[] {
        return [];
    }
}

/**
 * Parsed document with querySelector support
 */
class MockParsedDocument {
    private content: string;
    private elements: MockElement[] = [];

    constructor(content: string) {
        this.content = content;
        this.parseContent();
    }

    private parseContent(): void {
        // Simple HTML parsing for the specific patterns used in serialize.js
        // Parse the content to find nested elements like <notebook><title>...</title><script>...</script></notebook>

        // First, find all top-level elements
        const topLevelRegex = /<(\w+)([^>]*)>([\s\S]*?)<\/\1>/g;
        let match;

        while ((match = topLevelRegex.exec(this.content)) !== null) {
            const [, tagName, attributesStr, innerHTML] = match;
            const element = new MockElement(tagName);

            // Parse attributes
            this.parseAttributes(element, attributesStr);

            // Parse the innerHTML for nested elements
            this.parseInnerHTML(element, innerHTML);

            this.elements.push(element);
        }
    }

    private parseAttributes(element: MockElement, attributesStr: string): void {
        const attrRegex = /(\w+)(?:="([^"]*)"|\s|$)/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attributesStr)) !== null) {
            const [, name, value] = attrMatch;
            element.setAttribute(name, value || "");
        }
    }

    private parseInnerHTML(parentElement: MockElement, innerHTML: string): void {
        // Find child elements and text content
        const childElementRegex = /<(\w+)([^>]*)>([\s\S]*?)<\/\1>/g;
        let lastIndex = 0;
        let childMatch;

        while ((childMatch = childElementRegex.exec(innerHTML)) !== null) {
            const [fullMatch, tagName, attributesStr, content] = childMatch;
            const matchStart = childMatch.index!;

            // Add any text content before this element
            if (matchStart > lastIndex) {
                const textBefore = innerHTML.slice(lastIndex, matchStart).trim();
                if (textBefore) {
                    parentElement.appendChild(new MockTextNode(textBefore));
                }
            }

            // Create the child element
            const childElement = new MockElement(tagName);
            this.parseAttributes(childElement, attributesStr);
            childElement.textContent = content.trim();
            parentElement.appendChild(childElement);

            lastIndex = matchStart + fullMatch.length;
        }

        // Add any remaining text content
        if (lastIndex < innerHTML.length) {
            const remainingText = innerHTML.slice(lastIndex).trim();
            if (remainingText) {
                parentElement.appendChild(new MockTextNode(remainingText));
            }
        }

        // If no child elements were found, treat the entire innerHTML as text content
        if (parentElement.childNodes.length === 0 && innerHTML.trim()) {
            parentElement.textContent = innerHTML.trim();
        }
    }

    querySelector(selector: string): MockElement | null {
        return querySelector({ childNodes: this.elements } as any, selector);
    }

    querySelectorAll(selector: string): MockElement[] {
        return querySelectorAll({ childNodes: this.elements } as any, selector);
    }
}

/**
 * Simple DOMParser implementation
 */
class MockDOMParser {
    parseFromString(data: string, contentType: string): MockParsedDocument {
        return new MockParsedDocument(data);
    }
}

/**
 * Simple CSS selector implementation
 * Only supports the basic selectors used in serialize.js:
 * - Element selectors (e.g., "notebook", "title", "script")
 * - Descendant selectors (e.g., "notebook script")
 */
function querySelector(root: { childNodes: (MockElement | MockTextNode)[] }, selector: string): MockElement | null {
    const results = querySelectorAll(root, selector);
    return results.length > 0 ? results[0] : null;
}

function querySelectorAll(root: { childNodes: (MockElement | MockTextNode)[] }, selector: string): MockElement[] {
    const results: MockElement[] = [];

    if (selector.includes(" ")) {
        // Descendant selector (e.g., "notebook script")
        const parts = selector.split(" ").filter(p => p.trim());
        if (parts.length === 2) {
            const [parent, child] = parts;
            const parentElements = findElementsByTagName(root.childNodes || [], parent);
            for (const parentEl of parentElements) {
                results.push(...findElementsByTagName(parentEl.childNodes, child));
            }
        }
    } else {
        // Simple element selector
        results.push(...findElementsByTagName(root.childNodes || [], selector));
    }

    return results;
}

function findElementsByTagName(nodes: (MockElement | MockTextNode)[], tagName: string): MockElement[] {
    const results: MockElement[] = [];

    for (const node of nodes) {
        if (node instanceof MockElement) {
            if (node.tagName === tagName.toLowerCase()) {
                results.push(node);
            }
            // Recursively search children
            results.push(...findElementsByTagName(node.childNodes, tagName));
        }
    }

    return results;
}

/**
 * HTML escaping utilities
 */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function escapeAttr(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/**
 * Install the polyfill
 */
export function installMinimalDOMPolyfill(): void {
    if (!globalThis.document) {
        globalThis.document = new MockDocument() as any;
    }

    if (!globalThis.DOMParser) {
        globalThis.DOMParser = MockDOMParser as any;
    }
}

