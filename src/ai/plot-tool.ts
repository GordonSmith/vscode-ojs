import * as vscode from "vscode";
import { reporter } from "../telemetry";
import { PLOT_COOKBOOK } from "./plot/plot-cookbook";
import { MARKS_COOKBOOK } from "./plot/marks-cookbook";
import { TRANSFORMS_COOKBOOK } from "./plot/transforms-cookbook";

/**
 * Observable Plot Expert Tool
 * 
 * This tool provides expert knowledge about Observable Plot, a JavaScript library
 * for exploratory data visualization. It can help with:
 * - Creating visualizations using Plot marks (dot, line, bar, area, etc.)
 * - Understanding Plot's declarative API
 * - Working with scales, axes, and facets
 * - Applying transforms and aggregations
 * - Interactive features and animations
 * - Best practices for data visualization
 */

const PLOT_EXPERTISE = `
# Observable Plot Expert

I am an expert in Observable Plot, the JavaScript library for exploratory data visualization.

## Getting Started with Plot

Observable Plot can be used in multiple environments:
- **Observable notebooks**: Available by default as \`Plot\`
- **HTML/Browser**: Load from CDN: \`import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm"\`
- **Node.js/npm**: Install via \`npm install @observablehq/plot\`
- **React/Vue/Svelte**: Server-side or client-side rendering with document option or DOM refs

Plot returns a detached DOM element (SVG or HTML figure) that you need to insert into the page.

## Core Concepts

Observable Plot doesn't have "chart types" — instead you construct charts by **layering marks**.

Plot uses a declarative API where you specify:
- **Marks**: Visual elements (dot, line, bar, area, rect, cell, text, rule, tick, arrow, etc.)
- **Data**: Arrays of objects (tidy data), Apache Arrow tables, or columnar data
- **Channels**: Map data fields to visual properties (x, y, fill, stroke, r, etc.)
- **Scales**: Transform data values to visual values (linear, log, sqrt, time, categorical, etc.)
- **Transforms**: Process data before rendering (bin, group, stack, normalize, filter, sort, etc.)
- **Facets**: Create small multiples by splitting data

### Marks are Geometric Shapes
Each mark type produces a certain type of geometric shape:
- **dot** - stroked circles (scatterplots)
- **line/lineY/lineX** - connected line segments (polylines)
- **bar/barX/barY** - rectangular bars
- **area/areaY/areaX** - filled areas
- **rect** - rectangles (for quantitative x & y)
- **cell** - rectangles (for ordinal x & y)
- **rule/ruleX/ruleY** - horizontal or vertical rules
- **tick/tickX/tickY** - short tick marks
- **text** - text labels
- **arrow** - arrows between points

### Marks are Layered
Marks can be composed into a single plot. Each mark supplies its own data:
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.ruleY([0]),
    Plot.areaY(data, {x: "Date", y: "Close", fillOpacity: 0.2}),
    Plot.lineY(data, {x: "Date", y: "Close"})
  ]
})
\`\`\`

### Tidy Data Format
Plot favors tidy data structured as an array of objects where:
- Each object represents an observation (a row)
- Each property represents an observed value (a column)
- All objects have the same property names

For larger datasets, use Apache Arrow tables for efficient columnar representation.

### Data Types Matter
- **Quantitative/Temporal**: Can be subtracted, ordered, interpolated (use line, area, rect)
- **Ordinal**: Can be ordered (use bar, cell)
- **Nominal/Categorical**: Can only be same or different

**Important distinctions:**
- Use **rect** when both x and y are quantitative
- Use **barX** when x is quantitative and y is ordinal
- Use **barY** when x is ordinal and y is quantitative
- Use **cell** when both x and y are ordinal

## Mark Options & Channels

### Channels vs Constants
Channels encode data (vary with each datum), constants are fixed for all shapes.

**Specifying channels:**
- Field name: \`{x: "fieldName"}\`
- Accessor function: \`{x: (d) => d.value * 1000}\`
- Array of values: \`{x: [1, 2, 3, 4]}\`
- Transform object: \`{x: {transform: (data) => data}}\`

**Auto-interpretation:**
- String that's a valid CSS color → constant color
- String that's not a valid color → field name (channel)
- Number → constant
- Function → channel
- Array → channel

### Common Style Options (all marks)
- **fill** - fill color (channel or constant)
- **fillOpacity** - fill opacity (0-1)
- **stroke** - stroke color (channel or constant)
- **strokeWidth** - stroke width in pixels
- **strokeOpacity** - stroke opacity (0-1)
- **strokeLinejoin** - bevel, miter, miter-clip, round
- **strokeLinecap** - butt, round, square
- **strokeDasharray** - dash pattern
- **opacity** - object opacity (0-1)
- **mixBlendMode** - CSS blend mode (e.g., multiply)
- **dx, dy** - horizontal/vertical offset in pixels
- **clip** - frame, sphere, or GeoJSON clipping
- **tip** - enable interactive tooltips (true or options object)

### Common Channels (most marks)
- **fill** - bound to color scale
- **stroke** - bound to color scale
- **opacity** - bound to opacity scale
- **title** - accessible tooltip (string with newlines)
- **href** - URL for links
- **ariaLabel** - accessibility label

### Transforms (all marks)
- **filter** - filter data
- **sort** - sort data or impute ordinal domains
- **reverse** - reverse order
- **transform** - custom transform function
- **initializer** - custom initializer

### Insets & Rounding (rect-like marks)
- **inset** - shorthand for all insets
- **insetTop, insetRight, insetBottom, insetLeft** - individual insets
- **r** - corner radius for all corners
- **rx, ry** - x-radius and y-radius for elliptical corners
- **rx1, rx2, ry1, ry2** - side-specific radii
- **rx1y1, rx1y2, rx2y1, rx2y2** - corner-specific radii

## Common Mark Types

### Dot (Scatterplot)
\`\`\`javascript
Plot.dot(data, {x: "fieldX", y: "fieldY", fill: "category"})
Plot.dot(data, {x: "x", y: "y", r: "size", symbol: "type"}) // variable size & symbol
\`\`\`

### Line
\`\`\`javascript
Plot.line(data, {x: "date", y: "value", stroke: "series"})
Plot.lineY(data, {x: "date", y: "value"}) // implies y channel
Plot.lineX(data, {x: "value", y: "date"}) // implies x channel
\`\`\`
**Note**: Lines interpolate between adjacent points. Only use with quantitative/temporal data in meaningful order.

### Bar Chart
\`\`\`javascript
Plot.barY(data, {x: "category", y: "value", fill: "category"})
Plot.barX(data, {x: "value", y: "category"}) // horizontal bars
\`\`\`
**Use bar when one axis is ordinal, one is quantitative.**

### Area Chart
\`\`\`javascript
Plot.areaY(data, {x: "date", y: "value", fill: "steelblue"})
Plot.areaY(data, {x: "date", y1: 0, y2: "value"}) // explicit baseline
\`\`\`

### Rect (Heatmap/Histogram)
\`\`\`javascript
Plot.rect(data, {x: "x", y: "y", fill: "value"}) // both axes quantitative
Plot.rectY(data, Plot.binX({y: "count"}, {x: "value"})) // histogram
\`\`\`

### Cell (Ordinal Heatmap)
\`\`\`javascript
Plot.cell(data, {x: "category1", y: "category2", fill: "count"})
\`\`\`
**Use cell when both axes are ordinal.**

### Rule (Reference Lines)
\`\`\`javascript
Plot.ruleY([0]) // horizontal line at y=0
Plot.ruleX([threshold]) // vertical line at x=threshold
\`\`\`

### Text Labels
\`\`\`javascript
Plot.text(data, {x: "x", y: "y", text: "label", fontSize: 12})
\`\`\`

### Tick Marks
\`\`\`javascript
Plot.tickX(data, {x: "value"}) // vertical ticks
Plot.tickY(data, {y: "value"}) // horizontal ticks
\`\`\`

## Plot.plot() Configuration

The main function for rendering plots. Returns an SVG or HTML figure element.

\`\`\`javascript
Plot.plot({
  // Required
  marks: [/* array of marks */],
  
  // Layout options (all in pixels)
  width: 640,           // outer width (default: 640, or use Observable's standard width)
  height: 396,          // outer height (auto-computed by default)
  marginTop: 20,        // top margin
  marginRight: 20,      // right margin
  marginBottom: 30,     // bottom margin
  marginLeft: 40,       // left margin
  margin: 20,           // shorthand for all margins
  aspectRatio: 1,       // compute height from width (e.g., 1 = square)
  
  // Scale options (one per scale)
  x: {
    label: "X Axis →",
    type: "linear",     // linear, log, sqrt, pow, symlog, quantile, quantize, threshold, ordinal, point, band, utc, time
    domain: [0, 100],   // extent of input values
    range: [0, 640],    // extent of output values (usually auto)
    grid: true,         // show grid lines
    nice: true,         // extend domain to nice values
    zero: false,        // include zero in domain
    round: true,        // round to integer positions
    tickFormat: "s",    // formatting (d3-format specifier)
    ticks: 10,          // number of ticks or array of values
    tickRotate: 45,     // rotate tick labels
    percent: true,      // format as percentage
    interval: "day",    // bin interval (for temporal/quantitative)
  },
  y: {label: "↑ Y Axis", grid: true},
  color: {
    legend: true,       // show legend
    scheme: "tableau10", // color scheme name
    type: "categorical",
    domain: ["A", "B"], // categories or value range
    range: ["red", "blue"], // colors
    reverse: false,
  },
  
  // Figure options
  title: "Chart Title",              // string or HTML element
  subtitle: "Additional context",     // string or HTML element
  caption: "Figure 1. Description",   // string or HTML element
  figure: true,                       // force figure element (vs SVG)
  
  // Other options
  style: "color: red;",               // inline styles (string or object)
  className: "my-plot",               // CSS class name
  clip: false,                        // default clipping (true/false/"frame"/"sphere"/GeoJSON)
  document: customDocument,           // for server-side rendering (e.g., JSDOM)
})
\`\`\`

### marks Option (Required)
An array of marks to render. Each mark supplies its own data. Marks are drawn in order (last on top).

\`\`\`javascript
marks: [
  Plot.ruleY([0]),                    // reference line
  Plot.areaY(data, {...}),            // filled area
  Plot.lineY(data, {...}),            // line on top
  condition ? Plot.dot(data, {...}) : null  // conditional mark
]
\`\`\`

You can combine multiple datasets by using separate marks, or merge datasets with a category column.

### Layout Options
- **width** - outer width in pixels (default: 640)
- **height** - outer height in pixels (auto by default based on scales)
- **margin** - shorthand for all four margins
- **marginTop/Right/Bottom/Left** - individual margins
- **aspectRatio** - compute height to maintain aspect ratio (use when x & y share units)

**Notes:**
- Plot doesn't auto-adjust margins for long labels—increase marginLeft manually if needed
- Use tickFormat for shorter labels (e.g., "s" for SI notation)
- When using ordinal scales with aspectRatio, consecutive values = 1 unit apart
- Set fx/fy scales' round: false for exact aspect ratios with facets

### Scale Configuration
Each scale (x, y, color, opacity, r, etc.) can be configured with options like:
- **type** - scale type (linear, log, sqrt, time, ordinal, etc.)
- **domain** - input value range
- **range** - output value range (colors, sizes, positions)
- **grid** - show grid lines
- **label** - axis label
- **legend** - show legend (for color, opacity, symbol)
- **scheme** - named color scheme
- **nice**, **zero**, **round** - domain/range adjustments

### Figure Options
- **title** - main chart title (string or HTML)
- **subtitle** - subtitle text (string or HTML)
- **caption** - figure caption (string or HTML)
- **figure** - force HTML figure element (auto if title/subtitle/legend/caption present)

### Other Options
- **style** - inline CSS styles (string like "color: red;" or object like {color: "red"})
- **className** - CSS class name for the SVG element
- **clip** - default clipping for marks (true/false/"frame"/"sphere"/GeoJSON)
- **document** - Document object for SSR (e.g., JSDOM in Node.js)

### Shorthand Syntax
\`\`\`javascript
// Full syntax
Plot.plot({marks: [Plot.barY(data, options)]})

// Shorthand - call .plot() on a mark
Plot.barY(data, options).plot({height: 400})
\`\`\`

### Accessing Scales & Legends
\`\`\`javascript
const plot = Plot.plot(options);
const colorScale = plot.scale("color");      // get scale object
const legend = plot.legend("color");          // render standalone legend
\`\`\`

## Common Transforms

### Bin (Histograms)
\`\`\`javascript
Plot.rectY(data, Plot.binX({y: "count"}, {x: "value"}))
Plot.rectY(data, Plot.binX({y: "sum"}, {x: "date", y: "amount"}))
Plot.rectY(data, Plot.bin({y: "count"}, {x: "x", y: "y"})) // 2D binning
\`\`\`

### Group (Aggregation)
\`\`\`javascript
Plot.barY(data, Plot.groupX({y: "sum"}, {x: "category", y: "value"}))
Plot.barY(data, Plot.groupX({y: "mean"}, {x: "category", y: "value"}))
Plot.dot(data, Plot.group({fill: "count"}, {x: "x", y: "y"}))
\`\`\`

### Stack (Cumulative)
\`\`\`javascript
Plot.barY(data, Plot.stackY({x: "date", y: "value", fill: "category"}))
Plot.areaY(data, Plot.stackY({x: "date", y: "value", fill: "series"}))
\`\`\`

### Normalize (Proportions)
\`\`\`javascript
Plot.areaY(data, Plot.normalizeY({x: "date", y: "value", fill: "category"}))
Plot.barY(data, Plot.normalizeY({x: "category", y: "value", fill: "group"}))
\`\`\`

### Filter & Sort
\`\`\`javascript
Plot.dot(data, {x: "x", y: "y", filter: (d) => d.value > 10})
Plot.barY(data, {x: "category", y: "value", sort: {x: "y", reverse: true}})
\`\`\`

## Scales

\`\`\`javascript
Plot.plot({
  x: {type: "log", domain: [1, 1000]},
  y: {type: "sqrt", label: "Square root scale"},
  color: {type: "categorical", scheme: "tableau10"},
  r: {range: [0, 20]}
})
\`\`\`

## Faceting

\`\`\`javascript
Plot.plot({
  facet: {data: data, x: "region", y: "year"},
  marks: [
    Plot.dot(data, {x: "x", y: "y"})
  ]
})
\`\`\`

## Tips & Best Practices

1. **Return the plot**: In Observable notebooks use \`display(Plot.plot({...}))\`; in vanilla JS append to DOM
2. **Data format**: Plot expects arrays of objects with consistent property names (tidy data)
3. **Null handling**: Plot gracefully handles null/undefined values — they're filtered out automatically
4. **Missing data**: Use rect with interval option (not bar) to reveal gaps in time series
5. **Responsive sizing**: Omit width for responsive plots, or use \`style: {maxWidth: "100%"}\`
6. **Performance**: For large datasets, consider binning, sampling, or Apache Arrow tables
7. **Color schemes**: Use \`scheme\` option on color scale (e.g., "tableau10", "blues", "burd")
8. **Accessibility**: Always provide axis labels (\`x: {label: "..."}\`) and legends
9. **Scales are automatic**: Plot infers scale types from data; override with \`type\` option
10. **Layer marks**: Combine multiple marks in \`marks: [...]\` array for rich visualizations
11. **Data types**: Match mark type to data — bar for ordinal, rect for quantitative
12. **Use transforms**: Leverage bin, group, stack, normalize instead of pre-processing data
13. **Interactive tips**: Add \`tip: true\` to any mark for hover details
14. **Conditional marks**: Use \`condition ? mark : null\` to show marks conditionally
15. **Scale overrides**: Force channel to specific scale with \`{value: "field", scale: "color"}\` or \`scale: null\` for literal values

## Common Patterns

### Time Series
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.lineY(data, {x: "date", y: "value", stroke: "series"}),
    Plot.ruleY([0])
  ],
  x: {type: "utc"},
  y: {grid: true}
})
\`\`\`

### Histogram
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.rectY(data, Plot.binX({y: "count"}, {x: "value", fill: "steelblue"}))
  ]
})
\`\`\`

### Box Plot
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.boxX(data, {x: "value", y: "category"})
  ]
})
\`\`\`

### Density Plot
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.density(data, {x: "x", y: "y", fill: "density"})
  ]
})
\`\`\`

## Shorthand & Convenience

Plot supports shorthand notation:
\`\`\`javascript
Plot.lineY([1, 2, 3, 4, 5]) // x = index, y = value
Plot.dot(data.map(d => d.value)) // extract array, x = index, y = identity
\`\`\`

For quick plots, many marks provide sensible defaults and auto-scaling.

## Framework Integration

**React (SSR):**
\`\`\`javascript
Plot.plot({...options, document: new Document()}).toHyperScript()
\`\`\`

**React (Client):**
\`\`\`javascript
useEffect(() => {
  const plot = Plot.plot({marks: [...]});
  containerRef.current.append(plot);
  return () => plot.remove();
}, [data]);
\`\`\`

**Vue, Svelte**: Similar patterns with lifecycle hooks and ref/bind directives

**Node.js**: Use JSDOM for server-side rendering, sharp or Puppeteer for PNG

## Advanced Features

- **Faceting**: Create small multiples with \`facet: {data, x: "field", y: "field2"}\`
- **Projections**: Geographic visualizations with d3-geo projections
- **Interactions**: pointer, tip, crosshair for interactive exploration
- **Legends**: Auto-generated with \`color: {legend: true}\`
- **Custom marks**: Create composite marks with \`Plot.marks(...)\`
- **Markers**: Arrow heads, dots on line ends
- **Curves**: Different interpolation (linear, step, curve, etc.)

I can help you:
- Choose the right marks and transforms for your data
- Understand data type requirements for each mark
- Debug visualization issues (missing data, wrong scales, etc.)
- Optimize performance for large datasets
- Apply best practices for data visualization
- Create custom scales, color schemes, and styles
- Work with complex data transformations
- Integrate Plot with React, Vue, Svelte, or Node.js
- Build interactive visualizations with tips and pointers
- Layer multiple marks for sophisticated charts
- Handle missing or irregular data
`;

