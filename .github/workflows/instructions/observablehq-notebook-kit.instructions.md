# Observable Notebook Kit Integration Instructions

## Overview

This document provides comprehensive instructions for integrating Observable Notebook Kit 2.0 support into the VS Code Observable JS extension. The goal is to add support for the new open Observable Notebook file format (.html) alongside the existing custom `.ojsnb` format.

## Background

### Observable Notebook Kit 2.0

Observable has released **Notebook Kit 2.0** as part of their technology preview, introducing:

- **Open file format**: HTML-based notebook format that's human-readable and git-friendly
- **Vanilla JavaScript**: Standard JavaScript syntax instead of Observable JavaScript dialect
- **Static site generation**: Built-in support for generating static sites from notebooks
- **Modern tooling**: Vite-based build system and CLI tools

### Repository Information

- **GitHub Repository**: https://github.com/observablehq/notebook-kit
- **Documentation**: https://observablehq.com/notebook-kit/
- **Package**: `@observablehq/notebook-kit` (npm)
- **Current Version**: 1.0.1+ (check latest)

### Observable Notebook 2.0 File Format

The new format is HTML-based with this structure:

```html
<!doctype html>
<notebook>
  <title>Notebook Title</title>
  <script id="1" type="text/markdown">
    # Markdown Content
  </script>
  <script id="2" type="module" pinned>
    // Vanilla JavaScript code
    const data = [1, 2, 3];
    display(data);
  </script>
  <script id="3" type="observablejs">
    // Observable JavaScript (backwards compatibility)
    oldStyleCell = "legacy syntax"
  </script>
</notebook>
```

Key characteristics:
- Root `<notebook>` element
- Optional `<title>` element
- Each cell is a `<script>` element with unique `id`
- Cell types defined by `type` attribute:
  - `text/markdown` - Markdown cells
  - `module` - Vanilla JavaScript cells  
  - `observablejs` - Observable JavaScript cells (backwards compatibility)
- Optional `pinned` attribute for pinned cells
- HTML format enables syntax highlighting and git diffs

## Current Extension Architecture

The VS Code Observable JS extension currently supports:

1. **Custom Notebook Format** (`.ojsnb`): XML-based format with `<VSCode.Cell>` elements
2. **Language Support**: 
   - `ojs` - Observable JavaScript files
   - `omd` - Observable Markdown files
3. **VS Code Notebook API**: Full integration with notebook serializers, controllers, and renderers

### Existing Components

- **Notebook Serializer**: `src/notebook/controller/serializer.ts`
- **Notebook Controller**: `src/notebook/controller/controller.ts` 
- **Renderer**: Custom renderer for Observable JavaScript execution
- **Language Grammars**: TextMate grammars for syntax highlighting

## Implementation Tasks

### Phase 1: File Format Support

#### 1.1 Add New File Association

**File**: `package.json`

Add HTML notebook support to the existing notebook contribution:

```json
{
  "notebooks": [
    {
      "id": "ojs-notebook",
      "type": "ojs-notebook", 
      "displayName": "OJS Notebook",
      "selector": [
        {
          "filenamePattern": "*.ojsnb"
        },
        {
          "filenamePattern": "*.html",
          "excludeFilePatterns": ["**/node_modules/**", "**/dist/**", "**/build/**"]
        }
      ]
    }
  ]
}
```

**Note**: Use `excludeFilePatterns` to avoid conflicts with regular HTML files.

#### 1.2 Enhance Notebook Serializer

**File**: `src/notebook/controller/serializer.ts`

Extend the serializer to handle both formats:

```typescript
class MultiFormatSerializer implements vscode.NotebookSerializer {
  
  async deserializeNotebook(content: Uint8Array, token: vscode.CancellationToken): Promise<vscode.NotebookData> {
    const contentStr = Buffer.from(content).toString('utf8');
    
    // Detect format
    if (contentStr.includes('<notebook>')) {
      return this.deserializeObservableKitFormat(contentStr);
    } else {
      return this.deserializeVSCodeFormat(contentStr); // existing logic
    }
  }

  async serializeNotebook(data: vscode.NotebookData, token: vscode.CancellationToken): Promise<Uint8Array> {
    // Determine format based on file extension or metadata
    const format = this.detectOutputFormat(data);
    
    if (format === 'observable-kit') {
      return this.serializeToObservableKitFormat(data);
    } else {
      return this.serializeToVSCodeFormat(data); // existing logic
    }
  }

  private deserializeObservableKitFormat(content: string): vscode.NotebookData {
    // Parse HTML notebook format
    // Extract <script> elements and convert to VS Code cells
  }

  private serializeToObservableKitFormat(data: vscode.NotebookData): Uint8Array {
    // Convert VS Code cells to Observable Kit HTML format
  }
}
```

