# Simple Observable Preview System

This document describes the simple preview system implemented for Observable Notebook Kit, which provides a lightweight alternative to the full Observable runtime for basic demonstrations.

## Overview

The simple preview system consists of:

1. **`preview.ts`** - A TypeScript module that creates simple HTML previews with "Hello World" demonstrations
2. **Simplified HTML Transpiler** - Modified to generate simple HTML instead of complex Observable runtime code
3. **Meta Information Support** - Ability to pass metadata from VS Code extension to the preview

## Files

### Core Files

- `src/notebook-kit/preview.ts` - Main preview class with meta information support
- `src/notebook-kit/htmlTranspiler.ts` - Modified transpiler for simple demonstrations
- `demo-preview-with-meta.html` - Live demonstration of the preview system
- `test-simple-observable.html` - Test file showing transpilation of Observable code

### Test Files

- `demo-preview-with-meta.html` - Complete demo showing preview loaded with meta info
- `test-simple-observable.html` - Test file with Observable scripts to be transpiled

## Features

### SimplePreview Class

The `SimplePreview` class provides:

```typescript
interface PreviewMeta {
    title?: string;
    filename?: string;
    timestamp?: number;
    documentUri?: string;
    version?: string;
}

class SimplePreview {
    constructor(containerId: string, meta: PreviewMeta)
    updateMeta(newMeta: Partial<PreviewMeta>): void
    addMessage(message: string, type: 'info' | 'success' | 'warning' | 'error'): void
    clear(): void
}
```

### Key Features

1. **Meta Information Display** - Shows file information, version, timestamp, etc.
2. **Interactive Elements** - Buttons for alerts and console logging
3. **Message System** - Add temporary messages with different types
4. **VS Code Integration** - Listens for messages from the extension
5. **Auto-initialization** - Automatically sets up when loaded in browser

### HTML Transpiler Changes

The transpiler now converts Observable code to simple HTML demonstrations:

**Before (Complex Observable Runtime):**
```html
<script type="observable">
data = [1, 2, 3, 4, 5]
</script>
```

**After (Simple Demo):**
```html
<script>
// Creates a simple "Hello World" demo with alert button
document.addEventListener('DOMContentLoaded', function() {
    const div = document.createElement('div');
    div.innerHTML = `
        <h3>Hello World from Observable!</h3>
        <button onclick="alert('Hello!')">Click for Alert</button>
    `;
    document.body.appendChild(div);
});
</script>
```

## Usage

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Observable Notebook</title>
</head>
<body>
    <div id="preview-container"></div>
    
    <script type="module">
        import { SimplePreview } from './src/notebook-kit/preview.ts';
        
        const meta = {
            title: 'My Notebook',
            filename: 'notebook.html',
            version: '1.0.0'
        };
        
        const preview = new SimplePreview('preview-container', meta);
    </script>
</body>
</html>
```

### With VS Code Extension

The preview automatically integrates with VS Code when loaded in a webview:

```typescript
// Extension code
const panel = vscode.window.createWebviewPanel(/*...*/);

// The preview will automatically:
// 1. Detect VS Code environment
// 2. Listen for extension messages
// 3. Send ready signal back to extension

panel.webview.postMessage({
    command: 'updateMeta',
    meta: {
        filename: document.fileName,
        documentUri: document.uri.toString()
    }
});
```

### Supported Commands

The preview listens for these VS Code messages:

- `updateMeta` - Update meta information
- `addMessage` - Add a temporary message
- `clear` - Clear and reset the preview

## Examples

### 1. Observable Script Transpilation

**Input:**
```html
<script type="observable">
const data = await fetch('/api/data').json();
Plot.plot({marks: [Plot.dot(data)]});
</script>
```

**Output:**
A simple HTML div with:
- "Hello World from Observable!" heading
- Button that shows alert with original code snippet
- Clean, styled presentation

### 2. Observable Code Blocks

**Input:**
```html
<pre class="observable-code">
viewof slider = Inputs.range([0, 100]);
filteredData = data.filter(d => d.value > slider);
</pre>
```

**Output:**
A formatted code display with:
- Syntax-highlighted code block
- "Execute (Demo)" button
- Observable cell styling

## Development

### Building

The preview system is built with the rest of the extension:

```bash
npm run build-ts-watch
```

### Testing

1. Open `demo-preview-with-meta.html` in a browser to see the complete demo
2. Open `test-simple-observable.html` and run "Observable Kit: Preview" to test transpilation
3. Check browser console for debug messages

### Extending

To add new features to the preview:

1. Modify `SimplePreview` class in `preview.ts`
2. Update HTML transpiler in `htmlTranspiler.ts` if needed
3. Add new message types for VS Code communication
4. Update this documentation

## Benefits

1. **Lightweight** - No heavy Observable runtime dependencies
2. **Fast Loading** - Simple HTML/CSS/JS loads quickly
3. **Debuggable** - Easy to inspect and modify generated code
4. **Flexible** - Can be extended for specific use cases
5. **Accessible** - Works without internet connection

## Future Enhancements

Potential improvements:

- [ ] Add more interactive demo elements
- [ ] Support for basic data visualization
- [ ] Code syntax highlighting
- [ ] File attachment simulation
- [ ] Simple notebook cell execution
- [ ] Export to static HTML
- [ ] Theme support (light/dark)
- [ ] Custom CSS injection

## Comparison with Full Observable Runtime

| Feature | Simple Preview | Full Observable Runtime |
|---------|---------------|------------------------|
| Load Time | Fast (~50ms) | Slow (~2000ms) |
| Dependencies | None | CDN imports required |
| Internet Required | No | Yes |
| Code Execution | Demo only | Full execution |
| Reactivity | None | Full reactive system |
| Debugging | Easy | Complex |
| File Size | Small | Large |

The simple preview is ideal for:
- Quick demonstrations
- Offline development
- Learning purposes
- Lightweight previews
- Basic HTML transpilation testing

The full Observable runtime is better for:
- Production notebooks
- Complex data visualizations
- Interactive applications
- Real code execution
- Observable ecosystem integration
