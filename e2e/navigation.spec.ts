import { test, expect } from "@playwright/test";

test.describe("Navegação principal (admin)", () => {
  test("clientes e contratos carregam", async ({ page }) => {
    await page.goto("/clientes");
    await expect(page.getByRole("heading", { name: /Clientes/i }).first()).toBeVisible();
    await page.goto("/contratos");
    await expect(page.getByRole("heading", { name: /Contratos/i }).first()).toBeVisible();
  });

  test("OS, garantias e notificações carregam", async ({ page }) => {
    await page.goto("/os");
    await expect(page.getByRole("heading", { name: /Ordens de serviço|Ordem de serviço/i }).first()).toBeVisible();
    await page.goto("/garantias");
    await expect(page.getByRole("heading", { name: /Garantias/i }).first()).toBeVisible();
    await page.goto("/notificacoes");
    await expect(page.getByRole("heading", { name: /Notificações/i }).first()).toBeVisible();
  });

  test("configurações, usuários e doc SENATRAN carregam", async ({ page }) => {
    await page.goto("/configuracoes");
    await expect(page.getByRole("heading", { name: /Configurações/i }).first()).toBeVisible();
    await page.goto("/configuracoes/usuarios");
    await expect(page.getByRole("heading", { name: "Usuários" })).toBeVisible();
    await page.goto("/documentacao/senatran");
    await expect(page.getByRole("heading", { name: /SENATRAN/i }).first()).toBeVisible();
  });

  test("leads carrega", async ({ page }) => {
    await page.goto("/leads");
    await expect(page.getByRole("heading", { name: /Leads/i }).first()).toBeVisible();
  });
});

test.describe("Rotas removidas do produto", () => {
  test("cadastro público não está disponível", async ({ page }) => {
    const response = await page.goto("/cadastro");
    expect(response?.status()).toBe(404);
  });

  test("plataforma multi-loja não está disponível", async ({ page }) => {
    const response = await page.goto("/plataforma/lojas");
    expect(response?.status()).toBe(404);
  });
});
