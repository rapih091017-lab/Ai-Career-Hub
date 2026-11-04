import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // Next default tsconfig uses jsx: "preserve" which vite:import-analysis
  // cannot parse — force the automatic runtime so .tsx test files work.
  esbuild: {
    jsx: "automatic",
  },
  oxc: {
    jsx: { runtime: "automatic" },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup-globals.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // Tooling skill (gstack) & node_modules tidak boleh ikut ter-scan sebagai test
    exclude: ["node_modules/**", ".agents/**", "skills/**", "scripts/**", "pdf-server/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
