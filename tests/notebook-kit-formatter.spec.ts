import { describe, expect, it } from "vitest";
import { formatNotebookCell, formatNotebookHtml, NOTEBOOK_KIT_FORMAT_LANGUAGES } from "../src/notebook-kit/formatter/format";

describe("Notebook Kit formatter", () => {
    it("formats JavaScript using editor indentation", async () => {
        const formatted = await formatNotebookCell("const value={answer:42}", "javascript", {
            tabWidth: 4,
            useTabs: false
        });

        expect(formatted).toBe("const value = { answer: 42 };\n");
    });

    it("formats Markdown cells", async () => {
        const formatted = await formatNotebookCell("# Heading\n\n-   one\n-   two", "markdown");

        expect(formatted).toBe("# Heading\n\n- one\n- two\n");
    });

    it("does not claim unsupported cell languages", async () => {
        expect(NOTEBOOK_KIT_FORMAT_LANGUAGES).toEqual(["html", "javascript", "markdown", "typescript"]);
        await expect(formatNotebookCell("select * from table", "sql")).resolves.toBeUndefined();
    });

        it("formats raw notebook layout without changing embedded source", async () => {
        const source = '<!doctype html>\n<notebook theme="air"><title>Test</title><script id="1" type="module">const value={answer:42}</script></notebook>';
                const expected = [
                        "<!doctype html>",
                        "<notebook theme=\"air\">",
                        "  <title>Test</title>",
                        "  <script id=\"1\" type=\"module\">",
                        "    const value={answer:42}",
                        "  </script>",
                        "</notebook>"
                ].join("\n");

                await expect(formatNotebookHtml(source)).resolves.toBe(expected);
    });

    it("repairs Markdown cell indentation in raw HTML", async () => {
        const source = `<!doctype html>
<notebook>
    <title>Hello, world!</title>
    <script type="text/markdown">
    # Hello, world!
  </script>
    <script type="module" pinned>
        1 + 2
    </script>
</notebook>`;

        const formatted = await formatNotebookHtml(source);

                expect(formatted).toContain(`  <script type="text/markdown">
    # Hello, world!
  </script>`);
    });

    it("formats an unindented raw notebook", async () => {
        const source = [
            "<!doctype html>",
            "<notebook>",
            "<title>Hello, world!</title>",
            "<script type=\"text/markdown\">",
            "# Hello, world!",
            "</script>",
            "<script type=\"module\" pinned>",
            "1 + 2",
            "</script>",
            "</notebook>"
        ].join("\n");
        const expected = [
            "<!doctype html>",
            "<notebook>",
            "    <title>Hello, world!</title>",
            "    <script type=\"text/markdown\">",
            "        # Hello, world!",
            "    </script>",
            "    <script type=\"module\" pinned>",
            "        1 + 2",
            "    </script>",
            "</notebook>"
        ].join("\n");

        await expect(formatNotebookHtml(source, { tabWidth: 4 })).resolves.toBe(expected);
    });
});