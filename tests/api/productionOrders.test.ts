import "./helpers/authMock";

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { adminSession, setMockSession } from "./helpers/authMock";
import { disconnectPrisma, getPrisma, hasDatabaseUrl } from "./helpers/db";
import { apiUrl, jsonRequest, parseEnvelope, testRouteCtx } from "./helpers/http";

vi.mock("@/lib/sessionRevocation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/sessionRevocation")>();
  return {
    ...actual,
    isSessionRevoked: vi.fn().mockResolvedValue(false),
    revokeUserSessions: vi.fn().mockResolvedValue(undefined),
  };
});

import { POST as postQuotes } from "@/app/api/quotes/route";
import { PUT as putQuote } from "@/app/api/quotes/[id]/route";
import { POST as postConvert } from "@/app/api/quotes/[id]/convert/route";
import { GET as getProductionOrders } from "@/app/api/production-orders/route";
import { POST as postStart } from "@/app/api/production-orders/[id]/start/route";
import { POST as postCancel } from "@/app/api/production-orders/[id]/cancel/route";
import { dec, recordStockMovement } from "@/lib/materials/stockMovement";
import { BOM_CATALOG_SEED } from "@/lib/materials/bomCatalogSeed";

const describeDb = hasDatabaseUrl() ? describe : describe.skip;

