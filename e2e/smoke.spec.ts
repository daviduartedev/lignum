import { test, expect } from "@playwright/test";

test.describe("Smoke (sessão admin, seed mínimo)", () => {
  test("painel e módulos principais carregam", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();

    await page.goto("/clientes");
    await expect(page.getByRole("heading", { name: /Clientes/i }).first()).toBeVisible();

    await page.goto("/os");
    await expect(page.getByRole("heading", { name: /Ordens de serviço|Ordem de serviço/i }).first()).toBeVisible();

    await page.goto("/configuracoes");
    await expect(page.getByRole("heading", { name: /Configurações/i }).first()).toBeVisible();
  });

  test("leads carrega", async ({ page }) => {
    await page.goto("/leads");
    await expect(page.getByRole("heading", { name: /Leads/i }).first()).toBeVisible();
  });
});
