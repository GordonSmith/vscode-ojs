// Simple test script to verify HTML detection logic
const fs = require('fs');
const path = require('path');

function isObservableNotebook(content) {
    // Must have both doctype and notebook element to be an Observable notebook
    const hasDoctype = /<!doctype\s+html>/i.test(content);
    const hasNotebookElement = /<notebook\b[^>]*>/i.test(content);

    if (!hasDoctype || !hasNotebookElement) {
        return false;
    }

    // Check for Observable-specific script types
    const scriptTypePattern = /<script[^>]+type\s*=\s*["']?(text\/markdown|observablejs|module)["']?[^>]*>/gi;
    const hasObservableScripts = scriptTypePattern.test(content);

    return hasObservableScripts;
}

// Test with the existing files
console.log('Testing HTML detection logic...');

// Test Observable notebook file
if (fs.existsSync('test-observable-notebook.html')) {
    const observableContent = fs.readFileSync('test-observable-notebook.html', 'utf8');
    console.log('Observable notebook file detected:', isObservableNotebook(observableContent));
    console.log('First few lines:', observableContent.split('\n').slice(0, 3).join('\n'));
}

// Test regular HTML file
if (fs.existsSync('test-regular.html')) {
    const regularContent = fs.readFileSync('test-regular.html', 'utf8');
    console.log('Regular HTML file detected:', isObservableNotebook(regularContent));
    console.log('First few lines:', regularContent.split('\n').slice(0, 3).join('\n'));
}