#### 1.3 HTML Parsing Logic

Create utility functions to parse the Observable Notebook Kit format:

```typescript
interface ObservableNotebookCell {
  id: string;
  type: 'text/markdown' | 'module' | 'observablejs';
  content: string;
  pinned?: boolean;
}

interface ObservableNotebook {
  title?: string;
  cells: ObservableNotebookCell[];
}

function parseObservableNotebook(html: string): ObservableNotebook {
  // Use HTML parser (e.g., jsdom or custom parsing)
  // Extract title and script elements
  // Return structured notebook data
}

function generateObservableNotebook(notebook: ObservableNotebook): string {
  // Generate HTML in Observable Notebook Kit format
  // Include proper DOCTYPE and structure
}
```

#### 1.4 Cell Type Mapping

Define mapping between Observable Kit cell types and VS Code cell languages:

```typescript
const CELL_TYPE_MAPPING = {
  // Observable Kit -> VS Code
  'text/markdown': 'markdown',
  'module': 'javascript', // or 'ojs' based on content analysis
  'observablejs': 'ojs',
  
  // VS Code -> Observable Kit (reverse mapping)
  'markdown': 'text/markdown',
  'javascript': 'module',
  'ojs': 'observablejs'
};
```

### Phase 2: Enhanced Language Support

#### 2.1 Vanilla JavaScript Support

The new format supports vanilla JavaScript with Observable-specific functions like `display()` and `view()`. 

**File**: `src/notebook/controller/controller.ts`

Enhance execution logic to handle vanilla JavaScript:

```typescript
class EnhancedController {
  
  private async executeVanillaJavaScript(cell: vscode.NotebookCell): Promise<void> {
    // Transform vanilla JS with display/view functions to Observable-compatible code
    // Handle import statements
    // Execute using existing Observable runtime
  }
  
  private transformVanillaJS(code: string): string {
    // Transform ES modules imports to Observable-compatible format
    // Handle display() calls
    // Handle view() calls for reactive inputs
    return transformedCode;
  }
}
```

#### 2.2 Import Statement Handling

Support for standard ES module imports:

```typescript
function transformImports(code: string): string {
  // Transform: import { chart } from "npm:chart.js"
  // To Observable-compatible: const chart = require("chart.js@4")
  
  // Support various import patterns:
  // - npm: prefix for npm packages
  // - jsr: prefix for JSR packages  
  // - observable: prefix for Observable notebooks
  // - local file imports
}
```

### Phase 3: Tooling Integration

#### 3.1 Observable Notebook Kit CLI Integration

Add commands to integrate with Notebook Kit tooling:

**File**: `package.json`

```json
{
  "commands": [
    {
      "category": "Observable",
      "command": "observable.kit.preview",
      "title": "Preview with Notebook Kit",
      "description": "Preview notebook using Observable Notebook Kit"
    },
    {
      "category": "Observable", 
      "command": "observable.kit.build",
      "title": "Build Static Site",
      "description": "Build static site using Notebook Kit"
    }
  ]
}
```

**Implementation**: `src/commands/notebook-kit.ts`

```typescript
export class NotebookKitCommands {
  
  static async preview(uri: vscode.Uri): Promise<void> {
    // Run: notebooks preview --root <directory>
    // Open in VS Code simple browser or external browser
  }
  
  static async build(uri: vscode.Uri): Promise<void> {
    // Run: notebooks build --root <directory>
    // Show build output in terminal
  }
  
  private static async runNotebookKitCommand(args: string[]): Promise<void> {
    // Execute CLI command with proper error handling
    // Show progress indicators
    // Handle output
  }
}
```

#### 3.2 Package.json Integration

Detect and suggest Notebook Kit setup in workspace:

```typescript
export class WorkspaceSetup {
  
  static async checkNotebookKitSetup(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {
    // Check if @observablehq/notebook-kit is installed
    // Check for proper scripts in package.json
    // Offer to set up if missing
  }
  
  static async initializeNotebookKit(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {
    // Add dependency to package.json
    // Add build/preview scripts
    // Create basic configuration
  }
}
```

### Phase 4: User Experience Enhancements

#### 4.1 File Format Migration

Provide migration tools between formats:

```typescript
export class FormatMigration {
  
  static async migrateToObservableKit(sourceUri: vscode.Uri): Promise<void> {
    // Convert .ojsnb to Observable Kit HTML format
    // Preserve cell structure and metadata
    // Handle format-specific differences
  }
  
  static async migrateFromObservableKit(sourceUri: vscode.Uri): Promise<void> {
    // Convert Observable Kit HTML to .ojsnb format
    // Map cell types appropriately
  }
}
```

