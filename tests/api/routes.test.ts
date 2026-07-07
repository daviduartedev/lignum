import "./helpers/authMock";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { adminSession, operatorSession, setMockSession } from "./helpers/authMock";
import { disconnectPrisma, getPrisma, hasDatabaseUrl } from "./helpers/db";
import { apiUrl, jsonRequest, parseEnvelope, testRouteCtx } from "./helpers/http";

import { __resetRateLimitStateForTests } from "@/lib/rateLimitService";
import { GET as getClients } from "@/app/api/clients/route";
import { GET as getClientById } from "@/app/api/clients/[id]/route";
import { GET as getSuppliers } from "@/app/api/suppliers/route";
import { GET as getClientDocuments } from "@/app/api/client-documents/route";
import { GET as getCrmSummary } from "@/app/api/crm-summary/route";
import { GET as getErpSetting, PUT as putErpSetting } from "@/app/api/erp-setting/route";
import { GET as getUserNotifications } from "@/app/api/user-notifications/route";
import { GET as getUserNotificationsSummary } from "@/app/api/user-notifications/summary/route";
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
    const res = await getClients(new Request(apiUrl("/api/clients")) as never);
    expect(res.status).toBe(401);
    const body = await parseEnvelope(res);
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe("UNAUTHENTICATED");
  });

  it("clientes e fornecedores listam com sucesso", async () => {
    for (const handler of [getClients, getSuppliers]) {
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

  it("client-documents lista com sucesso", async () => {
    const res = await getClientDocuments(new Request(apiUrl("/api/client-documents")) as never);
    expect(res.status).toBe(200);
    expect((await parseEnvelope(res)).success).toBe(true);
  });

  it("crm summary responde 200", async () => {
    const res = await getCrmSummary(new Request(apiUrl("/api/crm-summary")) as never);
    expect(res.status).toBe(200);
    const body = await parseEnvelope(res);
    expect(body.success).toBe(true);
    expect(typeof (body.data as { totalClients: number }).totalClients).toBe("number");
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
