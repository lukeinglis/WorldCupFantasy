import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules", ".factory"],
    coverage: {
      provider: "v8",
      reporter: ["json", "text"],
      include: ["src/data/**/*.ts", "src/lib/**/*.ts"],
      exclude: ["**/__tests__/**", "**/*.test.ts"],
    },
  },
});
