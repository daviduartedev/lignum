import { test, expect } from "@playwright/test";

test.describe("Painel - marcas, resumo mensal e documentação SENATRAN", () => {
  test("painel mostra blocos novos com dados de seed", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Marcas mais vendidas" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Resumo de vendas por mês" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Atenção operacional" })).toBeVisible();
  });

  test("documentação SENATRAN para cliente carrega", async ({ page }) => {
    await page.goto("/documentacao/senatran");
    await expect(page.getByRole("heading", { name: /integração de dados veiculares/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /imprimir ou guardar como pdf/i })).toBeVisible();
  });
});
