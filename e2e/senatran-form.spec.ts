import { test, expect } from "@playwright/test";

test.describe("SENATRAN (mock) no formulário de veículo", () => {
  test("Buscar dados oficiais preenche marca e modelo a partir da placa", async ({ page }) => {
    await page.goto("/veiculo/novo");
    await expect(page.getByRole("heading", { name: /Cadastrar Veículo/i })).toBeVisible();

    await page.locator("#plate").fill("ABC1D23");
    await page.getByRole("button", { name: /Buscar dados oficiais/i }).click();

    await expect(page.locator("#brand")).toHaveValue("Toyota", { timeout: 15_000 });
    await expect(page.locator("#model")).toHaveValue("Corolla");
    await expect(page.locator("#renavam")).toHaveValue("12345678901");
  });

  test("Placa não encontrada oferece fallback por RENAVAM", async ({ page }) => {
    await page.goto("/veiculo/novo");
    await page.locator("#plate").fill("ZZZ9999");
    await page.getByRole("button", { name: /Buscar dados oficiais/i }).click();
    await expect(page.getByText(/Não encontrou pela placa/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("#renavam-fallback")).toBeVisible();
  });
});
