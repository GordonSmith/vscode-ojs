
interface ReflectionResult {
    name: string;
    inputs: string[];
    returns: string[];
}

function reflect(someFunc: { name?: string; toString(): string }): ReflectionResult {
    const src: string = String(someFunc.toString());

    // Extract function name
    let name: string = (someFunc as { name?: string }).name || "";
    if (!name) {
        const m = src.match(/function\s+([\w$]+)/);
        if (m) name = m[1];
    }

    // Extract parameter list (best-effort, handles simple cases well)
    const inputs: string[] = (() => {
        const parenStart = src.indexOf("(");
        if (parenStart < 0) return [];
        let i = parenStart + 1;
        let depth = 1;
        let inStr: false | '"' | "'" | "`" = false;
        let prev: string = "";
        for (; i < src.length; ++i) {
            const ch = src[i];
            if (inStr) {
                if (ch === inStr && prev !== "\\") inStr = false;
            } else {
                if (ch === '"' || ch === "'" || ch === "`") inStr = ch as '"' | "'" | "`";
                else if (ch === "(") depth++;
                else if (ch === ")") {
                    depth--;
                    if (depth === 0) break;
                }
            }
            prev = ch;
        }
        const paramsRaw = src.slice(parenStart + 1, i).trim();
        if (!paramsRaw) return [];

        // Split at top-level commas only
        const parts: string[] = [];
        let token = "";
        let brace = 0, bracket = 0, paren = 0;
        inStr = false;
        let esc = false;
        for (let j = 0; j < paramsRaw.length; ++j) {
            const ch = paramsRaw[j];
            token += ch;
            if (inStr) {
                if (!esc && ch === inStr) inStr = false;
                esc = ch === "\\" && !esc;
                continue;
            }
            esc = false;
            if (ch === '"' || ch === "'" || ch === "`") inStr = ch as '"' | "'" | "`";
            else if (ch === "{") brace++;
            else if (ch === "}") brace--;
            else if (ch === "[") bracket++;
            else if (ch === "]") bracket--;
            else if (ch === "(") paren++;
            else if (ch === ")") paren--;
            else if (ch === "," && brace === 0 && bracket === 0 && paren === 0) {
                parts.push(token.slice(0, -1));
                token = "";
            }
        }
        if (token.trim()) parts.push(token);

        // Normalize to identifier names when possible
        return parts
            .map((p) => p.trim())
            .filter((p) => p.length > 0)
            .map((p) => {
                // Remove TypeScript type annotations and default values
                // e.g., name: Type = default -> name
                let s = p;
                // Strip comments
                s = s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/g, "");
                // Rest parameter
                s = s.replace(/^\.{3}/, "");
                // Remove type annotation (colon outside brackets/braces)
                s = s.replace(/:(?:[^=]|=(?!=))*$/, (m) => "");
                // Remove default value
                const eq = s.indexOf("=");
                if (eq >= 0) s = s.slice(0, eq);
                s = s.trim();
                // Simple identifier
                const id = s.match(/^([A-Za-z_$][\w$]*)$/);
                if (id) return id[1];
                // Destructured or complex parameter; return as-is (compact)
                return s.replace(/\s+/g, " ");
            });
    })();

    // Extract named returns from an object literal: return { a, b: c, "d": e }
    const returns: string[] = (() => {
        const retIdx = src.search(/return\s*\{/);
        if (retIdx < 0) return [];
        const objStart = src.indexOf("{", retIdx);
        if (objStart < 0) return [];
        let i = objStart + 1;
        let depth = 1;
        let inStr: false | '"' | "'" | "`" = false;
        let esc = false;
        for (; i < src.length; ++i) {
            const ch = src[i];
            if (inStr) {
                if (!esc && ch === inStr) inStr = false;
                esc = ch === "\\" && !esc;
                continue;
            }
            if (ch === '"' || ch === "'" || ch === "`") inStr = ch as '"' | "'" | "`";
            else if (ch === "{") depth++;
            else if (ch === "}") {
                depth--;
                if (depth === 0) break;
            }
        }
        const body = src.slice(objStart + 1, i).trim();
        if (!body) return [];

        // Split at top-level commas
        const props: string[] = [];
        let token = "";
        let brace = 0, bracket = 0, paren = 0;
        inStr = false;
        esc = false;
        for (let j = 0; j < body.length; ++j) {
            const ch = body[j];
            token += ch;
            if (inStr) {
                if (!esc && ch === inStr) inStr = false;
                esc = ch === "\\" && !esc;
                continue;
            }
            esc = false;
            if (ch === '"' || ch === "'" || ch === "`") inStr = ch as '"' | "'" | "`";
            else if (ch === "{") brace++;
            else if (ch === "}") brace--;
            else if (ch === "[") bracket++;
            else if (ch === "]") bracket--;
            else if (ch === "(") paren++;
            else if (ch === ")") paren--;
            else if (ch === "," && brace === 0 && bracket === 0 && paren === 0) {
                props.push(token.slice(0, -1));
                token = "";
            }
        }
        if (token.trim()) props.push(token);

        return props
            .map((p) => p.trim())
            .filter((p) => p.length > 0 && !p.startsWith("...")) // ignore spreads
            .map((p) => {
                // Property forms:
                // 1) shorthand:   ident
                // 2) key: value:  ident: expr
                // 3) quoted key:  'ident': expr or "ident": expr
                // 4) computed:    [expr]: expr  (skip name extraction)
                let m = p.match(/^([A-Za-z_$][\w$]*)\s*(,|$)/);
                if (m) return m[1];
                m = p.match(/^([A-Za-z_$][\w$]*)\s*:/);
                if (m) return m[1];
                m = p.match(/^(?:"([^"]+)"|'([^']+)')\s*:/);
                if (m) return (m[1] || m[2]);
                // Fallback: return trimmed token (compact)
                return p.replace(/\s+/g, " ");
            });
    })();

    return { name, inputs, returns };
}

function someFunc(callRange, d3, margin, width): {
    getDate: (date: Date) => Date;
    now: Date;
    until: Date;
    nowDate: Date;
    untilDate: Date;
    scaleX: unknown;
} {
    function getDate(date: Date): Date {
        return new Date(date.toISOString().split("T")[0]);
    }

    const now = callRange.start;
    const until = callRange.end;

    const nowDate = new Date(callRange.start.getUTCFullYear(), 0, 1);
    const untilDate = new Date(callRange.end.getUTCFullYear(), 11, 31);

    const scaleX = d3.scaleUtc().domain([nowDate, untilDate]).range([margin.left, width - margin.right]);
    return { getDate, now, until, nowDate, untilDate, scaleX };
}

function someFunc2() {
    const mol = 22;
}

function someFunc3() {
    const mol = 22;
    return mol;
}

export function runTests() {
    const r = reflect(someFunc);
    console.info(r);
    const r2 = reflect(someFunc2);
    console.info(r2);
    const r3 = reflect(someFunc3);
    console.info(r3);
}