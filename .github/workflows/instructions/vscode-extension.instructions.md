---
applyTo: "**"
---

# GitHub Copilot Instructions for VS Code Extension Projects

> **Note:** These instructions are in addition to the [general project instructions](.github/instructions/general.instructions.md). If there is any overlap, follow the general instructions and refer to this file for VS Code extension–specific requirements.

- Implement and document the `activate` and `deactivate` functions in `extension.ts`
- Dispose of all resources on deactivation
- Register all commands in `package.json` under `contributes.commands`
- Document each command with a clear description
- Document public functions, classes, and extension APIs with JSDoc comments
- Include usage instructions and examples in the README
- Validate that the extension builds and runs in the VS Code Extension Host

**Useful Links:**
- [VS Code API Reference](https://code.visualstudio.com/api/references/vscode-api)
- [VS Code Extension Authoring Guide](https://code.visualstudio.com/api/get-started/your-first-extension)
- [VS Code Extension Samples](https://github.com/microsoft/vscode-extension-samples)

For questions, contact project maintainers or see CONTRIBUTING.md.
