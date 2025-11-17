/**
 * Observable Plot Transforms Cookbook
 * 
 * Comprehensive guide to all Plot transforms with practical examples.
 * Transforms derive new data or modify channels before rendering.
 */

export const TRANSFORMS_COOKBOOK = `
# Observable Plot Transforms Cookbook

A comprehensive guide to data transforms in Observable Plot.

## 📊 Statistical Transforms

### Bin Transform

Groups continuous data into discrete bins (histograms).

#### Basic Histogram
\`\`\`javascript
Plot.rectY(data, Plot.binX({y: "count"}, {x: "value"}))
\`\`\`

#### Custom Bin Width
\`\`\`javascript
Plot.rectY(data, Plot.binX(
  {y: "count"},
  {x: "value", thresholds: 20}  // number of bins
))
\`\`\`

#### Explicit Thresholds
\`\`\`javascript
Plot.rectY(data, Plot.binX(
  {y: "count"},
  {x: "value", thresholds: [0, 10, 20, 50, 100]}
))
\`\`\`

#### BinY (Horizontal Histogram)
\`\`\`javascript
Plot.rectX(data, Plot.binY({x: "count"}, {y: "value"}))
\`\`\`

#### Bin with Different Reducers
\`\`\`javascript
// Sum instead of count
Plot.rectY(data, Plot.binX({y: "sum"}, {x: "age", y: "amount"}))

// Mean
Plot.rectY(data, Plot.binX({y: "mean"}, {x: "age", y: "score"}))

// Median
Plot.rectY(data, Plot.binX({y: "median"}, {x: "age", y: "income"}))

// Min/Max
Plot.rectY(data, Plot.binX({y: "max"}, {x: "date", y: "temperature"}))

// Multiple outputs
Plot.rectY(data, Plot.binX(
  {y: "count", fill: "mean"},
  {x: "value", fill: "score"}
))
\`\`\`

#### 2D Binning (Heatmap)
\`\`\`javascript
Plot.rect(data, Plot.bin(
  {fill: "count"},
  {x: "x", y: "y", thresholds: 30}
))
\`\`\`

### Group Transform

Groups discrete data (aggregations by category).

#### Basic Group
\`\`\`javascript
Plot.barY(data, Plot.groupX({y: "count"}, {x: "category"}))
\`\`\`

#### Group by Multiple Channels
\`\`\`javascript
Plot.barY(data, Plot.groupX(
  {y: "sum"},
  {x: "category", y: "value"}
))
\`\`\`

#### GroupY (Horizontal)
\`\`\`javascript
Plot.barX(data, Plot.groupY({x: "count"}, {y: "category"}))
\`\`\`

#### Group with Different Reducers
\`\`\`javascript
// Average by category
Plot.barY(data, Plot.groupX({y: "mean"}, {x: "category", y: "value"}))

// Multiple aggregations
Plot.barY(data, Plot.groupX(
  {y: "mean", title: "count"},
  {x: "category", y: "value"}
))
\`\`\`

#### 2D Grouping
\`\`\`javascript
Plot.cell(data, Plot.group(
  {fill: "count"},
  {x: "category1", y: "category2"}
))
\`\`\`

#### Group with Filter
\`\`\`javascript
Plot.barY(data, Plot.groupX(
  {y: "count", filter: (d) => d.length > 5},
  {x: "category"}
))
\`\`\`

### Stack Transform

Stacks series vertically (stacked bar/area charts).

#### Stacked Bar Chart
\`\`\`javascript
Plot.barY(data, Plot.stackY({
  x: "category",
  y: "value",
  fill: "series"
}))
\`\`\`

#### Stacked Area Chart
\`\`\`javascript
Plot.areaY(data, Plot.stackY({
  x: "date",
  y: "value",
  fill: "series"
}))
\`\`\`

#### StackY2 (Stacked from Middle)
\`\`\`javascript
Plot.barY(data, Plot.stackY2({
  x: "category",
  y: "value",
  fill: "series"
}))
\`\`\`

#### Normalized Stack
\`\`\`javascript
Plot.barY(data, Plot.stackY({
  x: "category",
  y: "value",
  fill: "series",
  offset: "normalize"  // percentages
}))
\`\`\`

#### Stack Orders
\`\`\`javascript
// Different ordering strategies
Plot.stackY({..., order: "value"})       // by value
Plot.stackY({..., order: "sum"})         // by sum
Plot.stackY({..., order: "appearance"})  // by appearance
Plot.stackY({..., order: "inside-out"})  // inside-out
Plot.stackY({..., order: null})          // data order
\`\`\`

#### Stack Offsets
\`\`\`javascript
Plot.stackY({..., offset: "normalize"})  // percentages (0 to 1)
Plot.stackY({..., offset: "center"})     // centered (streamgraph)
Plot.stackY({..., offset: "wiggle"})     // wiggle (streamgraph)
Plot.stackY({..., offset: null})         // zero baseline
\`\`\`

#### StackX (Horizontal Stack)
\`\`\`javascript
Plot.barX(data, Plot.stackX({
  y: "category",
  x: "value",
  fill: "series"
}))
\`\`\`

## 🔄 Data Transformation

### Map Transform

Apply a function to each datum.

#### Basic Map
\`\`\`javascript
Plot.dot(data, Plot.map({
  x: (d) => d.x * 2,
  y: (d) => Math.log(d.y)
}, {x: "x", y: "y"}))
\`\`\`

#### Map with Derived Channels
\`\`\`javascript
Plot.dot(data, Plot.map({
  fill: (d) => d.value > 100 ? "high" : "low",
  r: (d) => Math.sqrt(d.area)
}, {x: "x", y: "y"}))
\`\`\`

### Filter Transform

Filter data based on a predicate.

#### Basic Filter
\`\`\`javascript
Plot.dot(data, Plot.filter(
  (d) => d.value > 50,
  {x: "x", y: "y"}
))
\`\`\`

#### Filter with Multiple Conditions
\`\`\`javascript
Plot.dot(data, Plot.filter(
  (d) => d.value > 50 && d.category === "A",
  {x: "x", y: "y"}
))
\`\`\`

#### Filter Nulls
\`\`\`javascript
Plot.dot(data, Plot.filter(
  (d) => d.x != null && d.y != null,
  {x: "x", y: "y"}
))
\`\`\`

### Sort Transform

Sort data before rendering.

#### Sort by Channel
\`\`\`javascript
Plot.barY(data, Plot.sort("y", {x: "category", y: "value"}))
\`\`\`

#### Sort Descending
\`\`\`javascript
Plot.barY(data, Plot.sort({y: "descending"}, {x: "category", y: "value"}))
\`\`\`

#### Sort by Multiple Fields
\`\`\`javascript
Plot.barY(data, Plot.sort({
  x: "ascending",
  y: "descending"
}, {x: "category", y: "value"}))
\`\`\`

#### Sort with Custom Comparator
\`\`\`javascript
Plot.barY(data, Plot.sort(
  (a, b) => a.custom - b.custom,
  {x: "category", y: "value"}
))
\`\`\`

### Reverse Transform

Reverse the order of data.

#### Basic Reverse
\`\`\`javascript
Plot.barY(data, Plot.reverse({x: "category", y: "value"}))
\`\`\`

### Shuffle Transform

Randomly shuffle data order.

#### Basic Shuffle
\`\`\`javascript
Plot.dot(data, Plot.shuffle({x: "x", y: "y"}))
\`\`\`

## 📈 Aggregation & Smoothing

### Window Transform

Apply rolling window operations.

#### Moving Average
\`\`\`javascript
Plot.lineY(data, Plot.windowY(
  {k: 7, reduce: "mean"},  // 7-day moving average
  {x: "date", y: "value"}
))
\`\`\`

#### Rolling Sum
\`\`\`javascript
Plot.lineY(data, Plot.windowY(
  {k: 30, reduce: "sum"},
  {x: "date", y: "value"}
))
\`\`\`

#### Other Window Reducers
\`\`\`javascript
// Available: mean, median, min, max, sum, deviation, variance
Plot.windowY({k: 5, reduce: "median"}, {...})
\`\`\`

#### Window with Anchor
\`\`\`javascript
Plot.windowY(
  {k: 7, reduce: "mean", anchor: "start"},  // start, middle, end
  {x: "date", y: "value"}
)
\`\`\`

#### WindowX (Horizontal)
\`\`\`javascript
Plot.lineX(data, Plot.windowX(
  {k: 5, reduce: "mean"},
  {x: "value", y: "category"}
))
\`\`\`

### Normalize Transform

Normalize data to a specified basis.

#### Normalize by First Value
\`\`\`javascript
Plot.lineY(data, Plot.normalizeY({
  basis: "first",
  x: "date",
  y: "value"
}))
\`\`\`

#### Normalize by Sum
\`\`\`javascript
Plot.barY(data, Plot.normalizeY({
  basis: "sum",
  x: "category",
  y: "value"
}))
\`\`\`

#### Other Normalize Bases
\`\`\`javascript
// Available: first, last, min, max, mean, median, sum, deviation, variance
Plot.normalizeY({basis: "mean"}, {...})
\`\`\`

#### NormalizeX (Horizontal)
\`\`\`javascript
Plot.barX(data, Plot.normalizeX({basis: "sum"}, {y: "category", x: "value"}))
\`\`\`

## 🎲 Sampling & Reduction

### Select Transform

Select specific data points.

#### Select First
\`\`\`javascript
Plot.dot(data, Plot.selectFirst({x: "category", y: "value"}))
\`\`\`

#### Select Last
\`\`\`javascript
Plot.dot(data, Plot.selectLast({x: "category", y: "value"}))
\`\`\`

#### Select Min/Max by Y
\`\`\`javascript
Plot.dot(data, Plot.selectMinY({x: "category", y: "value"}))
Plot.dot(data, Plot.selectMaxY({x: "category", y: "value"}))
\`\`\`

#### Select Min/Max by X
\`\`\`javascript
Plot.dot(data, Plot.selectMinX({x: "value", y: "category"}))
Plot.dot(data, Plot.selectMaxX({x: "value", y: "category"}))
\`\`\`

### Hexbin Transform

2D hexagonal binning.

#### Basic Hexbin
\`\`\`javascript
Plot.dot(data, Plot.hexbin(
  {r: "count"},
  {x: "x", y: "y"}
))
\`\`\`

#### Hexbin with Custom Bin Width
\`\`\`javascript
Plot.dot(data, Plot.hexbin(
  {r: "count", fill: "mean"},
  {x: "x", y: "y", fill: "z", binWidth: 10}
))
\`\`\`

## 🔗 Linked & Derived Data

### Tree Transform

Hierarchical layouts (tree, treemap, partition).

#### Treemap
\`\`\`javascript
Plot.rect(data, Plot.tree({
  path: "path",            // "/" separated hierarchy
  value: "size",
  fill: "category"
}))
\`\`\`

### Centroid Transform

Calculate centroids of grouped data.

#### Basic Centroid
\`\`\`javascript
Plot.text(data, Plot.centroid(
  {text: "name"},
  Plot.geoCentroid({geometry: "geometry"})
))
\`\`\`

### Geo Transforms

Geographic projections and centroids.

#### GeoCentroid
\`\`\`javascript
Plot.dot(geojson.features, Plot.geoCentroid())
\`\`\`

## 🎯 Dodging & Layout

### Dodge Transform

Prevent overlapping (beeswarm, strip plots).

#### DodgeY (Avoid Vertical Overlap)
\`\`\`javascript
Plot.dot(data, Plot.dodgeY({x: "category", r: 3}))
\`\`\`

#### DodgeX (Avoid Horizontal Overlap)
\`\`\`javascript
Plot.dot(data, Plot.dodgeX({y: "category", r: 3}))
\`\`\`

#### Dodge with Padding
\`\`\`javascript
Plot.dot(data, Plot.dodgeY({
  x: "category",
  r: 3,
  padding: 1               // space between dots
}))
\`\`\`

## 🔧 Advanced Transforms

### Hull Transform

Convex hull around points.

#### Basic Hull
\`\`\`javascript
Plot.hull(data, {x: "x", y: "y", fill: "category"})
\`\`\`

### Voronoi Transform

Voronoi tessellation.

#### Basic Voronoi
\`\`\`javascript
Plot.voronoi(data, {x: "x", y: "y", fill: "value"})
\`\`\`

#### Voronoi Mesh
\`\`\`javascript
Plot.voronoiMesh(data, {x: "x", y: "y", stroke: "currentColor"})
\`\`\`

## 🔄 Chaining Transforms

### Multiple Transforms
\`\`\`javascript
// Filter, then bin
Plot.rectY(
  data,
  Plot.binX(
    {y: "count"},
    Plot.filter(
      (d) => d.value > 0,
      {x: "value"}
    )
  )
)
\`\`\`

### Complex Transform Chain
\`\`\`javascript
// Filter → Sort → Window
Plot.lineY(
  data,
  Plot.windowY(
    {k: 7, reduce: "mean"},
    Plot.sort(
      "x",
      Plot.filter(
        (d) => d.value != null,
        {x: "date", y: "value"}
      )
    )
  )
)
\`\`\`

## 📋 Custom Transforms

### Creating a Custom Transform
\`\`\`javascript
function customTransform(options) {
  return Plot.map({
    y: (Y) => Y.map((y) => /* transform y */),
    fill: (Fill) => Fill.map((f) => /* transform fill */)
  }, options);
}

Plot.dot(data, customTransform({x: "x", y: "y"}))
\`\`\`

## 🎨 Transform Patterns

### Histogram with Density Overlay
\`\`\`javascript
Plot.plot({
  marks: [
    Plot.rectY(data, Plot.binX({y: "count"}, {x: "value"})),
    Plot.lineY(data, Plot.binX(
      {y: "count", curve: "basis"},
      {x: "value", stroke: "red"}
    ))
  ]
})
\`\`\`

### Grouped and Stacked
\`\`\`javascript
Plot.barY(data, Plot.stackY(Plot.groupX(
  {y: "sum"},
  {x: "category", y: "value", fill: "series"}
)))
\`\`\`

### Moving Average with Confidence Band
\`\`\`javascript
Plot.plot({
  marks: [
    // Raw data
    Plot.lineY(data, {x: "date", y: "value", strokeOpacity: 0.2}),
    // Moving average
    Plot.lineY(data, Plot.windowY(
      {k: 7, reduce: "mean"},
      {x: "date", y: "value", stroke: "blue"}
    )),
    // Confidence band
    Plot.areaY(data, Plot.windowY(
      {k: 7, reduce: (values) => {
        const mean = d3.mean(values);
        const std = d3.deviation(values);
        return [mean - std, mean + std];
      }},
      {x: "date", y: "value", fillOpacity: 0.2}
    ))
  ]
})
\`\`\`

## 🔍 Transform Reducers

### Available Reducers for Bin/Group
\`\`\`javascript
// Count
{y: "count"}

// Statistics
{y: "sum"}
{y: "mean"}
{y: "median"}
{y: "min"}
{y: "max"}
{y: "deviation"}
{y: "variance"}

// Quantiles
{y: "p25"}  // 25th percentile
{y: "p50"}  // median
{y: "p75"}  // 75th percentile

// Selection
{y: "first"}
{y: "last"}

// Set operations
{y: "distinct"}  // count distinct values

// Multiple outputs
{y: "mean", title: "count", fill: "max"}
\`\`\`

### Custom Reducer
\`\`\`javascript
Plot.binX({
  y: (values) => d3.sum(values.filter((d) => d > 0))
}, {x: "category", y: "value"})
\`\`\`

## 💡 Transform Best Practices

1. **Order matters in chaining**
   - Filter before binning/grouping (better performance)
   - Sort before windowing (meaningful results)

2. **Choose the right transform**
   - Bin for continuous → discrete
   - Group for discrete aggregations
   - Stack for part-to-whole relationships

3. **Consider performance**
   - Filter early to reduce data
   - Use bin instead of group for large datasets
   - Cache transformed data if reused

4. **Handle edge cases**
   - Check for null/undefined values
   - Use filter to exclude invalid data
   - Test with empty groups/bins

5. **Combine transforms thoughtfully**
   - Stack + Normalize for percentage stacked charts
   - Window + Filter for outlier detection
   - Bin + Map for custom aggregations

6. **Use appropriate reducers**
   - Count for frequency
   - Mean for central tendency
   - Median for skewed distributions
   - Min/Max for ranges

7. **Document complex transforms**
   - Add comments explaining the pipeline
   - Break into named functions for clarity
   - Test each stage independently
`;
