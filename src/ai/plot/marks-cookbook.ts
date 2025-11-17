/**
 * Observable Plot Marks Cookbook
 * 
 * Comprehensive guide to all Plot mark types with practical examples.
 * Each mark type includes usage patterns, options, and best practices.
 */

export const MARKS_COOKBOOK = `
# Observable Plot Marks Cookbook

A comprehensive guide to all mark types in Observable Plot.

## 🔵 Dot Mark

Creates circular symbols (scatterplots, bubble charts).

### Basic Dot Plot
\`\`\`javascript
Plot.dot(data, {x: "x", y: "y"})
\`\`\`

### Styled Dots
\`\`\`javascript
Plot.dot(data, {
  x: "x",
  y: "y",
  fill: "category",        // color by category
  stroke: "black",         // outline color
  strokeWidth: 1,
  r: 5,                    // radius in pixels
  fillOpacity: 0.7
})
\`\`\`

### Variable Size (Bubble Chart)
\`\`\`javascript
Plot.dot(data, {
  x: "gdp",
  y: "lifeExpectancy",
  r: "population",         // size encodes data
  fill: "continent"
})
// Configure size scale
Plot.plot({
  r: {range: [2, 20]},     // min and max radius
  marks: [Plot.dot(data, {...})]
})
\`\`\`

### Different Symbols
\`\`\`javascript
Plot.dot(data, {
  x: "x",
  y: "y",
  symbol: "type",          // shape by category
  fill: "type"
})
// Available symbols: circle, cross, diamond, square, star, triangle, wye
\`\`\`

### Hexagon Binning
\`\`\`javascript
Plot.dot(data, Plot.hexbin(
  {r: "count"},
  {x: "x", y: "y", binWidth: 12}
))
\`\`\`

## 📏 Line Mark

Connects data points with line segments (polylines).

### Basic Line
\`\`\`javascript
Plot.line(data, {x: "x", y: "y"})
\`\`\`

### LineY (Implicit Y)
\`\`\`javascript
Plot.lineY(data, {x: "date", y: "value"})
// Equivalent to Plot.line but clearer intent for time series
\`\`\`

### LineX (Implicit X)
\`\`\`javascript
Plot.lineX(data, {x: "value", y: "category"})
// Horizontal orientation
\`\`\`

### Multi-Series Lines
\`\`\`javascript
Plot.lineY(data, {
  x: "date",
  y: "value",
  z: "series",             // separate lines per series
  stroke: "series",        // color by series
  strokeWidth: 2
})
\`\`\`

### Line Styling
\`\`\`javascript
Plot.lineY(data, {
  x: "date",
  y: "value",
  stroke: "steelblue",
  strokeWidth: 3,
  strokeLinecap: "round",  // butt, round, square
  strokeLinejoin: "round", // bevel, miter, round
  strokeDasharray: "4,2",  // dashed line
  curve: "catmull-rom"     // smooth curve
})
\`\`\`

### Curve Options
\`\`\`javascript
// Available curves:
// linear, step, step-after, step-before,
// basis, basis-open, basis-closed,
// bundle, cardinal, cardinal-open, cardinal-closed,
// catmull-rom, catmull-rom-open, catmull-rom-closed,
// monotone-x, monotone-y, natural

Plot.lineY(data, {x: "x", y: "y", curve: "step"})
\`\`\`

### Line with Markers
\`\`\`javascript
Plot.lineY(data, {
  x: "date",
  y: "value",
  stroke: "red",
  marker: "dot",           // add dots at data points
  markerStart: "arrow",    // arrow at start
  markerEnd: "arrow"       // arrow at end
})
\`\`\`

## 📊 Bar Mark

Rectangular bars for categorical data.

### Vertical Bars (barY)
\`\`\`javascript
Plot.barY(data, {x: "category", y: "value"})
\`\`\`

### Horizontal Bars (barX)
\`\`\`javascript
Plot.barX(data, {y: "category", x: "value"})
\`\`\`

### Styled Bars
\`\`\`javascript
Plot.barY(data, {
  x: "category",
  y: "value",
  fill: "category",        // color by category
  fillOpacity: 0.8,
  stroke: "black",
  strokeWidth: 1,
  rx: 4,                   // rounded corners
  inset: 2                 // gap between bars
})
\`\`\`

### Grouped Bars
\`\`\`javascript
Plot.barY(data, {
  x: "category",
  y: "value",
  fill: "group",
  fx: "category"           // facet to create groups
})
\`\`\`

### Bars with Baseline
\`\`\`javascript
Plot.barY(data, {
  x: "category",
  y1: 0,                   // baseline
  y2: "value",             // bar height
  fill: (d) => d.value >= 0 ? "green" : "red"
})
\`\`\`

### Diverging Bars
\`\`\`javascript
Plot.barY(data, {
  x: "category",
  y: "value",
  fill: (d) => d.value >= 0 ? "steelblue" : "coral"
})
\`\`\`

## 📐 Rect Mark

Rectangles for quantitative x and y axes (heatmaps, histograms).

### Basic Rect
\`\`\`javascript
Plot.rect(data, {x: "x", y: "y", fill: "value"})
\`\`\`

### RectY (Vertical Rectangles)
\`\`\`javascript
Plot.rectY(data, {x: "x", y: "y", fill: "steelblue"})
// Commonly used for histograms
\`\`\`

### RectX (Horizontal Rectangles)
\`\`\`javascript
Plot.rectX(data, {x: "x", y: "y", fill: "steelblue"})
\`\`\`

### Heatmap
\`\`\`javascript
Plot.rect(data, {
  x: "hour",
  y: "day",
  fill: "temperature",
  inset: 0.5               // gap between cells
})
\`\`\`

### Styled Rect
\`\`\`javascript
Plot.rect(data, {
  x1: "start", x2: "end",
  y1: "low", y2: "high",
  fill: "category",
  stroke: "white",
  strokeWidth: 1,
  rx: 4,                   // x-radius for rounded corners
  ry: 4                    // y-radius for rounded corners
})
\`\`\`

## 🟦 Cell Mark

Rectangles for ordinal x and y axes (categorical heatmaps).

### Basic Cell
\`\`\`javascript
Plot.cell(data, {x: "category1", y: "category2", fill: "value"})
\`\`\`

### CellX (Horizontal Cells)
\`\`\`javascript
Plot.cellX(data, {x: "category", fill: "value"})
\`\`\`

### CellY (Vertical Cells)
\`\`\`javascript
Plot.cellY(data, {y: "category", fill: "value"})
\`\`\`

### Styled Cell
\`\`\`javascript
Plot.cell(data, {
  x: "x",
  y: "y",
  fill: "value",
  stroke: "white",
  strokeWidth: 2,
  inset: 1,                // gap between cells
  rx: 4                    // rounded corners
})
\`\`\`

## 🔺 Area Mark

Filled areas under or between lines.

### Basic Area
\`\`\`javascript
Plot.areaY(data, {x: "date", y: "value"})
\`\`\`

### Area with Baseline
\`\`\`javascript
Plot.areaY(data, {
  x: "date",
  y1: 0,                   // baseline
  y2: "value",             // top line
  fill: "steelblue",
  fillOpacity: 0.3
})
\`\`\`

### AreaX (Horizontal)
\`\`\`javascript
Plot.areaX(data, {
  x: "value",
  y: "date",
  fill: "steelblue"
})
\`\`\`

### Confidence Band
\`\`\`javascript
Plot.areaY(data, {
  x: "date",
  y1: "lower",             // lower bound
  y2: "upper",             // upper bound
  fill: "steelblue",
  fillOpacity: 0.2
})
\`\`\`

### Area with Curve
\`\`\`javascript
Plot.areaY(data, {
  x: "x",
  y: "y",
  fill: "category",
  curve: "basis"           // smooth curve
})
\`\`\`

## 📏 Rule Mark

Straight lines (reference lines, connectors).

### Vertical Rules (ruleX)
\`\`\`javascript
Plot.ruleX([threshold], {stroke: "red"})
Plot.ruleX(data, {x: "date", stroke: "gray"})
\`\`\`

### Horizontal Rules (ruleY)
\`\`\`javascript
Plot.ruleY([0], {stroke: "black"})
Plot.ruleY(data, {y: "value", stroke: "category"})
\`\`\`

### Styled Rules
\`\`\`javascript
Plot.ruleY([threshold], {
  stroke: "red",
  strokeWidth: 2,
  strokeDasharray: "4,2",  // dashed line
  strokeOpacity: 0.7
})
\`\`\`

### Rules as Connectors
\`\`\`javascript
Plot.ruleX(data, {
  x: "date",
  y1: "low",               // start point
  y2: "high",              // end point
  stroke: "gray"
})
\`\`\`

## ⚊ Tick Mark

Short line segments (for distributions, strip plots).

### Vertical Ticks (tickX)
\`\`\`javascript
Plot.tickX(data, {x: "value", stroke: "steelblue"})
\`\`\`

### Horizontal Ticks (tickY)
\`\`\`javascript
Plot.tickY(data, {y: "value", stroke: "steelblue"})
\`\`\`

### Strip Plot
\`\`\`javascript
Plot.tickX(data, {
  x: "value",
  y: "category",
  stroke: "category",
  strokeOpacity: 0.5
})
\`\`\`

### Styled Ticks
\`\`\`javascript
Plot.tickX(data, {
  x: "value",
  stroke: "steelblue",
  strokeWidth: 2,
  inset: 2                 // offset from axis
})
\`\`\`

## 📝 Text Mark

Text labels and annotations.

### Basic Text
\`\`\`javascript
Plot.text(data, {x: "x", y: "y", text: "label"})
\`\`\`

### Text Styling
\`\`\`javascript
Plot.text(data, {
  x: "x",
  y: "y",
  text: "label",
  fill: "black",
  fontSize: 12,
  fontFamily: "sans-serif",
  fontWeight: "bold",
  fontStyle: "italic",
  textAnchor: "middle",    // start, middle, end
  lineAnchor: "bottom",    // top, middle, bottom
  dx: 0,                   // horizontal offset
  dy: -5                   // vertical offset
})
\`\`\`

### TextX (Vertical Text)
\`\`\`javascript
Plot.textX(data, {x: "value", text: "label"})
\`\`\`

### TextY (Horizontal Text)
\`\`\`javascript
Plot.textY(data, {y: "value", text: "label"})
\`\`\`

### Rotated Text
\`\`\`javascript
Plot.text(data, {
  x: "x",
  y: "y",
  text: "label",
  rotate: 45               // degrees
})
\`\`\`

### Multi-line Text
\`\`\`javascript
Plot.text(data, {
  x: "x",
  y: "y",
  text: "label",
  lineWidth: 20,           // wrap text
  lineHeight: 1.2
})
\`\`\`

### Frame-Anchored Text
\`\`\`javascript
Plot.text(["Title"], {
  frameAnchor: "top",      // top, right, bottom, left, or corners
  fontSize: 20,
  fontWeight: "bold"
})
\`\`\`

## ➡️ Arrow Mark

Arrows and vectors (flow fields, directions).

### Basic Arrow
\`\`\`javascript
Plot.arrow(data, {x1: "x1", y1: "y1", x2: "x2", y2: "y2"})
\`\`\`

### Styled Arrows
\`\`\`javascript
Plot.arrow(data, {
  x1: "startX", y1: "startY",
  x2: "endX", y2: "endY",
  stroke: "category",
  strokeWidth: 2,
  headLength: 10,          // arrow head size
  headAngle: 60,           // arrow head angle
  insetStart: 5,           // offset from start
  insetEnd: 5              // offset from end
})
\`\`\`

### Vector Field
\`\`\`javascript
Plot.arrow(data, {
  x: "x",
  y: "y",
  length: "magnitude",
  rotate: "angle",         // direction in degrees
  stroke: "magnitude"
})
\`\`\`

## 🔲 Vector Mark

For geometric shapes (currently limited, but extensible).

### Basic Vector
\`\`\`javascript
Plot.vector(data, {x: "x", y: "y", length: "len", rotate: "angle"})
\`\`\`

## 📦 Box Mark

Box-and-whisker plots (statistical summaries).

### Vertical Box (boxX)
\`\`\`javascript
Plot.boxX(data, {x: "value", y: "category"})
\`\`\`

### Horizontal Box (boxY)
\`\`\`javascript
Plot.boxY(data, {x: "category", y: "value"})
\`\`\`

### Styled Box
\`\`\`javascript
Plot.boxY(data, {
  x: "category",
  y: "value",
  fill: "category",
  stroke: "black",
  strokeWidth: 1.5
})
\`\`\`

## 🎯 Contour Mark

Density contours and topographic lines.

### Density Contours
\`\`\`javascript
Plot.contour(data, {
  x: "x",
  y: "y",
  fill: "density",
  stroke: "white"
})
\`\`\`

### Styled Contours
\`\`\`javascript
Plot.contour(data, {
  x: "x",
  y: "y",
  fill: "density",
  stroke: "black",
  strokeWidth: 0.5,
  blur: 10                 // smoothing
})
\`\`\`

## 🌡️ Density Mark

2D density estimation.

### Basic Density
\`\`\`javascript
Plot.density(data, {x: "x", y: "y", fill: "density"})
\`\`\`

### Styled Density
\`\`\`javascript
Plot.density(data, {
  x: "x",
  y: "y",
  fill: "density",
  bandwidth: 20,           // smoothing parameter
  fillOpacity: 0.7
})
\`\`\`

## 🔗 Link Mark

Curved or straight lines between points.

### Basic Link
\`\`\`javascript
Plot.link(data, {
  x1: "source_x", y1: "source_y",
  x2: "target_x", y2: "target_y"
})
\`\`\`

### Curved Links
\`\`\`javascript
Plot.link(data, {
  x1: "source_x", y1: "source_y",
  x2: "target_x", y2: "target_y",
  stroke: "category",
  curve: "bump-x"          // curved connection
})
\`\`\`

## 🖼️ Image Mark

Embed images in plots.

### Basic Image
\`\`\`javascript
Plot.image(data, {
  x: "x",
  y: "y",
  src: "imageUrl",
  width: 50,               // image width
  height: 50               // image height
})
\`\`\`

## 🖼️ Frame Mark

Border around plot area.

### Basic Frame
\`\`\`javascript
Plot.frame()
\`\`\`

### Styled Frame
\`\`\`javascript
Plot.frame({
  stroke: "black",
  strokeWidth: 2,
  fill: "none",
  rx: 8,                   // rounded corners
  anchor: "top"            // which sides to draw
})
\`\`\`

## 📏 Axis & Grid Marks

### Axis Marks
\`\`\`javascript
Plot.axisX({anchor: "bottom", label: "X Axis"})
Plot.axisY({anchor: "left", label: "Y Axis"})
\`\`\`

### Grid Marks
\`\`\`javascript
Plot.gridX({stroke: "gray", strokeOpacity: 0.2})
Plot.gridY({stroke: "gray", strokeOpacity: 0.2})
\`\`\`

## 🔄 Geo Marks

For geographic visualizations.

### Geo Mark
\`\`\`javascript
Plot.geo(geojson, {
  fill: "property",
  stroke: "white",
  strokeWidth: 0.5
})
\`\`\`

### Sphere Mark
\`\`\`javascript
Plot.sphere({
  stroke: "currentColor",
  fill: "none"
})
\`\`\`

### Graticule Mark
\`\`\`javascript
Plot.graticule({
  stroke: "gray",
  strokeOpacity: 0.2
})
\`\`\`

## 🎨 Mark Composition

### Combining Multiple Marks
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.frame(),
    Plot.gridY(),
    Plot.ruleY([0]),
    Plot.barY(data, {x: "category", y: "value"}),
    Plot.text(data, {
      x: "category",
      y: "value",
      text: (d) => d.value.toFixed(1),
      dy: -5
    })
  ]
})
\`\`\`

### Creating Composite Marks
\`\`\`javascript
function candlestick(data, options) {
  return Plot.marks(
    Plot.ruleX(data, {x: "date", y1: "low", y2: "high", ...options}),
    Plot.barX(data, {
      x: "date",
      y1: "open",
      y2: "close",
      fill: (d) => d.open > d.close ? "red" : "green",
      ...options
    })
  );
}

Plot.plot({marks: [candlestick(data, {})]})
\`\`\`

## 💡 Mark Best Practices

1. **Choose the right mark for your data type**
   - Bar/Cell for categorical data
   - Rect for quantitative binning
   - Line/Area for continuous/temporal data

2. **Use appropriate orientations**
   - barY: vertical bars (categories on x)
   - barX: horizontal bars (categories on y)

3. **Layer marks effectively**
   - Background elements first (frame, grid)
   - Data marks in the middle
   - Annotations last (text, rules)

4. **Consider accessibility**
   - Use sufficient contrast
   - Provide text alternatives via title
   - Don't rely solely on color

5. **Optimize for perception**
   - Position is most accurate (use x/y)
   - Length is next (use bars)
   - Color for categories, not precise values
   - Size (area) is less accurate

6. **Handle edge cases**
   - Test with null/undefined values
   - Consider zero and negative values
   - Handle empty datasets gracefully
`;
