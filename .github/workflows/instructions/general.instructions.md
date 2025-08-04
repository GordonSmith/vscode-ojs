---
applyTo: "**"
---

# GitHub Copilot Instructions

- Use 4 spaces for indentation
- Ensure all code passes ESLint checks (`npm run lint`)
- Fix all lint errors before submitting code
- Use explicit types for all function parameters and return values
- Avoid using `any` unless absolutely necessary
- Organize code into logical modules and folders (e.g., `src/components`, `src/utils`)
- Place tests next to the code they test, using `.test.ts` or `.spec.ts` suffixes
- Use npm for package management
- Keep dependencies up to date and remove unused packages
- Write unit tests for all new features and bug fixes
- Use Jest or Vitest for testing
- Run all tests with `npm test` before pushing changes
- Use feature branches for new work
- Write clear, concise commit messages
- Open a pull request for review before merging to `main`
- Document public functions and components with JSDoc comments
- Update the README and other docs for significant changes
- Store sensitive configuration in `.env` files
- Never commit `.env` or secrets to version control
- Ensure all checks pass (lint, build, test) before merging

---
For questions, contact project maintainers or see CONTRIBUTING.md.