import { test, expect } from "@playwright/test";

/**
 * Ciclo 0515 — depende de massa seed (DASH001/DASH016). Com seed mínimo Lignum, skip.
 * Executar `npx tsx prisma/seedBulk.ts` localmente antes de reativar.
 */
test.describe.skip("Dashboard e estoque - ajustes 0515 (requer seed bulk)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("painel: KPIs, quadro de prioridade de giro e lista completa opcional", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Veículos parados com prioridade de giro" })).toBeVisible();
    await expect(page.getByText("Lucro do mês", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Dias parado (média)", { exact: false })).toHaveCount(0);
    await expect(page.getByText("Atenção operacional")).toHaveCount(0);

    const listaBtn = page.getByRole("button", { name: /Lista completa \(\d+\)/ });
    if (await listaBtn.isVisible()) {
      await listaBtn.click();
      await expect(page.getByRole("dialog").getByText("Todos os disponíveis acima do limiar")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toBeHidden();
    }
  });

  test("menu FIPE abre consulta dedicada, não giro", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "FIPE" })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("link", { name: "FIPE" }).click();
    await expect(page).toHaveURL(/\/fipe/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Consulta FIPE" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Consultar FIPE" })).toBeVisible();
  });

  test("estoque: sem coluna Score e Vender em disponível e reservado", async ({ page }) => {
    await page.goto("/estoque");
    await expect(page.getByRole("heading", { name: "Gestão de Estoque" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("columnheader", { name: "Score" })).toHaveCount(0);

    await page.getByPlaceholder(/Buscar por veículo ou placa/i).fill("DASH001");
    const rowDisp = page.locator("tr", { hasText: "DASH001" });
    await expect(rowDisp.getByRole("link", { name: "Ver detalhes" })).toBeVisible({ timeout: 15_000 });
    await expect(rowDisp.getByRole("link", { name: "Vender" })).toBeVisible();

    await page.getByRole("tab", { name: /Reservados/i }).click();
    await page.getByPlaceholder(/Buscar por veículo ou placa/i).fill("DASH016");
    const rowRes = page.locator("tr", { hasText: "DASH016" });
    await expect(rowRes.getByRole("link", { name: "Ver detalhes" })).toBeVisible({ timeout: 15_000 });
    await expect(rowRes.getByRole("link", { name: "Vender" })).toBeVisible();
  });
});

/**
 * Ciclo 0523 — responsividade e controles do estoque em viewports médios.
 */
test.describe("Estoque — polish UI 0523 (viewports médios)", () => {
  for (const width of [1024, 1280] as const) {
    test(`estoque utilizável em ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/estoque");
      await expect(page.getByRole("heading", { name: "Gestão de Estoque" })).toBeVisible({ timeout: 30_000 });

      await expect(page.getByRole("tab", { name: /Em estoque/i })).toBeVisible();
      await expect(page.getByRole("tab", { name: /Reservados/i })).toBeVisible();

      const search = page.getByPlaceholder(/Buscar veículo ou placa/i);
      await expect(search).toBeVisible();
      await search.fill("DASH");

      const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
      expect(overflowX).toBe(false);
    });
  }
});
