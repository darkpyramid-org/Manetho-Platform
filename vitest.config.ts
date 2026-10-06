import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Unit tests only. Playwright specs in e2e/ must never be
    // picked up here — they need a running server.
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "node_modules/**",
      ".next/**",
      "playwright-report/**",
      "e2e/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["lib/**", "components/**"],
    },
  },
  resolve: {
    alias: {
      // fileURLToPath avoids the leading-slash problem that
      // URL.pathname produces on Windows ("/C:/...").
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});