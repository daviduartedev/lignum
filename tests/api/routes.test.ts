import "./helpers/authMock";

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { adminSession, operatorSession, setMockSession } from "./helpers/authMock";
import { disconnectPrisma, getPrisma, hasDatabaseUrl } from "./helpers/db";
import { apiUrl, jsonRequest, parseEnvelope, testRouteCtx } from "./helpers/http";

vi.mock("@/lib/fipeParallelum", () => ({
  quoteFipeCar: vi.fn(),
}));

vi.mock("@/lib/fipeAutocrlv", () => ({
  quoteFipeAutocrlvByPlate: vi.fn(),
}));

import { __resetRateLimitStateForTests } from "@/lib/rateLimitService";
import { GET as getVehicles, POST as postVehicles } from "@/app/api/vehicles/route";
import { GET as getVehicleById } from "@/app/api/vehicles/[id]/route";
import { POST as restoreVehicle } from "@/app/api/vehicles/[id]/restore/route";
import { GET as getClients } from "@/app/api/clients/route";
import { GET as getClientById } from "@/app/api/clients/[id]/route";
import { GET as getSuppliers } from "@/app/api/suppliers/route";
import { GET as getSales } from "@/app/api/sales/route";
import { GET as getEvaluations } from "@/app/api/evaluations/route";
import { GET as getPurchaseEvaluations } from "@/app/api/purchase-evaluations/route";
import { GET as getContracts } from "@/app/api/contracts/route";
import { GET as getServiceOrders } from "@/app/api/service-orders/route";
import { GET as getWarranties } from "@/app/api/warranties/route";
import { GET as getWarrantiesSummary } from "@/app/api/warranties/summary/route";
import { GET as getPromissoryNotes } from "@/app/api/promissory-notes/route";
import { GET as getPromissorySummary } from "@/app/api/promissory-notes/summary/route";
import { GET as getClientDocuments } from "@/app/api/client-documents/route";
import { GET as getDashboardSummary } from "@/app/api/dashboard/summary/route";
import { GET as getCrmSummary } from "@/app/api/crm-summary/route";
import { GET as getErpSetting, PUT as putErpSetting } from "@/app/api/erp-setting/route";
import { GET as getUserNotifications } from "@/app/api/user-notifications/route";
import { GET as getUserNotificationsSummary } from "@/app/api/user-notifications/summary/route";
import { POST as postSenatranLookup } from "@/app/api/senatran/lookup/route";
import { GET as getSenatranUsage } from "@/app/api/senatran/usage/route";
import { POST as postDocumentLookup } from "@/app/api/document-lookup/route";
import { GET as getDocumentLookupUsage } from "@/app/api/document-lookup/usage/route";
import { POST as postClientDocument } from "@/app/api/client-documents/route";
import { POST as postUpload } from "@/app/api/upload/route";
import { POST as postRegister } from "@/app/api/auth/register/route";
import { GET as getQuotes, POST as postQuotes } from "@/app/api/quotes/route";
import { POST as postQuoteCalculate } from "@/app/api/quotes/calculate/route";
import { GET as getBodyModels } from "@/app/api/body-models/route";

const describeDb = hasDatabaseUrl() ? describe : describe.skip;

