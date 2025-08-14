---
applyTo: "**"
---

# GitHub Copilot Instructions

- Use 4 spaces for indentation
- Ensure all code passes ESLint checks (`npm run lint`) using the flat config in `eslint.config.mjs` (ESLint v9)
- Fix all lint errors before submitting code
- Use explicit types for all function parameters and return values
- Avoid using `any` unless absolutely necessary
- Organize code into logical modules and folders (e.g., `src/components`, `src/utils`)
- Place tests next to the code they test, using `.test.ts` or `.spec.ts` suffixes
- Use npm for package management
- Keep dependencies up to date and remove unused packages
- Write unit tests for new features and bug fixes when practical
- Prefer Vitest for testing in this repo; if adding tests, add a `vitest`-backed `test` script. Currently `npm test` runs the build.
- Before pushing, ensure `npm run lint` and `npm run build` succeed (and `npm test` if you wire tests)
- Use feature branches for new work
- Write clear, concise commit messages
- Open a pull request for review before merging to `main`
- Document public functions and components with JSDoc comments
- Update the README and other docs for significant changes
- Store sensitive configuration in `.env` files
- Never commit `.env` or secrets to version control
- Ensure all checks pass (lint, build, test) before merging

Repo-specific notes:
- Lint config is flat (no `.eslintrc.*`); update `eslint.config.mjs` if lint rules need changes.
- Build is driven by `esbuild.mjs`; use `npm run build` for a production bundle or `npm run build-ts-watch` for watch mode.
- Type declarations are emitted via `gen-node-types` and `gen-webview-types`; `npm run build` runs them automatically.

---
For questions, contact project maintainers or see CONTRIBUTING.md.