#### 4.2 Format Detection and Suggestions  

Smart format detection and user guidance:

```typescript
export class FormatDetection {
  
  static detectOptimalFormat(notebook: vscode.NotebookDocument): 'ojsnb' | 'observable-kit' {
    // Analyze cell types and content
    // Consider user preferences
    // Return recommended format
  }
  
  static async suggestFormatMigration(notebook: vscode.NotebookDocument): Promise<void> {
    // Show informational messages about format benefits
    // Offer migration options
  }
}
```

#### 4.3 Syntax Highlighting Enhancements

Update TextMate grammars to support new features:

**File**: `syntaxes/observable-kit.tmLanguage.json`

Create grammar for vanilla JavaScript with Observable extensions:

```json
{
  "scopeName": "source.js.observable-kit",
  "patterns": [
    {
      "include": "source.js"
    },
    {
      "name": "support.function.observable",
      "match": "\\b(display|view)\\b"
    }
  ]
}
```

### Phase 5: Testing and Validation

#### 5.1 Test Cases

Create comprehensive test suite:

```typescript
// Test format conversion
describe('Observable Kit Format', () => {
  test('should parse HTML notebook correctly', () => {
    // Test HTML parsing
  });
  
  test('should serialize to HTML format', () => {
    // Test HTML generation
  });
  
  test('should handle vanilla JavaScript cells', () => {
    // Test vanilla JS execution
  });
  
  test('should migrate between formats', () => {
    // Test format migration
  });
});
```

#### 5.2 Sample Notebooks

Create sample notebooks in the new format:

**File**: `samples/QuickStart-NotebookKit.html`

```html
<!doctype html>
<notebook>
  <title>Observable Notebook Kit Quick Start</title>
  <script id="intro" type="text/markdown">
    # Welcome to Observable Notebook Kit

    This notebook demonstrates the new HTML-based format.
  </script>
  <script id="vanilla-js" type="module">
    // Vanilla JavaScript with Observable functions
    const data = Array.from({length: 10}, (_, i) => ({
      x: i,
      y: Math.random() * 100
    }));
    
    display(data);
  </script>
</notebook>
```

## Configuration and Settings

Add settings for format preferences:

**File**: `package.json`

```json
{
  "contributes": {
    "configuration": {
      "properties": {
        "observable.defaultNotebookFormat": {
          "type": "string",
          "enum": ["ojsnb", "observable-kit"],
          "default": "ojsnb",
          "description": "Default format for new notebooks"
        },
        "observable.kit.autoDetect": {
          "type": "boolean",
          "default": true,
          "description": "Automatically detect Observable Kit HTML notebooks"
        }
      }
    }
  }
}
```

## Dependencies

Add required dependencies:

```json
{
  "dependencies": {
    "@observablehq/notebook-kit": "^1.0.1",
    "jsdom": "^22.0.0"
  },
  "devDependencies": {
    "@types/jsdom": "^22.0.0"
  }
}
```

## Migration Strategy

1. **Backwards Compatibility**: Maintain full support for existing `.ojsnb` format
2. **Progressive Enhancement**: Add Observable Kit support as additional feature
3. **User Choice**: Allow users to choose preferred format
4. **Migration Tools**: Provide conversion utilities
5. **Documentation**: Update README and documentation

## Success Criteria

1. **Format Support**: Successfully open, edit, and save Observable Kit HTML notebooks
2. **Execution**: Vanilla JavaScript cells execute correctly with display/view functions
3. **Tooling**: Integration with Notebook Kit CLI commands
4. **Migration**: Seamless conversion between formats
5. **Performance**: No degradation in existing functionality
6. **Documentation**: Comprehensive user documentation and examples

## Resources and References

- **Observable Notebook Kit Docs**: https://observablehq.com/notebook-kit/
- **GitHub Repository**: https://github.com/observablehq/notebook-kit
- **System Guide**: https://observablehq.com/notebook-kit/system-guide
- **Gallery Examples**: https://observablehq.com/notebook-kit/#gallery
- **VS Code Notebook API**: https://code.visualstudio.com/api/extension-guides/notebook

## Implementation Notes

- Use TypeScript for type safety
- Follow existing code patterns and architecture
- Maintain compatibility with VS Code Notebook API
- Handle edge cases gracefully (malformed HTML, missing elements)
- Provide clear error messages and user feedback
- Consider performance implications of HTML parsing
- Test with various notebook sizes and complexity levels

This integration will position the VS Code Observable JS extension as a comprehensive tool for both legacy Observable notebooks and the new open Observable Notebook Kit format, providing users with flexibility and modern tooling capabilities.
