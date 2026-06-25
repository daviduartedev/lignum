import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Config dos testes de INTEGRAÇÃO (precisam de DATABASE_URL). Separado da suíte padrão
 * (vitest.config.ts), que exclui tests/integration. Rodar: `npm run test:integration`.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