describeDb("API REST (contratos com base seedada)", () => {
  let adminUserId: number;
  let testVehicleId: number;
  let testClientId: number;

  beforeAll(async () => {
    const prisma = getPrisma();
    const admin = await prisma.user.findUnique({
      where: { email: "admin@lignum.local" },
    });
    if (!admin) {
      throw new Error("Usuário admin@lignum.local não encontrado - execute npm run db:seed.");
    }
    adminUserId = admin.id;

    const existingClient = await prisma.client.findFirst({
      where: { email: "test.api.client@lignum.local" },
    });
    const client =
      existingClient ??
      (await prisma.client.create({
        data: {
          fullName: "Cliente Teste API",
          document: "12345678901",
          email: "test.api.client@lignum.local",
          phone: "11999999999",
        },
      }));
    testClientId = client.id;

    let vehicle = await prisma.vehicle.findFirst({ where: { plate: "TESTAPI1" } });
    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: {
          plate: "TESTAPI1",
          brand: "Test",
          model: "API",
          yearManufacture: 2020,
          yearModel: 2020,
          mileage: 0,
          purchasePrice: 1000,
          status: "disponivel",
        },
      });
    }
    testVehicleId = vehicle.id;
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  beforeEach(() => {
    __resetRateLimitStateForTests();
    setMockSession({ ...adminSession, id: String(adminUserId) });
  });

  it("rejeita pedidos sem sessão", async () => {
    setMockSession(null);
    const res = await getVehicles(new Request(apiUrl("/api/vehicles")) as never);
    expect(res.status).toBe(401);
    const body = await parseEnvelope(res);
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe("UNAUTHENTICATED");
  });

  it("lista veículos com envelope de sucesso", async () => {
    const res = await getVehicles(new Request(apiUrl("/api/vehicles?page=1&pageSize=5")) as never);
    expect(res.status).toBe(200);
    const body = await parseEnvelope(res);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("detalhe de veículo de teste", async () => {
    const res = await getVehicleById(new Request(apiUrl(`/api/vehicles/${testVehicleId}`)) as never, {
      params: Promise.resolve({ id: String(testVehicleId) }),
    });
    expect(res.status).toBe(200);
    const body = await parseEnvelope(res);
    expect(body.success).toBe(true);
    expect((body.data as { plate: string }).plate).toBe("TESTAPI1");
  });

  it("validação ao criar veículo com payload inválido", async () => {
    const res = await postVehicles(
      jsonRequest("POST", "/api/vehicles", { plate: "", brand: "X" }) as never,
    );
    expect(res.status).toBeGreaterThanOrEqual(400);
    const body = await parseEnvelope(res);
    expect(body.success).toBe(false);
  });

  it("restauração de veículo exige admin", async () => {
    setMockSession({ ...operatorSession, id: String(adminUserId) });
    const res = await restoreVehicle(
      jsonRequest("POST", `/api/vehicles/${testVehicleId}/restore`) as never,
      { params: Promise.resolve({ id: String(testVehicleId) }) },
    );
    expect(res.status).toBe(403);
  });

  it("clientes, fornecedores e vendas listam com sucesso", async () => {
    for (const handler of [getClients, getSuppliers, getSales]) {
      const res = await handler(new Request(apiUrl("/api/clients")) as never);
      expect(res.status).toBe(200);
      const body = await parseEnvelope(res);
      expect(body.success).toBe(true);
    }
  });

  it("detalhe de cliente de teste", async () => {
    const res = await getClientById(new Request(apiUrl(`/api/clients/${testClientId}`)) as never, {
      params: Promise.resolve({ id: String(testClientId) }),
    });
    expect(res.status).toBe(200);
    const body = await parseEnvelope(res);
    expect((body.data as { email: string }).email).toBe("test.api.client@lignum.local");
  });

  it(
    "avaliações, contratos, OS, garantias e promissórias",
    async () => {
      const handlers = [
        getEvaluations,
        getPurchaseEvaluations,
        getContracts,
        getServiceOrders,
        getWarranties,
        getPromissoryNotes,
        getClientDocuments,
      ];
      for (const handler of handlers) {
        const res = await handler(new Request(apiUrl("/api/x")) as never);
        expect(res.status).toBe(200);
        expect((await parseEnvelope(res)).success).toBe(true);
      }
    },
    30_000,
  );

  it("sumários agregados respondem 200", async () => {
    for (const handler of [getWarrantiesSummary, getPromissorySummary, getDashboardSummary, getCrmSummary]) {
      const res = await handler(new Request(apiUrl("/api/x")) as never);
      expect(res.status).toBe(200);
    }
  });

  it("dashboard summary inclui lista completa de pontos de atenção alinhada ao top 5", async () => {
    const res = await getDashboardSummary(new Request(apiUrl("/api/dashboard/summary")) as never);
    expect(res.status).toBe(200);
    const body = await parseEnvelope(res);
    expect(body.success).toBe(true);
    const data = body.data as {
      pontosAtencao: { routeId: string; dias: number }[];
      pontosAtencaoListaCompleta: { routeId: string; dias: number }[];
      pontosAtencaoCount: number;
      lucroMesReais: number;
    };
    expect(typeof data.lucroMesReais).toBe("number");
    expect(Array.isArray(data.pontosAtencaoListaCompleta)).toBe(true);
    expect(data.pontosAtencaoListaCompleta.length).toBe(data.pontosAtencaoCount);
    expect(data.pontosAtencao.length).toBeLessThanOrEqual(5);
    expect(data.pontosAtencao.length).toBe(Math.min(5, data.pontosAtencaoCount));
    for (let i = 0; i < data.pontosAtencao.length; i++) {
      expect(data.pontosAtencao[i]!.routeId).toBe(data.pontosAtencaoListaCompleta[i]!.routeId);
      expect(data.pontosAtencao[i]!.dias).toBe(data.pontosAtencaoListaCompleta[i]!.dias);
    }
    if (data.pontosAtencaoListaCompleta.length >= 2) {
      expect(data.pontosAtencaoListaCompleta[0]!.dias).toBeGreaterThanOrEqual(data.pontosAtencaoListaCompleta[1]!.dias);
    }
  });

  it("erp-setting: operador não pode atualizar", async () => {
    setMockSession({ ...operatorSession, id: String(adminUserId) });
    const res = await putErpSetting(jsonRequest("PUT", "/api/erp-setting", { companyName: "Teste" }) as never);
    expect(res.status).toBe(403);
  });

  it("erp-setting: admin lê e atualiza", async () => {
    setMockSession({ ...adminSession, id: String(adminUserId) });
    const getRes = await getErpSetting(new Request(apiUrl("/api/erp-setting")) as never);
    expect(getRes.status).toBe(200);

    const putRes = await putErpSetting(
      jsonRequest("PUT", "/api/erp-setting", { companyName: "Lignum Seed" }) as never,
    );
    expect(putRes.status).toBe(200);
  });

  it("notificações do usuário autenticado", async () => {
    const listRes = await getUserNotifications(new Request(apiUrl("/api/user-notifications")) as never);
    expect(listRes.status).toBe(200);
    const summaryRes = await getUserNotificationsSummary(
      new Request(apiUrl("/api/user-notifications/summary")) as never,
    );
    expect(summaryRes.status).toBe(200);
  });

  it("SENATRAN lookup mock por placa", async () => {
    const res = await postSenatranLookup(
      jsonRequest("POST", "/api/senatran/lookup", { plate: "ABC1D23" }) as never,
      { params: Promise.resolve({}) },
    );
    expect(res.status).toBe(200);
    const body = await parseEnvelope(res);
    expect(body.success).toBe(true);
  });

  it("SENATRAN usage", async () => {
    const res = await getSenatranUsage(new Request(apiUrl("/api/senatran/usage")) as never);
    expect(res.status).toBe(200);
  });

  it("document lookup mock por CNPJ", async () => {
    const res = await postDocumentLookup(
      jsonRequest("POST", "/api/document-lookup", { document: "11.222.333/0001-81" }) as never,
    );
    expect(res.status).toBe(200);
    const body = await parseEnvelope(res);
    expect(body.success).toBe(true);
    expect(body.data?.fullName).toBeTruthy();
  });

  it("document lookup rejeita CPF", async () => {
    const res = await postDocumentLookup(
      jsonRequest("POST", "/api/document-lookup", { document: "123.456.789-09" }) as never,
    );
    expect(res.status).toBe(400);
    const body = await parseEnvelope(res);
    expect(body.error?.details?.code).toBe("DOCUMENT_LOOKUP_CPF_NOT_SUPPORTED");
  });

  it("document lookup usage admin", async () => {
    const res = await getDocumentLookupUsage(new Request(apiUrl("/api/document-lookup/usage")) as never);
    expect(res.status).toBe(200);
  });

  it("client-documents POST exige ficheiro ou URL", async () => {
    const res = await postClientDocument(
      jsonRequest("POST", "/api/client-documents", {
        title: "Teste",
        clientId: testClientId,
      }) as never,
    );
    expect(res.status).toBe(400);
  });

  it("client-documents POST com URL externa", async () => {
    const res = await postClientDocument(
      jsonRequest("POST", "/api/client-documents", {
        title: "Contrato teste",
        clientId: testClientId,
        externalUrl: "https://example.com/doc.pdf",
      }) as never,
    );
    expect(res.status).toBe(201);
    const body = await parseEnvelope(res);
    expect(body.success).toBe(true);
  });

  it("upload permanece desativado", async () => {
    const res = await postUpload(jsonRequest("POST", "/api/upload", {}) as never, testRouteCtx as never);
    expect(res.status).toBe(400);
    const body = await parseEnvelope(res);
    expect(body.error?.message).toMatch(/não está disponível/i);
  });

  it("registro de usuário exige admin e email único", async () => {
    const unique = `api.test.${Date.now()}@lignum.local`;
    const res = await postRegister(
      jsonRequest("POST", "/api/auth/register", {
        email: unique,
        password: "SenhaSegura1",
        name: "API Test",
        role: "vendedor",
        lgpdConsentVersion: "1.0",
      }) as never,
    );
    expect(res.status).toBe(201);
    const body = await parseEnvelope(res);
    expect(body.success).toBe(true);
  });

  it("quotes GET lista (staff)", async () => {
    const res = await getQuotes(new Request(apiUrl("/api/quotes?page=1&pageSize=10")) as never);
    expect(res.status).toBe(200);
    const body = await parseEnvelope(res);
    expect(body.success).toBe(true);
  });

  it("quotes calculate POST", async () => {
    const res = await postQuoteCalculate(
      jsonRequest("POST", "/api/quotes/calculate", {
        lengthM: 4,
        widthM: 2,
        heightM: 1.8,
        coverStyle: "tampa_plana",
        floorType: "assoalho_madeira",
        finishType: "pintura",
        options: [],
      }) as never,
    );
    expect(res.status).toBe(200);
    const body = await parseEnvelope(res);
    expect(body.success).toBe(true);
    expect(Number((body.data as { total?: number }).total)).toBeGreaterThan(0);
  });

  it("quotes POST cria orçamento rascunho", async () => {
    const res = await postQuotes(
      jsonRequest("POST", "/api/quotes", {
        clientId: testClientId,
        lengthM: 4,
        widthM: 2,
        heightM: 1.8,
        coverStyle: "tampa_plana",
        floorType: "assoalho_madeira",
        finishType: "pintura",
        options: [],
        paymentTerms: "À vista",
        deliveryDays: 30,
      }) as never,
    );
    expect(res.status).toBe(201);
    const body = await parseEnvelope(res);
    expect(body.success).toBe(true);
    expect((body.data as { status?: string }).status).toBe("rascunho");
  });

  it("body-models GET", async () => {
    const res = await getBodyModels(new Request(apiUrl("/api/body-models")) as never);
    expect(res.status).toBe(200);
  });

  it("registro com email duplicado devolve CONFLICT", async () => {
    const res = await postRegister(
      jsonRequest("POST", "/api/auth/register", {
        email: "admin@lignum.local",
        password: "SenhaSegura1",
        name: "Dup",
        role: "vendedor",
        lgpdConsentVersion: "1.0",
      }) as never,
    );
    expect(res.status).toBe(409);
    const body = await parseEnvelope(res);
    expect(body.error?.code).toBe("CONFLICT");
  });
});
