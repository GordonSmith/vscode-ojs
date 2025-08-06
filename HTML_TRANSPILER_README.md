# HTML Transpiler for Observable JS

This new feature adds transpilation capabilities to the HTML preview functionality in the Observable JS extension.

## Features

### HtmlTranspiler Class

The `HtmlTranspiler` class (`src/notebook-kit/htmlTranspiler.ts`) provides:

1. **Script Processing**: Converts Observable JS script blocks to executable JavaScript
2. **Style Processing**: Handles CSS transformations (optional)
3. **Comment Processing**: Can preserve or remove HTML comments
4. **Custom Transformers**: Extensible system for adding custom transpilation logic
5. **Observable Runtime Integration**: Automatically injects Observable runtime dependencies

### Integration with HtmlPreview

The `HtmlPreview` class now:
- Uses the transpiler to process HTML content before rendering
- Automatically injects Observable runtime dependencies
- Provides configuration methods for transpiler options
- Maintains transpiler state across document updates

## Usage

### Opening HTML Preview with Transpilation

1. Open an HTML file containing Observable JS code
2. Use the Command Palette (`Ctrl+Shift+P`) and run "Observable Kit: Preview Notebook"
3. The HTML will be transpiled and rendered with Observable runtime support

### Configuring Transpiler Options

1. With an HTML preview open, use "Observable Kit: Configure HTML Transpiler" command
2. Toggle options:
   - **Scripts**: Enable/disable script processing
   - **Styles**: Enable/disable style processing  
   - **Comments**: Preserve or remove HTML comments

## Supported Observable JS Syntax

The transpiler currently recognizes:

1. **Script blocks with Observable type**:
   ```html
   <script type="observable">
   data = [1, 2, 3, 4, 5]
   </script>
   ```

2. **Observable code blocks in pre elements**:
   ```html
   <pre class="observable">
   {
     return data.map(d => d * 2);
   }
   </pre>
   ```

## Example HTML File

```html
<!DOCTYPE html>
<html>
<head>
    <title>Observable Example</title>
</head>
<body>
    <h1>My Observable Dashboard</h1>
    
    <script type="observable">
    data = [
        {name: "Alice", value: 10},
        {name: "Bob", value: 20},
        {name: "Charlie", value: 15}
    ]
    </script>
    
    <script type="observable">
    import {table} from "@observablehq/inputs"
    viewof selection = table(data)
    </script>
    
    <pre class="observable">
    {
        const total = data.reduce((sum, d) => sum + d.value, 0);
        return `Total: ${total}`;
    }
    </pre>
</body>
</html>
```

## Technical Details

### Build Configuration

The transpiler is built as a separate ESM module (`html-transpiler.js`) that can be imported by other components.

### Extension Points

The `TranspileOptions` interface allows for:
- Enabling/disabling different types of processing
- Adding custom transformation functions
- Configuring Observable runtime behavior

### Observable Runtime Integration

The transpiler automatically:
- Injects Observable runtime from CDN
- Sets up module structure for Observable cells
- Handles variable scoping and reactivity

## Development

To modify the transpiler:

1. Edit `src/notebook-kit/htmlTranspiler.ts`
2. Run the build process: `npm run build-ts-dev`
3. Test with the preview functionality

### Adding Custom Transformers

```typescript
const transpiler = new HtmlTranspiler({
    customTransformers: [
        (html) => html.replace(/my-custom-syntax/g, 'transformed-content')
    ]
});
```

## Future Enhancements

Planned improvements:
- Integration with @observablehq/parser for proper syntax parsing
- Support for Observable imports and file attachments
- Enhanced error handling and debugging
- Custom cell renderers and inspectors
- Hot reloading during development
