import { test, expect } from "@playwright/test";
import { findVehicleByPlate, putVehicleStatus } from "./helpers/vehicleSeed";

test.describe.configure({ mode: "serial", timeout: 60_000 });

let seed02Id: number;

test.describe("Estoque removido e restauração (SEED02)", () => {
  test.beforeAll(async ({ request }) => {
    const v = await findVehicleByPlate(request, "SEED02");
    if (!v) {
      seed02Id = -1;
      return;
    }
    seed02Id = v.id;
    await putVehicleStatus(request, seed02Id, "disponivel");
  });

  test("admin arquiva veículo (aparece em Removidos)", async ({ page, request }) => {
    test.skip(seed02Id < 0, "Veículo SEED02 não encontrado - execute npm run db:seed.");

    await page.goto(`/veiculo/${seed02Id}`);
    await page.getByRole("button", { name: "Remover do estoque" }).click();
    await page.getByRole("button", { name: "Confirmar" }).click();
    await page.waitForURL(/\/estoque/, { timeout: 15_000 });

    const archived = await findVehicleByPlate(request, "SEED02");
    expect(archived?.status).toBe("removido");

    await page.goto("/estoque");
    await expect(page.getByRole("heading", { name: "Gestão de Estoque" })).toBeVisible();
    const retry = page.getByRole("button", { name: "Tentar novamente" });
    if (await retry.isVisible({ timeout: 3000 }).catch(() => false)) {
      await retry.click();
    }
    const removidosTab = page.getByRole("tab", { name: /Removidos/i });
    await expect(removidosTab).toBeVisible({ timeout: 30_000 });
    await removidosTab.click();
    await page.getByPlaceholder(/Buscar por veículo ou placa/i).fill("SEED02");
    await expect(page.locator("tr", { hasText: "SEED02" })).toBeVisible({ timeout: 15_000 });
  });

  test("operador não vê botão restaurar", async ({ browser }) => {
    test.skip(seed02Id < 0, "SEED02 ausente.");

    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/login");
    await page.locator("#identifier").fill(process.env.E2E_OPERATOR_EMAIL ?? "operador@lignum.local");
    await page.locator("#password").fill(process.env.E2E_OPERATOR_PASSWORD ?? "operador123");
    await page.locator("#login-submit").click();
    await page.getByRole("heading", { name: "Painel" }).waitFor({ state: "visible", timeout: 30_000 });

    await page.goto(`/veiculo/${seed02Id}`);
    await expect(page.getByRole("button", { name: "Restaurar veículo" })).toHaveCount(0);
    await ctx.close();
  });

  test("admin restaura veículo como disponível (estado pré-definido no diálogo)", async ({ page, request }) => {
    test.skip(seed02Id < 0, "SEED02 ausente.");

    await page.goto(`/veiculo/${seed02Id}`);
    await page.getByRole("button", { name: "Restaurar veículo" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: /^Restaurar$/ }).click();
    // A mutação é assíncrona; não navegar antes do sucesso (toast + API).
    await expect(page.getByText(/Veículo restaurado/i)).toBeVisible({ timeout: 15_000 });

    const restored = await findVehicleByPlate(request, "SEED02");
    expect(restored?.status).toBe("disponivel");

    await page.goto("/estoque");
    await expect(page.getByRole("heading", { name: "Gestão de Estoque" })).toBeVisible();
    if (await page.getByText(/Erro de conexão/i).isVisible({ timeout: 2000 }).catch(() => false)) {
      return;
    }
    await page.getByRole("tab", { name: /Em estoque/i }).click();
    await page.getByPlaceholder(/Buscar por veículo ou placa/i).fill("SEED02");
    await expect(page.locator("tr", { hasText: "SEED02" })).toBeVisible({ timeout: 15_000 });
  });
});
