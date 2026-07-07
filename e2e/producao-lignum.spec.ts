import { test, expect, type Page, type APIResponse } from "@playwright/test";

const password =
  process.env.E2E_PASSWORD ?? process.env.E2E_ADMIN_PASSWORD ?? "Teste@123456";

async function readApiData<T>(res: APIResponse): Promise<T> {
  const j = (await res.json()) as unknown;
  if (!res.ok()) {
    throw new Error(`HTTP ${res.status()}: ${JSON.stringify(j)}`);
  }
  if (typeof j === "object" && j !== null && "success" in j && (j as { success: boolean }).success === true) {
    return (j as unknown as { data: T }).data;
  }
  throw new Error(`Resposta inesperada: ${JSON.stringify(j)}`);
}

async function loginAs(page: Page, email: string) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.locator("#identifier").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#login-submit").click();
  await page.getByRole("heading", { name: "Painel" }).waitFor({ state: "visible", timeout: 30_000 });
}

async function getFirstClientId(page: Page): Promise<number> {
  const res = await page.request.get("/api/clients?page=1&pageSize=1");
  const rows = await readApiData<Array<{ id: number }>>(res);
  const id = rows[0]?.id;
  if (!id) throw new Error("Nenhum cliente no seed — execute npm run db:seed.");
  return id;
}

async function ensureBomStock(page: Page) {
  const res = await page.request.get("/api/materials?page=1&pageSize=50");
  const materials = await readApiData<Array<{ id: number; sku: string; currentStock: number | string }>>(res);
  const target = 100;
  for (const m of materials) {
    const current = Number(m.currentStock);
    if (current >= target) continue;
    const topUp = await page.request.post("/api/stock-movements", {
      data: {
        materialId: m.id,
        type: "entrada",
        quantity: target - current,
        unitCost: 1,
        notes: "E2E top-up BOM",
      },
    });
    if (!topUp.ok()) {
      throw new Error(`Falha ao repor estoque de ${m.sku}: HTTP ${topUp.status()}`);
    }
  }
}

async function createAguardandoProductionOrder(page: Page): Promise<number> {
  const clientId = await getFirstClientId(page);

  const createRes = await page.request.post("/api/quotes", {
    data: {
      clientId,
      lengthM: 5,
      widthM: 2.4,
      heightM: 2,
      coverStyle: "tampa_plana",
      floorType: "assoalho_madeira",
      finishType: "pintura",
      options: [],
      paymentTerms: "30 dias",
      deliveryDays: 45,
    },
  });
  const quote = await readApiData<{ id: number }>(createRes);

  for (const status of ["enviado", "aprovado"] as const) {
    const putRes = await page.request.put(`/api/quotes/${quote.id}`, { data: { status } });
    if (!putRes.ok()) throw new Error(`Falha ao atualizar orçamento para ${status}`);
  }

  const convertRes = await page.request.post(`/api/quotes/${quote.id}/convert`);
  const converted = await readApiData<{ productionOrder?: { id: number } }>(convertRes);
  const orderId = converted.productionOrder?.id;
  if (!orderId) throw new Error("Convert não retornou productionOrder.id");
  return orderId;
}

test.describe("Produção Lignum (0720)", () => {
  test.setTimeout(120_000);

  test("producao: kanban → iniciar OP → materiais consumidos", async ({ page }) => {
    await loginAs(page, "vendedor@lignum.local");
    const orderId = await createAguardandoProductionOrder(page);

    await loginAs(page, "producao@lignum.local");
    await ensureBomStock(page);

    await page.goto("/producao", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.getByRole("heading", { name: "Produção" })).toBeVisible();
    await expect(page.getByText("Aguardando").first()).toBeVisible();

    await page.goto(`/producao/${orderId}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.getByRole("button", { name: "Iniciar produção" })).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: "Iniciar produção" }).click();
    await expect(page.getByText("Em andamento")).toBeVisible({ timeout: 30_000 });

    await page.getByRole("tab", { name: "Materiais" }).click();
    await expect(page.getByText("Saída").first()).toBeVisible({ timeout: 15_000 });
  });

  test("vendedor cria carroceria e não inicia produção", async ({ page }) => {
    await loginAs(page, "vendedor@lignum.local");

    const bodyRes = await page.request.post("/api/used-bodies", {
      data: {
        title: `Carroceria E2E ${Date.now()}`,
        lengthM: 7.5,
        widthM: 2.4,
        condition: "bom",
        entryValue: 3500,
      },
    });
    expect(bodyRes.status()).not.toBe(403);
    expect(bodyRes.ok()).toBeTruthy();

    const orderId = await createAguardandoProductionOrder(page);
    const startRes = await page.request.post(`/api/production-orders/${orderId}/start`);
    expect(startRes.status()).toBe(403);
  });
});
