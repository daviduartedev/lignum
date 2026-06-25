import { test, expect } from "@playwright/test";

/** Sem sessão gravada: exercita login pós-credenciais Lignum. */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Login admin (seed mínimo)", () => {
  test("login com credenciais seed abre o painel", async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL ?? "admin@lignum.local";
    const password = process.env.E2E_ADMIN_PASSWORD ?? "Teste@123456";

    await page.goto("/login");
    await page.locator("#identifier").fill(email);
    await page.locator("#password").fill(password);
    await page.locator("#login-submit").click();

    const dialog = page.getByRole("alertdialog", { name: /centro de alertas/i });
    if (await dialog.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.getByRole("button", { name: "Entendi" }).click();
      await expect(dialog).toBeHidden();
    }

    await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible({ timeout: 35_000 });
  });
});
