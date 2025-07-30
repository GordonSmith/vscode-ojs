// Test the HTML detection logic
const { isObservableNotebook } = require('./dist/util/htmlNotebookDetector');

// Test content - Observable notebook
const observableContent = `<!doctype html>
<notebook>
    <title>Test Observable Notebook</title>
    <script id="intro" type="text/markdown">
    # Test Notebook
    </script>
    <script id="hello" type="module">
        const message = "Hello from Observable!";
        display(message);
    </script>
</notebook>`;

// Test content - Regular HTML
const regularContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Regular HTML File</title>
</head>
<body>
    <h1>Regular HTML File</h1>
    <p>This is a regular HTML file.</p>
</body>
</html>`;

console.log('Testing HTML detection logic...');
console.log('Observable notebook should be true:', isObservableNotebook && isObservableNotebook(observableContent));
console.log('Regular HTML should be false:', isObservableNotebook && isObservableNotebook(regularContent));