describeDb("ProductionOrder API (integração)", () => {
  let adminUserId: number;
  let testClientId: number;

  beforeAll(async () => {
    const prisma = getPrisma();
    const admin = await prisma.user.findUnique({ where: { email: "admin@lignum.local" } });
    if (!admin) throw new Error("Execute npm run db:seed antes dos testes DB.");
    adminUserId = admin.id;

    const client =
      (await prisma.client.findFirst({ where: { email: "test.production@lignum.local" } })) ??
      (await prisma.client.create({
        data: {
          fullName: "Cliente Produção Teste",
          document: "98765432100",
          email: "test.production@lignum.local",
          phone: "11988887777",
        },
      }));
    testClientId = client.id;
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  beforeEach(() => {
    setMockSession({ ...adminSession, id: String(adminUserId) });
  });

  async function ensureBomCatalogStock() {
    const prisma = getPrisma();
    for (const item of BOM_CATALOG_SEED) {
      const mat = await prisma.material.findUnique({ where: { sku: item.sku } });
      if (!mat) continue;
      const current = dec(mat.currentStock);
      const target = Math.max(item.initialStock, 200);
      if (current < target) {
        await recordStockMovement({
          materialId: mat.id,
          type: "entrada",
          quantity: target - current,
          unitCost: item.avgCost,
          notes: "Top-up teste integração",
        });
      }
    }
  }

  async function createApprovedQuote(): Promise<number> {
    const createRes = await postQuotes(
      jsonRequest("POST", "/api/quotes", {
        clientId: testClientId,
        lengthM: 5,
        widthM: 2.4,
        heightM: 2,
        coverStyle: "tampa_plana",
        floorType: "assoalho_madeira",
        finishType: "pintura",
        options: [],
        paymentTerms: "30 dias",
        deliveryDays: 45,
      }) as never,
    );
    expect(createRes.status).toBe(201);
    const created = await parseEnvelope(createRes);
    const quoteId = (created.data as { id: number }).id;

    const sendRes = await putQuote(
      jsonRequest("PUT", `/api/quotes/${quoteId}`, { status: "enviado" }) as never,
      { params: Promise.resolve({ id: String(quoteId) }) },
    );
    expect(sendRes.status).toBe(200);

    const approveRes = await putQuote(
      jsonRequest("PUT", `/api/quotes/${quoteId}`, { status: "aprovado" }) as never,
      { params: Promise.resolve({ id: String(quoteId) }) },
    );
    expect(approveRes.status).toBe(200);
    return quoteId;
  }

  it("convert cria ProductionOrder com status aguardando", async () => {
    const quoteId = await createApprovedQuote();

    const res = await postConvert(jsonRequest("POST", `/api/quotes/${quoteId}/convert`) as never, {
      params: Promise.resolve({ id: String(quoteId) }),
    });
    expect(res.status).toBe(200);
    const body = await parseEnvelope(res);
    expect(body.success).toBe(true);

    const data = body.data as {
      productionOrder?: { id: number; status: string; quoteId: number; orderNumber?: string };
      technicalSheet?: { id: number };
    };
    expect(data.productionOrder).toBeDefined();
    expect(data.productionOrder?.status).toBe("aguardando");
    expect(data.productionOrder?.quoteId).toBe(quoteId);
    expect(data.productionOrder?.orderNumber).toMatch(/^OP-\d{4}-\d{4}$/);
    expect(data.technicalSheet?.id).toBeDefined();
  }, 30_000);

  it("listagem paginada de production-orders", async () => {
    const res = await getProductionOrders(
      new Request(apiUrl("/api/production-orders?page=1&pageSize=5")) as never,
      testRouteCtx,
    );
    expect(res.status).toBe(200);
    const body = await parseEnvelope(res);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toBeDefined();
    expect(typeof (body.meta as { total?: number }).total).toBe("number");
    expect(typeof (body.meta as { pageSize?: number }).pageSize).toBe("number");
  });

  it("convert → start baixa BOM e decrementa saldos", async () => {
    const prisma = getPrisma();
    await ensureBomCatalogStock();
    const quoteId = await createApprovedQuote();

    const tmpMat = await prisma.material.findUnique({ where: { sku: "TMP-PLN" } });
    expect(tmpMat).toBeTruthy();
    const stockBefore = dec(tmpMat!.currentStock);

    const convertRes = await postConvert(jsonRequest("POST", `/api/quotes/${quoteId}/convert`) as never, {
      params: Promise.resolve({ id: String(quoteId) }),
    });
    expect(convertRes.status).toBe(200);
    const converted = await parseEnvelope(convertRes);
    const orderId = (converted.data as { productionOrder: { id: number } }).productionOrder.id;

    const startRes = await postStart(jsonRequest("POST", `/api/production-orders/${orderId}/start`) as never, {
      params: Promise.resolve({ id: String(orderId) }),
    });
    expect(startRes.status).toBe(200);
    const started = await parseEnvelope(startRes);
    expect((started.data as { status: string }).status).toBe("andamento");

    const tmpAfter = await prisma.material.findUnique({ where: { sku: "TMP-PLN" } });
    expect(dec(tmpAfter!.currentStock)).toBeLessThan(stockBefore);

    const movements = await prisma.stockMovement.findMany({
      where: { productionOrderId: orderId, type: "saida" },
    });
    expect(movements.length).toBeGreaterThan(0);
  }, 45_000);

  it("start bloqueia com 409 quando saldo insuficiente", async () => {
    const prisma = getPrisma();
    const quoteId = await createApprovedQuote();

    const convertRes = await postConvert(jsonRequest("POST", `/api/quotes/${quoteId}/convert`) as never, {
      params: Promise.resolve({ id: String(quoteId) }),
    });
    const converted = await parseEnvelope(convertRes);
    const orderId = (converted.data as { productionOrder: { id: number } }).productionOrder.id;

    const tmpMat = await prisma.material.findUnique({ where: { sku: "TMP-PLN" } });
    const originalStock = dec(tmpMat!.currentStock);
    try {
      await prisma.material.update({
        where: { id: tmpMat!.id },
        data: { currentStock: 0 },
      });

      const startRes = await postStart(jsonRequest("POST", `/api/production-orders/${orderId}/start`) as never, {
        params: Promise.resolve({ id: String(orderId) }),
      });
      expect(startRes.status).toBe(409);
      const body = await parseEnvelope(startRes);
      expect(body.success).toBe(false);
      expect(body.error?.code).toBe("CONFLICT");

      const order = await prisma.productionOrder.findUnique({ where: { id: orderId } });
      expect(order?.status).toBe("aguardando");
    } finally {
      await prisma.material.update({
        where: { id: tmpMat!.id },
        data: { currentStock: originalStock },
      });
    }
  }, 45_000);

  it("cancel em andamento estorna saldos", async () => {
    const prisma = getPrisma();
    await ensureBomCatalogStock();
    const quoteId = await createApprovedQuote();

    const convertRes = await postConvert(jsonRequest("POST", `/api/quotes/${quoteId}/convert`) as never, {
      params: Promise.resolve({ id: String(quoteId) }),
    });
    const converted = await parseEnvelope(convertRes);
    const orderId = (converted.data as { productionOrder: { id: number } }).productionOrder.id;

    const tmpMat = await prisma.material.findUnique({ where: { sku: "TMP-PLN" } });
    const stockBefore = dec(tmpMat!.currentStock);

    const startRes = await postStart(jsonRequest("POST", `/api/production-orders/${orderId}/start`) as never, {
      params: Promise.resolve({ id: String(orderId) }),
    });
    expect(startRes.status).toBe(200);

    const tmpAfterStart = await prisma.material.findUnique({ where: { sku: "TMP-PLN" } });
    expect(dec(tmpAfterStart!.currentStock)).toBeLessThan(stockBefore);

    const cancelRes = await postCancel(jsonRequest("POST", `/api/production-orders/${orderId}/cancel`) as never, {
      params: Promise.resolve({ id: String(orderId) }),
    });
    expect(cancelRes.status).toBe(200);

    const tmpAfterCancel = await prisma.material.findUnique({ where: { sku: "TMP-PLN" } });
    expect(dec(tmpAfterCancel!.currentStock)).toBe(stockBefore);

    const estornos = await prisma.stockMovement.findMany({
      where: { productionOrderId: orderId, type: "estorno" },
    });
    expect(estornos.length).toBeGreaterThan(0);
  }, 60_000);
});
