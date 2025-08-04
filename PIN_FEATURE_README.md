# Pin/Unpin Feature for Observable Notebook Kit

## Overview

This feature adds pin/unpin functionality to Observable Notebook Kit cells in VS Code. Pinned cells are visible in the notebook output, while unpinned cells are hidden.

## Implementation Details

### Commands Added

1. **`observable-kit.cell.pin`** - Pin a cell to make it visible in output
2. **`observable-kit.cell.unpin`** - Unpin a cell to hide it from output

### UI Integration

- Pin icon (`$(pin)`) appears for unpinned cells
- Pinned icon (`$(pinned)`) appears for pinned cells
- Icons are shown in the cell title bar for `onb-notebook-kit` notebook type
- Commands are contextual based on current pin state

### Default Behavior

- JavaScript and Observable JavaScript cells are pinned by default
- Markdown and other cell types are unpinned by default
- Pin state is preserved when saving/loading notebooks

### Serialization

- Pin state is serialized to/from the Observable Notebook Kit HTML format
- Uses the `pinned=""` attribute on `<script>` tags
- Backward compatible with existing notebooks

### Files Modified

1. **`package.json`** - Added commands and menu configurations
2. **`src/notebook-kit/controller/commands.ts`** - Implemented pin/unpin commands
3. **`src/notebook-kit/controller/serializer.ts`** - Enhanced serialization to handle pin state
4. **`samples/notebook-kit/pin-test.html`** - Created test notebook

## Usage

1. Open an Observable Notebook Kit notebook (`.html` file)
2. Switch to notebook view if needed
3. Click the pin/unpin icon in any cell's title bar
4. Pin state will be preserved when saving the notebook

## Testing

Use the `samples/notebook-kit/pin-test.html` file to test the pin functionality.