interface IPlotExpertParameters {
    query: string;
}

export class PlotExpertTool implements vscode.LanguageModelTool<IPlotExpertParameters> {
    async invoke(options: vscode.LanguageModelToolInvocationOptions<IPlotExpertParameters>, token: vscode.CancellationToken): Promise<vscode.LanguageModelToolResult> {
        reporter?.sendTelemetryEvent("lmTool.invoke", { tool: "plotExpert" });
        const params = options.input;
        if (typeof params.query !== "string" || params.query.trim().length === 0) {
            throw new vscode.LanguageModelError("Query is required", { cause: "invalid_parameters" });
        }

        // Determine which documentation pages to fetch based on query keywords
        const query = params.query.toLowerCase();
        const relevantDocs = this.getRelevantDocPages(query);
        const includeCookbook = this.shouldIncludeCookbook(query);
        const includeMarksCookbook = this.shouldIncludeMarksCookbook(query);
        const includeTransformsCookbook = this.shouldIncludeTransformsCookbook(query);

        let additionalContext = "";
        if (relevantDocs.length > 0) {
            additionalContext = "\n\n## Additional Documentation\n\nFor more detailed information, see:\n";
            for (const doc of relevantDocs) {
                additionalContext += `- [${doc.title}](${doc.url})\n`;
            }
        }

        // Build response content
        let content = PLOT_EXPERTISE + additionalContext;

        // Include cookbook for pattern/example queries
        if (includeCookbook) {
            content += "\n\n" + PLOT_COOKBOOK;
        }

        // Include marks cookbook for mark-specific queries
        if (includeMarksCookbook) {
            content += "\n\n" + MARKS_COOKBOOK;
        }

        // Include transforms cookbook for transform-specific queries
        if (includeTransformsCookbook) {
            content += "\n\n" + TRANSFORMS_COOKBOOK;
        }

        // Return the expertise content with references
        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(content)
        ]);
    }

    private shouldIncludeCookbook(query: string): boolean {
        const cookbookKeywords = [
            "example", "pattern", "how to", "recipe", "cookbook",
            "create", "make", "build", "show me", "sample"
        ];
        return cookbookKeywords.some(keyword => query.includes(keyword));
    }

    private shouldIncludeMarksCookbook(query: string): boolean {
        const marksKeywords = [
            "mark", "marks", "dot", "line", "bar", "area", "rect", "cell",
            "rule", "tick", "text", "arrow", "box", "contour", "density",
            "link", "image", "frame", "geo", "sphere", "graticule",
            "scatterplot", "scatter", "bar chart", "line chart", "area chart",
            "heatmap", "annotation", "reference line"
        ];
        return marksKeywords.some(keyword => query.includes(keyword));
    }

    private shouldIncludeTransformsCookbook(query: string): boolean {
        const transformsKeywords = [
            "transform", "bin", "group", "stack", "normalize", "filter",
            "sort", "reverse", "shuffle", "window", "select", "hexbin",
            "map", "dodge", "tree", "aggregate", "aggregation",
            "histogram", "moving average", "rolling", "stacked", "grouped",
            "binning", "grouping", "filtering", "sorting"
        ];
        return transformsKeywords.some(keyword => query.includes(keyword));
    }

    private getRelevantDocPages(query: string): Array<{ title: string; url: string }> {
        const docs: Array<{ title: string; url: string; keywords: string[] }> = [
            {
                title: "Plot Documentation",
                url: "https://observablehq.com/plot/features/plots",
                keywords: ["plot", "configuration", "options", "width", "height", "margin"]
            },
            {
                title: "Marks Reference",
                url: "https://observablehq.com/plot/features/marks",
                keywords: ["mark", "marks", "dot", "line", "bar", "area", "rect", "cell"]
            },
            {
                title: "Scales Documentation",
                url: "https://observablehq.com/plot/features/scales",
                keywords: ["scale", "scales", "domain", "range", "linear", "log", "color", "axis"]
            },
            {
                title: "Transforms Reference",
                url: "https://observablehq.com/plot/features/transforms",
                keywords: ["transform", "bin", "group", "stack", "normalize", "filter", "sort"]
            },
            {
                title: "Interactions Guide",
                url: "https://observablehq.com/plot/features/interactions",
                keywords: ["interaction", "tip", "pointer", "hover", "crosshair"]
            },
            {
                title: "Facets Documentation",
                url: "https://observablehq.com/plot/features/facets",
                keywords: ["facet", "facets", "small multiples", "fx", "fy"]
            },
            {
                title: "Legends Guide",
                url: "https://observablehq.com/plot/features/legends",
                keywords: ["legend", "legends", "color scale"]
            },
            {
                title: "Dot Mark",
                url: "https://observablehq.com/plot/marks/dot",
                keywords: ["dot", "scatter", "scatterplot", "circle"]
            },
            {
                title: "Line Mark",
                url: "https://observablehq.com/plot/marks/line",
                keywords: ["line", "lineY", "lineX", "time series"]
            },
            {
                title: "Bar Mark",
                url: "https://observablehq.com/plot/marks/bar",
                keywords: ["bar", "barY", "barX", "column", "bar chart"]
            },
            {
                title: "Area Mark",
                url: "https://observablehq.com/plot/marks/area",
                keywords: ["area", "areaY", "areaX", "area chart"]
            },
            {
                title: "Rect Mark",
                url: "https://observablehq.com/plot/marks/rect",
                keywords: ["rect", "rectangle", "heatmap", "histogram"]
            },
            {
                title: "Text Mark",
                url: "https://observablehq.com/plot/marks/text",
                keywords: ["text", "label", "annotation"]
            }
        ];

        return docs
            .filter(doc => doc.keywords.some(keyword => query.includes(keyword)))
            .slice(0, 3); // Limit to top 3 most relevant
    }

    async prepareInvocation(options: vscode.LanguageModelToolInvocationPrepareOptions<IPlotExpertParameters>, _token: vscode.CancellationToken) {
        const queryPreview = options.input.query ? `\n\n${options.input.query.slice(0, 200)}${options.input.query.length > 200 ? "…" : ""}` : "";

        const confirmationMessages = {
            title: "Observable Plot Expert",
            message: new vscode.MarkdownString(
                "Get help with Observable Plot visualizations?" + queryPreview
            ),
        };

        return {
            invocationMessage: "Consulting Observable Plot expert",
            confirmationMessages,
        };
    }
}

