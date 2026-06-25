import { test as setup } from "@playwright/test";

/** Senha compartilhada (alinhado a SEED_PASSWORD / seed mínimo Lignum). */
const password =
  process.env.E2E_PASSWORD ?? process.env.E2E_ADMIN_PASSWORD ?? "Teste@123456";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@lignum.local";

setup("autenticar (admin)", async ({ page }) => {
  await page.goto("/login");
  await page.locator("#identifier").fill(adminEmail);
  await page.locator("#password").fill(password);
  await page.locator("#login-submit").click();
  await page.getByRole("heading", { name: "Painel" }).waitFor({ state: "visible", timeout: 30_000 });
  await page.context().storageState({ path: "playwright/.auth/admin.json" });
});
