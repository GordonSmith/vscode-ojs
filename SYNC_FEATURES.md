# Preview Synchronization Features

The Observable HTML preview now stays in sync with your active document and updates in real-time. Here's what's been implemented:

## 🔄 Auto-Sync Features

### 1. **Active Document Tracking**
- The preview automatically switches when you change tabs between HTML files
- Works with any HTML file or `.onb.html` Observable notebooks
- Shows which document is currently being previewed

### 2. **Real-Time Updates**
- Updates preview content as you type (with 500ms debounce)
- No need to save the file to see changes
- Prevents excessive updates during rapid typing

### 3. **Save-Based Updates**
- Still updates immediately when you save a document
- Ensures content is always current after save operations

### 4. **Visual Feedback**
- Preview title shows current filename
- Status indicator shows "🟢 In Sync" 
- Console logs when switching between documents
- File information panel shows current document details

## 🧪 Testing the Sync

### Test Files Created:
- `test-document-a.html` - First test document
- `test-document-b.html` - Second test document with different content

### How to Test:

1. **Open `test-document-a.html`**
2. **Run "Observable Kit: Preview Notebook"** (Ctrl+Shift+P)
3. **Open `test-document-b.html` in a new tab**
4. **Switch between the tabs** - notice the preview updates automatically
5. **Try typing in either document** - see real-time updates (after 500ms pause)
6. **Check the console** for sync status messages

## 🔧 Technical Implementation

### Key Methods Added:

```typescript
// Debounced updates during typing
private debounceUpdate(document: vscode.TextDocument): void

// Switch preview to different document  
private switchToDocument(document: vscode.TextDocument): void

// Enhanced document watching
private setupDocumentWatcher(textDocument: vscode.TextDocument): void
```

### Event Listeners:

1. **`onDidSaveTextDocument`** - Updates on save
2. **`onDidChangeTextDocument`** - Real-time content changes
3. **`onDidChangeActiveTextEditor`** - Active document switching

### Debouncing:
- 500ms timeout prevents excessive updates during typing
- Clears previous timeouts when new changes occur
- Updates immediately on document save

## 🎯 User Experience

### Before:
- Preview only updated on save
- Had to manually re-run preview command for different documents
- No visual feedback about current document

### After:
- ✅ Real-time updates as you type
- ✅ Automatic switching between HTML documents
- ✅ Visual status indicators
- ✅ Consistent preview availability
- ✅ Better performance with debouncing

## 🚀 Expected Behavior

When you:

1. **Switch tabs** → Preview updates automatically
2. **Type in document** → Preview updates after 500ms pause
3. **Save document** → Preview updates immediately  
4. **Open new HTML file** → Preview switches to new file
5. **Close and reopen preview** → Still tracks active document

The preview should always show content from your currently active HTML document and stay synchronized with your edits!

## 🐛 Troubleshooting

If sync isn't working:

1. Check that the file is HTML (`.html` or `.onb.html`)
2. Make sure the preview panel is still open
3. Check VS Code developer console for error messages
4. Try closing and reopening the preview

The sync system is designed to be robust and handle document switching, typing, saving, and error conditions gracefully.
