// Simple test for the constructFunction implementation
const { maybeParseJavaScript } = require("@observablehq/notebook-kit");

// Mock the constructFunction implementation for testing
const evil = new Function("body", "return eval(body)");

function constructFunction(parsed) {
    if (!parsed || !parsed.body) {
        return () => undefined;
    }

    try {
        // Convert AST back to executable code string
        const codeString = astToString(parsed.body);

        // Create a function that can execute this code in the Observable runtime context
        if (parsed.expression) {
            // For expressions, create a function that returns the evaluated expression
            if (parsed.async) {
                return evil(`(async function() { return ${codeString}; })`);
            } else {
                return evil(`(function() { return ${codeString}; })`);
            }
        } else {
            // For statements/programs, create a function that executes the code
            if (parsed.async) {
                return evil(`(async function() { ${codeString} })`);
            } else {
                return evil(`(function() { ${codeString} })`);
            }
        }
    } catch (error) {
        console.error('Error constructing function from AST:', error);
        return () => `Error: ${error.message}`;
    }
}

function astToString(node) {
    if (typeof node === 'string') {
        return node;
    }

    if (!node || typeof node !== 'object') {
        return String(node);
    }

    switch (node.type) {
        case 'Program':
            return node.body.map((stmt) => astToString(stmt)).join(';\n');
        case 'ExpressionStatement':
            return astToString(node.expression);
        case 'Literal':
            return JSON.stringify(node.value);
        case 'Identifier':
            return node.name;
        case 'BinaryExpression':
            return `(${astToString(node.left)} ${node.operator} ${astToString(node.right)})`;
        case 'CallExpression':
            const callee = astToString(node.callee);
            const args = node.arguments.map((arg) => astToString(arg)).join(', ');
            return `${callee}(${args})`;
        case 'MemberExpression':
            const object = astToString(node.object);
            const property = node.computed ? `[${astToString(node.property)}]` : `.${node.property.name}`;
            return `${object}${property}`;
        case 'BlockStatement':
            return `{ ${node.body.map((stmt) => astToString(stmt)).join(';\n')} }`;
        case 'ReturnStatement':
            return `return ${node.argument ? astToString(node.argument) : ''}`;
        case 'VariableDeclaration':
            const declarations = node.declarations.map((decl) =>
                `${decl.id.name}${decl.init ? ' = ' + astToString(decl.init) : ''}`
            ).join(', ');
            return `${node.kind} ${declarations}`;
        case 'AssignmentExpression':
            return `${astToString(node.left)} ${node.operator} ${astToString(node.right)}`;
        default:
            console.warn(`Unsupported AST node type: ${node.type}`);
            return `/* ${node.type} */`;
    }
}

// Test cases
console.log('Testing constructFunction...');

// Test 1: Simple expression
console.log('\n1. Testing simple expression: "42"');
const parsed1 = maybeParseJavaScript("42");
console.log('Parsed:', JSON.stringify(parsed1, null, 2));
if (parsed1) {
    const func1 = constructFunction(parsed1);
    try {
        const result1 = func1();
        console.log('Result:', result1);
        console.log('✓ Test 1 passed');
    } catch (error) {
        console.log('✗ Test 1 failed:', error.message);
    }
}

// Test 2: Simple calculation
console.log('\n2. Testing calculation: "1 + 1"');
const parsed2 = maybeParseJavaScript("1 + 1");
console.log('Parsed:', JSON.stringify(parsed2, null, 2));
if (parsed2) {
    const func2 = constructFunction(parsed2);
    try {
        const result2 = func2();
        console.log('Result:', result2);
        console.log('✓ Test 2 passed');
    } catch (error) {
        console.log('✗ Test 2 failed:', error.message);
    }
}

// Test 3: Variable declaration
console.log('\n3. Testing variable declaration: "const x = 5; x"');
const parsed3 = maybeParseJavaScript("const x = 5; x");
console.log('Parsed:', JSON.stringify(parsed3, null, 2));
if (parsed3) {
    const func3 = constructFunction(parsed3);
    try {
        const result3 = func3();
        console.log('Result:', result3);
        console.log('✓ Test 3 passed');
    } catch (error) {
        console.log('✗ Test 3 failed:', error.message);
    }
}

console.log('\nTesting complete!');
