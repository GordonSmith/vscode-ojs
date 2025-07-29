import type { RendererContext } from 'vscode-notebook-renderer';

interface ObservableKitOutputData {
    type: 'vanilla-javascript' | 'observable-javascript';
    code: string;
    originalCode?: string;
    cellId?: string;
    notebookId?: string;
}

export function activate(context: RendererContext<any>) {
    return {
        renderOutputItem(data: any, element: HTMLElement) {
            try {
                const outputData = data.json() as ObservableKitOutputData;
                renderObservableKitOutput(outputData, element);
            } catch (error) {
                element.innerHTML = `<div class="error">Error rendering output: ${error}</div>`;
            }
        }
    };
}

function renderObservableKitOutput(data: ObservableKitOutputData, element: HTMLElement) {
    // Clear previous content
    element.innerHTML = '';

    // Create container
    const container = document.createElement('div');
    container.className = 'observable-kit-output';

    if (data.type === 'vanilla-javascript') {
        renderVanillaJavaScript(data, container);
    } else if (data.type === 'observable-javascript') {
        renderObservableJavaScript(data, container);
    }

    element.appendChild(container);
}

function renderVanillaJavaScript(data: ObservableKitOutputData, container: HTMLElement) {
    // Create a sandboxed environment for vanilla JavaScript execution
    const outputDiv = document.createElement('div');
    outputDiv.className = 'js-output';

    // Create a simple display function
    const displayOutputs: any[] = [];

    const sandboxContext = {
        display: (value: any) => {
            displayOutputs.push(value);
        },
        view: (viewSpec: any) => {
            // Create reactive input
            return createReactiveInput(viewSpec, outputDiv);
        },
        console: {
            log: (...args: any[]) => {
                const logDiv = document.createElement('div');
                logDiv.className = 'console-log';
                logDiv.textContent = args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');
                outputDiv.appendChild(logDiv);
            }
        },
        document: document,
        window: window
    };

    try {
        // Execute the transformed code in the sandbox context
        const func = new Function(
            ...Object.keys(sandboxContext),
            `
            return (async () => {
                ${data.code}
            })();
            `
        );

        const result = func(...Object.values(sandboxContext));

        // Handle promises
        if (result && typeof result.then === 'function') {
            result.then((value: any) => {
                if (value !== undefined) {
                    displayOutputs.push(value);
                }
                renderDisplayOutputs(displayOutputs, outputDiv);
            }).catch((error: any) => {
                renderError(error, outputDiv);
            });
        } else {
            if (result !== undefined) {
                displayOutputs.push(result);
            }
            renderDisplayOutputs(displayOutputs, outputDiv);
        }

    } catch (error) {
        renderError(error, outputDiv);
    }

    container.appendChild(outputDiv);
}

function renderObservableJavaScript(data: ObservableKitOutputData, container: HTMLElement) {
    // For Observable JavaScript, we'll need to integrate with the Observable runtime
    // This is a simplified version - in practice, you'd use @observablehq/runtime

    const outputDiv = document.createElement('div');
    outputDiv.className = 'ojs-output';

    // For now, display the code and indicate it's Observable JS
    const codeDiv = document.createElement('pre');
    codeDiv.className = 'ojs-code';
    codeDiv.textContent = data.code;

    const labelDiv = document.createElement('div');
    labelDiv.className = 'ojs-label';
    labelDiv.textContent = 'Observable JavaScript (requires Observable runtime)';

    outputDiv.appendChild(labelDiv);
    outputDiv.appendChild(codeDiv);
    container.appendChild(outputDiv);
}

function renderDisplayOutputs(outputs: any[], container: HTMLElement) {
    outputs.forEach(output => {
        const outputElement = document.createElement('div');
        outputElement.className = 'display-output';

        if (typeof output === 'string') {
            outputElement.textContent = output;
        } else if (typeof output === 'number') {
            outputElement.textContent = String(output);
        } else if (typeof output === 'object') {
            if (Array.isArray(output)) {
                renderArray(output, outputElement);
            } else if (output instanceof HTMLElement) {
                outputElement.appendChild(output);
            } else {
                renderObject(output, outputElement);
            }
        } else {
            outputElement.textContent = String(output);
        }

        container.appendChild(outputElement);
    });
}

function renderArray(array: any[], container: HTMLElement) {
    // Simple table rendering for arrays
    if (array.length === 0) {
        container.textContent = '[]';
        return;
    }

    // Check if it's an array of objects (table-like data)
    if (typeof array[0] === 'object' && array[0] !== null && !Array.isArray(array[0])) {
        renderTable(array, container);
    } else {
        const list = document.createElement('ul');
        array.forEach(item => {
            const listItem = document.createElement('li');
            listItem.textContent = typeof item === 'object' ? JSON.stringify(item) : String(item);
            list.appendChild(listItem);
        });
        container.appendChild(list);
    }
}

function renderTable(data: any[], container: HTMLElement) {
    const table = document.createElement('table');
    table.className = 'data-table';

    if (data.length > 0) {
        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const keys = Object.keys(data[0]);

        keys.forEach(key => {
            const th = document.createElement('th');
            th.textContent = key;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create body
        const tbody = document.createElement('tbody');
        data.forEach(row => {
            const tr = document.createElement('tr');
            keys.forEach(key => {
                const td = document.createElement('td');
                const value = row[key];
                td.textContent = typeof value === 'object' ? JSON.stringify(value) : String(value);
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
    }

    container.appendChild(table);
}

function renderObject(obj: any, container: HTMLElement) {
    const pre = document.createElement('pre');
    pre.className = 'json-output';
    pre.textContent = JSON.stringify(obj, null, 2);
    container.appendChild(pre);
}

function createReactiveInput(viewSpec: any, container: HTMLElement): any {
    // Create a simple reactive input based on the view specification
    const inputDiv = document.createElement('div');
    inputDiv.className = 'reactive-input';

    if (typeof viewSpec === 'string') {
        // Simple text input
        const input = document.createElement('input');
        input.type = 'text';
        input.value = viewSpec;
        inputDiv.appendChild(input);
    } else if (viewSpec && typeof viewSpec === 'object') {
        // More complex input specification
        if (viewSpec.type === 'range') {
            const input = document.createElement('input');
            input.type = 'range';
            input.min = String(viewSpec.min || 0);
            input.max = String(viewSpec.max || 100);
            input.value = String(viewSpec.value || 50);
            inputDiv.appendChild(input);
        } else if (viewSpec.type === 'select') {
            const select = document.createElement('select');
            (viewSpec.options || []).forEach((option: string) => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                select.appendChild(optionElement);
            });
            inputDiv.appendChild(select);
        }
    }

    container.appendChild(inputDiv);
    return inputDiv;
}

function renderError(error: any, container: HTMLElement) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = `Error: ${error.message || error}`;
    container.appendChild(errorDiv);
}
