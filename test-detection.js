// Quick test of HTML detection logic
import * as fs from 'fs';
import * as path from 'path';

function isObservableNotebook(content) {
    // Check if it has the <!doctype html> declaration and <notebook> element
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

// Test with both files
const observableFile = path.join(__dirname, 'test-observable-notebook.html');
const regularFile = path.join(__dirname, 'test-regular.html');

if (fs.existsSync(observableFile)) {
    const observableContent = fs.readFileSync(observableFile, 'utf8');
    console.log('Observable file detected:', isObservableNotebook(observableContent));
}

if (fs.existsSync(regularFile)) {
    const regularContent = fs.readFileSync(regularFile, 'utf8');
    console.log('Regular file detected:', isObservableNotebook(regularContent));
}
