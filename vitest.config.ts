import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["src/**/*.test.ts"],
        exclude: [
            "test/**",
            "dist/**",
            "dist-test/**",
            "refs/**",
            "node_modules/**"
        ],
        environment: "node",
        passWithNoTests: true
    }
});
