# Observable Notebook Kit 2.0 Support

This directory contains the implementation for Observable Notebook Kit 2.0 support in VS Code.

## Overview

Observable Notebook Kit 2.0 introduces a new HTML-based notebook format that supports:

- **Vanilla JavaScript**: Standard JavaScript syntax with Observable functions
- **Open Format**: Git-friendly HTML format 
- **Modern Imports**: Support for npm, JSR, and local imports
- **Static Site Generation**: Built-in tooling for generating static sites

## File Extensions

Observable Notebook Kit notebooks use specific HTML extensions for proper detection:

- `.okit.html` - Observable Kit HTML notebooks (recommended)
- `.onb.html` - Alternative Observable notebook HTML format

## File Format

Observable Notebook Kit notebooks use HTML format:

```html
<!doctype html>
<notebook>
  <title>My Notebook</title>
  <script id="intro" type="text/markdown">
    # Welcome
    This is markdown content.
  </script>
  <script id="code" type="module">
    // Vanilla JavaScript
    const data = [1, 2, 3];
    display(data);
  </script>
</notebook>
```

## Cell Types

- `text/markdown` - Markdown cells
- `module` - Vanilla JavaScript cells
- `observablejs` - Legacy Observable JavaScript cells
- `text/html` - Raw HTML cells
- `text/css` - CSS style cells

## Features

### Vanilla JavaScript Support

```javascript
// Standard ES modules
import { chart } from "npm:chart.js";

// Display values
const message = "Hello World";
display(message);

// Reactive inputs
const slider = view({
  type: 'range',
  min: 0,
  max: 100,
  value: 50
});
```

### Commands

- **Preview with Notebook Kit**: Preview using Observable Notebook Kit CLI
- **Build Static Site**: Generate static site from notebooks
- **Create New Notebook**: Create new Observable Kit notebook
- **Convert from Legacy**: Convert `.ojsnb` files to HTML format
- **Setup Workspace**: Install and configure Notebook Kit in workspace

## Getting Started

1. Open or create an HTML file with Observable Notebook Kit format (`.okit.html` or `.onb.html`)
2. Use `Ctrl+Shift+P` and search for "Observable Kit" commands
3. Run "Setup Workspace" to install the necessary dependencies
4. Start creating cells with vanilla JavaScript

## Migration

Convert existing `.ojsnb` notebooks to the new format:

1. Open the `.ojsnb` file
2. Run "Convert from Legacy Format" command
3. The `.okit.html` version will be created alongside the original

## Dependencies

The Observable Notebook Kit requires:

```json
{
  "dependencies": {
    "@observablehq/notebook-kit": "^1.0.1"
  }
}
```

This will be automatically added when using the "Setup Workspace" command.
