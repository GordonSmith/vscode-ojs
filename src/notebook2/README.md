# Observable Notebook Kit 2.0 Support

This directory contains the implementation for Observable Notebook Kit 2.0 support in VS Code.

## Overview

Observable Notebook Kit 2.0 introduces a new HTML-based notebook format that supports:

- **Vanilla JavaScript**: Standard JavaScript syntax with Observable functions
- **Open Format**: Git-friendly HTML format 
- **Modern Imports**: Support for npm, JSR, and local imports
- **Static Site Generation**: Built-in tooling for generating static sites

## File Extensions

Observable Notebook Kit notebooks use a specific HTML extension for VS Code integration:

- `.onb.html` - Observable notebook extension for VS Code (automatically opens as notebook)

**Important**: Regular `.html` files are opened in the text editor by default. The extension automatically detects if an HTML file contains Observable notebook structure and offers to open it or convert it.

## Converting HTML Files

If you have Observable notebook content in a regular `.html` file:

1. **Automatic Detection**: When you open a `.html` file containing Observable notebook structure, you'll get a notification asking if you want to open it as a notebook
2. **Temporary Opening**: Use "Observable Kit: Open HTML as Observable Notebook" to create a temporary `.onb.html` file and open as notebook
3. **Permanent Conversion**: Use "Observable Kit: Convert HTML to Observable Notebook" to permanently rename the file to `.onb.html`

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
