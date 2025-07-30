// Simple test for the DOM polyfill
// This simulates what @observablehq/notebook-kit serialize.js does

// Import the polyfill (this would normally be done by importing from the transpiled JS)
// For this test, we'll just test the concepts

console.log('Testing DOM polyfill functionality...');

// Test 1: Basic document operations
console.log('\n1. Testing document.createElement:');
if (typeof document !== 'undefined') {
    const script = document.createElement('script');
    script.id = 'test-script';
    script.type = 'module';
    script.textContent = 'console.log("hello");';

    console.log('Created script element:');
    console.log('- id:', script.id);
    console.log('- type:', script.type);
    console.log('- textContent:', script.textContent);
    console.log('- outerHTML:', script.outerHTML);

    // Test appendChild
    const notebook = document.createElement('notebook');
    notebook.appendChild(script);
    console.log('- notebook.innerHTML:', notebook.innerHTML);
} else {
    console.log('Document not available - polyfill not loaded');
}

// Test 2: DOMParser
console.log('\n2. Testing DOMParser:');
try {
    const parser = new DOMParser();
    const testHTML = `<!doctype html>
<notebook theme="air">
  <title>Test Notebook</title>
  <script id="1" type="module">
    console.log("Hello world");
  </script>
</notebook>`;

    const doc = parser.parseFromString(testHTML, 'text/html');
    console.log('Parsed document successfully');

    // Test querySelector
    if (typeof doc.querySelector === 'function') {
        const title = doc.querySelector('title');
        console.log('- title found:', title ? title.textContent : 'null');

        const script = doc.querySelector('script');
        console.log('- script id:', script ? script.id : 'null');
        console.log('- script type:', script ? script.type : 'null');

        // Test querySelectorAll
        const scripts = doc.querySelectorAll('script');
        console.log('- scripts found:', scripts.length);
    } else {
        console.log('querySelector not available on parsed document');
    }
} catch (error) {
    console.error('DOMParser test failed:', error.message);
}

console.log('\nDOM polyfill test complete');
