import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Testes de integração (precisam de DATABASE_URL) ficam fora da suíte padrão.
    // Rodar com: `npx vitest run tests/integration`.
    exclude: ["**/node_modules/**", "tests/integration/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
