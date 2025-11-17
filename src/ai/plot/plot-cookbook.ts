/**
 * Observable Plot Cookbook
 * 
 * A curated collection of common visualization patterns and examples.
 * These are practical, battle-tested patterns for creating effective visualizations.
 */

export const PLOT_COOKBOOK = `
# Observable Plot Cookbook

A curated collection of practical visualization patterns and recipes.

## 📊 Basic Chart Patterns

### Simple Bar Chart
\`\`\`javascript
// Vertical bars for categorical data
Plot.plot({
  marks: [
    Plot.barY(data, {x: "category", y: "value", fill: "steelblue"}),
    Plot.ruleY([0])
  ],
  y: {grid: true}
})
\`\`\`

### Grouped Bar Chart
\`\`\`javascript
// Multiple series side-by-side
Plot.plot({
  marks: [
    Plot.barY(data, {
      x: "category",
      y: "value",
      fill: "series",
      fx: "category"  // facet by category
    }),
    Plot.ruleY([0])
  ],
  color: {legend: true}
})
\`\`\`

### Stacked Bar Chart
\`\`\`javascript
// Stack series on top of each other
Plot.plot({
  marks: [
    Plot.barY(data, Plot.stackY({
      x: "category",
      y: "value",
      fill: "series"
    })),
    Plot.ruleY([0])
  ],
  color: {legend: true}
})
\`\`\`

### Histogram with Custom Bins
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.rectY(data, Plot.binX(
      {y: "count"},
      {x: "value", thresholds: 20, fill: "steelblue"}
    )),
    Plot.ruleY([0])
  ],
  x: {label: "Value bins"},
  y: {label: "Frequency", grid: true}
})
\`\`\`

## 📈 Line & Time Series

### Basic Time Series
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.lineY(data, {x: "date", y: "value", stroke: "steelblue"}),
    Plot.ruleY([0])
  ],
  x: {type: "utc"},
  y: {grid: true, label: "Value"}
})
\`\`\`

### Multi-Series Time Series
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.lineY(data, {
      x: "date",
      y: "value",
      stroke: "series",
      strokeWidth: 2
    }),
    Plot.ruleY([0])
  ],
  x: {type: "utc"},
  y: {grid: true},
  color: {legend: true}
})
\`\`\`

### Time Series with Confidence Band
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.areaY(data, {
      x: "date",
      y1: "lower",
      y2: "upper",
      fill: "steelblue",
      fillOpacity: 0.2
    }),
    Plot.lineY(data, {x: "date", y: "mean", stroke: "steelblue"}),
    Plot.ruleY([0])
  ],
  x: {type: "utc"}
})
\`\`\`

### Smoothed Line with Original Data Points
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.dot(data, {x: "x", y: "y", fill: "gray", r: 2}),
    Plot.line(data, {x: "x", y: "y", curve: "catmull-rom", stroke: "red"})
  ]
})
\`\`\`

## 🔵 Scatter & Correlation

### Basic Scatterplot
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.dot(data, {
      x: "x",
      y: "y",
      fill: "category",
      r: 3
    })
  ],
  color: {legend: true},
  grid: true
})
\`\`\`

### Scatterplot with Size Encoding (Bubble Chart)
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.dot(data, {
      x: "gdp",
      y: "lifeExpectancy",
      r: "population",
      fill: "continent",
      fillOpacity: 0.6
    })
  ],
  r: {range: [2, 20]},
  color: {legend: true}
})
\`\`\`

### Scatterplot with Trend Line
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.dot(data, {x: "x", y: "y", fill: "steelblue"}),
    Plot.linearRegressionY(data, {x: "x", y: "y", stroke: "red"})
  ],
  grid: true
})
\`\`\`

### Correlation Matrix (Heatmap)
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.cell(correlations, {
      x: "var1",
      y: "var2",
      fill: "correlation"
    }),
    Plot.text(correlations, {
      x: "var1",
      y: "var2",
      text: (d) => d.correlation.toFixed(2),
      fill: "white"
    })
  ],
  color: {scheme: "RdBu", domain: [-1, 1], legend: true},
  x: {label: null},
  y: {label: null}
})
\`\`\`

## 📦 Distributions

### Box Plot
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.boxY(data, {x: "category", y: "value"})
  ],
  y: {grid: true}
})
\`\`\`

### Violin Plot
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.areaY(data, Plot.binX(
      {y: "count"},
      {x: "value", y: "category", thresholds: 40, curve: "catmull-rom"}
    ))
  ]
})
\`\`\`

### Density Plot
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.density(data, {
      x: "x",
      y: "y",
      fill: "density",
      bandwidth: 20
    })
  ],
  color: {scheme: "YlGnBu"}
})
\`\`\`

### Ridgeline Plot
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.areaY(data, Plot.binX(
      {y: "count"},
      {
        x: "value",
        fy: "category",
        fill: "category",
        curve: "catmull-rom"
      }
    ))
  ],
  fy: {label: null}
})
\`\`\`

## 🗺️ Proportions & Composition

### Pie Chart (via Bar with Polar Projection)
\`\`\`javascript
// Note: Plot doesn't have built-in pie charts
// Use stacked bars with high aspect ratio as alternative
Plot.plot({
  marks: [
    Plot.barX(data, Plot.stackX({
      x: "value",
      fill: "category",
      title: (d) => \`\${d.category}: \${d.value}\`
    }))
  ],
  x: {axis: null},
  color: {legend: true},
  height: 60
})
\`\`\`

### Stacked Area Chart (100%)
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.areaY(data, Plot.stackY(Plot.normalizeY({
      x: "date",
      y: "value",
      fill: "category"
    })))
  ],
  x: {type: "utc"},
  y: {label: "Percentage", tickFormat: "%", grid: true},
  color: {legend: true}
})
\`\`\`

### Treemap
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.cell(data, Plot.treeMap({
      path: "category",
      value: "size",
      fill: "category"
    }))
  ]
})
\`\`\`

## 🎯 Specialized Charts

### Calendar Heatmap
\`\`\`javascript
Plot.plot({
  padding: 0,
  x: {tickFormat: "%b"},
  y: {tickFormat: "%a"},
  marks: [
    Plot.cell(data, {
      x: (d) => d3.utcWeek.count(d3.utcYear(d.date), d.date),
      y: (d) => d.date.getUTCDay(),
      fill: "value",
      inset: 0.5
    })
  ],
  color: {scheme: "YlGnBu"}
})
\`\`\`

### Candlestick Chart (OHLC)
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.ruleX(data, {x: "date", y1: "low", y2: "high"}),
    Plot.barX(data, {
      x: "date",
      y1: "open",
      y2: "close",
      fill: (d) => d.open > d.close ? "red" : "green"
    })
  ],
  x: {type: "utc"}
})
\`\`\`

### Waterfall Chart
\`\`\`javascript
// Compute cumulative values
const cumulative = data.map((d, i, arr) => ({
  ...d,
  start: arr.slice(0, i).reduce((sum, x) => sum + x.value, 0),
  end: arr.slice(0, i + 1).reduce((sum, x) => sum + x.value, 0)
}));

Plot.plot({
  marks: [
    Plot.barY(cumulative, {
      x: "category",
      y1: "start",
      y2: "end",
      fill: (d) => d.value >= 0 ? "green" : "red"
    }),
    Plot.ruleY([0])
  ]
})
\`\`\`

## 🎨 Styling & Customization

### Custom Color Palette
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.barY(data, {x: "category", y: "value", fill: "category"})
  ],
  color: {
    domain: ["A", "B", "C"],
    range: ["#e41a1c", "#377eb8", "#4daf4a"],
    legend: true
  }
})
\`\`\`

### Dark Theme
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.frame({fill: "#1a1a1a"}),
    Plot.lineY(data, {x: "date", y: "value", stroke: "#00ff88"})
  ],
  style: {
    background: "#1a1a1a",
    color: "#ffffff"
  },
  x: {type: "utc"},
  y: {grid: true}
})
\`\`\`

### Annotations
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.lineY(data, {x: "date", y: "value"}),
    Plot.ruleY([threshold], {stroke: "red", strokeDasharray: "4"}),
    Plot.text([{date: midDate, value: threshold}], {
      x: "date",
      y: "value",
      text: ["Threshold"],
      dy: -10,
      fill: "red"
    })
  ]
})
\`\`\`

## 📊 Interactive Features

### Tooltip on Hover
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.dot(data, {
      x: "x",
      y: "y",
      fill: "category",
      tip: true  // Enable automatic tooltips
    })
  ]
})
\`\`\`

### Custom Tooltip Content
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.dot(data, {
      x: "x",
      y: "y",
      fill: "category",
      title: (d) => \`\${d.category}\\nx: \${d.x}\\ny: \${d.y}\`,
      tip: true
    })
  ]
})
\`\`\`

### Clickable Links
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.dot(data, {
      x: "x",
      y: "y",
      fill: "category",
      href: (d) => \`/details/\${d.id}\`,
      target: "_blank"
    })
  ]
})
\`\`\`

## 🔧 Data Transformation Patterns

### Rolling Average
\`\`\`javascript
// Compute rolling average
const window = 7;
const rolled = data.map((d, i, arr) => ({
  ...d,
  average: d3.mean(arr.slice(Math.max(0, i - window + 1), i + 1), x => x.value)
}));

Plot.plot({
  marks: [
    Plot.lineY(data, {x: "date", y: "value", stroke: "gray", strokeOpacity: 0.3}),
    Plot.lineY(rolled, {x: "date", y: "average", stroke: "blue", strokeWidth: 2})
  ]
})
\`\`\`

### Aggregation with Grouping
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.barY(data, Plot.groupX(
      {y: "mean"},  // or "sum", "median", "max", "min"
      {x: "category", y: "value", fill: "category"}
    ))
  ]
})
\`\`\`

### Filtering Before Visualization
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.dot(data, {
      x: "x",
      y: "y",
      fill: "category",
      filter: (d) => d.value > 10 && d.category !== "excluded"
    })
  ]
})
\`\`\`

## 🎯 Best Practice Patterns

### Responsive Width
\`\`\`javascript
// In Observable notebooks
Plot.plot({
  width: Math.min(640, width),  // 'width' is Observable's reactive width
  marks: [...]
})
\`\`\`

### Handling Missing Data
\`\`\`javascript
// Plot automatically filters null/undefined
// To show gaps explicitly in time series, use rect with interval
Plot.plot({
  marks: [
    Plot.rectY(data, {
      x: "date",
      y: "value",
      interval: "day",  // Shows gaps for missing days
      fill: "steelblue"
    })
  ],
  x: {type: "utc"}
})
\`\`\`

### Small Multiples (Faceting)
\`\`\`javascript
Plot.plot({
  facet: {
    data: data,
    x: "region",
    marginRight: 80
  },
  marks: [
    Plot.frame(),
    Plot.lineY(data, {x: "date", y: "value"}),
    Plot.text(data, Plot.selectLast({
      x: "date",
      y: "value",
      text: "region",
      textAnchor: "start",
      dx: 3
    }))
  ],
  x: {type: "utc"}
})
\`\`\`

### Sorted Categories
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.barY(data, {
      x: "category",
      y: "value",
      fill: "steelblue",
      sort: {x: "y", reverse: true}  // Sort by value descending
    })
  ]
})
\`\`\`

## 💡 Performance Tips

### Sampling Large Datasets
\`\`\`javascript
// For very large datasets, sample before plotting
const sampled = data.filter((d, i) => i % 10 === 0);  // Every 10th point

Plot.plot({
  marks: [
    Plot.dot(sampled, {x: "x", y: "y"})
  ]
})
\`\`\`

### Using Apache Arrow for Large Data
\`\`\`javascript
import {tableFromIPC} from "apache-arrow";

const table = await tableFromIPC(fetch("data.arrow"));

Plot.plot({
  marks: [
    Plot.dot(table, {x: "x", y: "y"})
  ]
})
\`\`\`
`;
