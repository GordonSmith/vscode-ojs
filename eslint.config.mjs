// Flat ESLint config migrated from .eslintrc.js for ESLint v9
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";

export default [
    // Ignore generated sources
    {
        ignores: [
            "src/grammar/**/*"
        ]
    },

    // Base JS recommended rules
    js.configs.recommended,

    // TypeScript recommended rules (no type-checking needed)
    ...tseslint.configs.recommended,

    // React Hooks plugin & rules
    // Note: the plugin's exported recommended config is eslintrc-style,
    // so we register the plugin and spread its rules instead of extending it.

    // Project-specific settings and rule overrides
    {
        files: ["**/*.{js,ts,tsx}"],
        plugins: {
            "react-hooks": reactHooks,
            "unused-imports": unusedImports
        },
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.amd,
                dojo: "readonly",
                dijit: "readonly",
                dojoConfig: "readonly",
                debugConfig: "readonly",
                Promise: "readonly"
            }
        },
        rules: {
            // Allow function declarations inside blocks (legacy behavior)
            "no-inner-declarations": "off",
            // React Hooks recommended rules
            ...reactHooks.configs.recommended.rules,
            // Core rule adjustments from legacy config
            "no-redeclare": "off",
            "no-empty": "off",
            "no-empty-pattern": "off",
            "no-constant-condition": "off",
            "no-case-declarations": "off",
            "no-prototype-builtins": "off",
            "no-unused-vars": "off",
            "no-useless-escape": "off",
            "no-unexpected-multiline": "off",
            "no-extra-boolean-cast": "off",
            "no-self-assign": "off",
            // Flag unused imports
            "unused-imports/no-unused-imports": "error",

            "no-multiple-empty-lines": ["error", { max: 1 }],
            "no-console": [1, { allow: ["info", "warn", "error"] }],
            "func-call-spacing": ["error", "never"],
            "space-before-function-paren": ["error", {
                anonymous: "always",
                named: "never",
                asyncArrow: "always"
            }],
            "comma-spacing": ["error", { before: false, after: true }],

            "prefer-rest-params": "off",
            "prefer-spread": "off",

            "semi": ["error", "always"],
            "quotes": ["error", "double", { avoidEscape: true }],

            // TypeScript rule adjustments from legacy config
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/ban-ts-comment": "off",
            "@typescript-eslint/no-inferrable-types": "off",
            "@typescript-eslint/no-empty-function": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-empty-interface": "off",
            "@typescript-eslint/no-this-alias": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/no-namespace": "off",
            "@typescript-eslint/no-var-require": "off",
            "@typescript-eslint/no-unsafe-declaration-merging": "off"
        }
    }
];
