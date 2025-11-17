# Observable Plot AI Tools

This directory contains AI tools for helping users with Observable Plot visualizations.

## Architecture

### Main Tool: `plot-tool.ts` (parent directory)

The main Observable Plot expert tool that:
- Provides core Plot documentation and concepts
- Dynamically references relevant official documentation based on query keywords
- Includes the cookbook for pattern/example-based queries
- Registered as `observable-plot-expert` in VS Code

**Triggers on:** Mentions of "chart", "graph", "plot", or visualization-related terms

### Cookbooks

#### `plot-cookbook.ts`
A curated collection of practical visualization patterns and recipes including:
- Basic chart patterns (bar, line, scatter, etc.)
- Time series patterns
- Distribution visualizations
- Specialized charts (heatmaps, candlesticks, etc.)
- Styling and customization examples
- Interactive features
- Performance optimization patterns

#### `marks-cookbook.ts`
Comprehensive guide to all Plot mark types (20+ marks) with practical examples:
- Core marks (dot, line, bar, rect, cell, area, rule, tick, text, arrow)
- Statistical marks (box, contour, density)
- Geometric marks (vector, link, image, frame)
- Geographic marks (geo, sphere, graticule)
- Mark composition patterns and best practices

#### `transforms-cookbook.ts`
Comprehensive guide to Plot transforms (70+ examples):
- Statistical transforms (bin, group, stack)
- Data transformation (map, filter, sort, reverse, shuffle)
- Aggregation and smoothing (window, normalize)
- Sampling and reduction (select, hexbin)
- Layout transforms (dodge, tree, centroid)
- Transform chaining and custom reducers

Cookbooks are included automatically based on query keywords:
- **General patterns**: "example", "pattern", "how to", "recipe", "create", "make", "build", "show me"
- **Marks**: "mark", "marks", "dot", "line", "bar", "area", "rect", "cell", etc.
- **Transforms**: "transform", "bin", "group", "stack", "filter", "sort", "normalize", etc.

## How It Works

1. **Query Analysis**: When invoked, the tool analyzes the user's query for relevant keywords

2. **Content Assembly**: Based on the query, the tool assembles a response containing:
   - Core Plot expertise (always included)
   - References to official documentation (matched by keywords)
   - Cookbook patterns (when examples are requested)

3. **Dynamic References**: Instead of copying all documentation, the tool provides links to:
   - Official Plot documentation pages
   - Specific mark type references
   - Feature guides (scales, transforms, interactions, etc.)

## Benefits of This Approach

- **Copyright Compliant**: References official docs rather than copying them
- **Always Current**: Users get pointed to the latest documentation
- **Focused**: Only includes relevant content based on the query
- **Practical**: Cookbook provides battle-tested patterns
- **Maintainable**: Easier to update curated examples than full documentation

## Extending the Tools

To add more specialized tools:

1. Create new tool files in this directory (e.g., `plot-scales-tool.ts`)
2. Register them in `../index.ts`
3. Add appropriate tags in `package.json`
4. Update this README

Example specialized tools could include:
- `plot-marks-tool.ts` - Deep dive into mark types
- `plot-scales-tool.ts` - Scale configuration specialist
- `plot-transforms-tool.ts` - Data transformation expert
- `plot-geo-tool.ts` - Geographic visualization specialist
