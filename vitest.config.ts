import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        environment: "jsdom",
        globals: false,
        setupFiles: ["src/helpers/tests/setup.ts"],
        include: ["src/**/*.test.ts", "src/**/*.test.tsx"]
    }
});
