import { test, expect } from "@playwright/test";

const password = process.env.E2E_PASSWORD ?? process.env.E2E_ADMIN_PASSWORD ?? "Teste@123456";

const profiles = [
  { email: "admin@lignum.local", heading: "Painel" },
  { email: "vendedor@lignum.local", heading: "Painel" },
  { email: "financeiro@lignum.local", heading: "Painel" },
  { email: "producao@lignum.local", heading: "Painel" },
] as const;

test.describe("Smoke RBAC — login por perfil (0629)", () => {
  for (const profile of profiles) {
    test(`login ${profile.email}`, async ({ page }) => {
      await page.goto("/login");
      await page.locator("#identifier").fill(profile.email);
      await page.locator("#password").fill(password);
      await page.locator("#login-submit").click();
      await expect(page.getByRole("heading", { name: profile.heading })).toBeVisible({ timeout: 30_000 });
    });
  }

  test("vendedor não acede configurações (redirect)", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#identifier").fill("vendedor@lignum.local");
    await page.locator("#password").fill(password);
    await page.locator("#login-submit").click();
    await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible({ timeout: 30_000 });
    await page.goto("/configuracoes/usuarios");
    await expect(page.getByRole("heading", { name: "Usuários" })).not.toBeVisible();
  });
});
