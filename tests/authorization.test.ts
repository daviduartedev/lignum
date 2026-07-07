import "./api/helpers/authMock";

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  adminSession,
  financeiroSession,
  producaoSession,
  readOnlySession,
  setMockSession,
  vendedorSession,
} from "./api/helpers/authMock";
import { apiUrl, jsonRequest, parseEnvelope, testRouteCtx } from "./api/helpers/http";

vi.mock("@/lib/sessionRevocation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/sessionRevocation")>();
  return {
    ...actual,
    isSessionRevoked: vi.fn().mockResolvedValue(false),
    revokeUserSessions: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/lib/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/db")>();
  return {
    ...actual,
    prisma: {
      ...actual.prisma,
      user: {
        ...actual.prisma.user,
        findUnique: vi.fn().mockImplementation(async (args: { where: { id?: number } }) => {
          if (args?.where?.id != null) {
            return { isActive: true, id: args.where.id };
          }
          return actual.prisma.user.findUnique(args as never);
        }),
      },
    },
  };
});

import { POST as postPayables } from "@/app/api/payables/route";
import { POST as postClients } from "@/app/api/clients/route";
import { POST as postUsedBodies } from "@/app/api/used-bodies/route";
import { GET as getAuditLogs } from "@/app/api/audit-logs/route";
import { GET as getUsers } from "@/app/api/users/route";
import { POST as postEmployees } from "@/app/api/employees/route";
import { GET as getEmployees } from "@/app/api/employees/route";
import { POST as postStartProduction } from "@/app/api/production-orders/[id]/start/route";

describe("autorização RBAC por papel (0629)", () => {
  beforeEach(() => {
    setMockSession(vendedorSession);
  });

  it("vendedor não cria conta a pagar (403)", async () => {
    const res = await postPayables(
      jsonRequest("POST", "/api/payables", {
        description: "Teste RBAC",
        amount: 100,
        dueDate: "2026-12-31",
        status: "aberta",
        origin: "manual",
      }) as never,
      testRouteCtx,
    );
    expect(res.status).toBe(403);
    const body = await parseEnvelope(res);
    expect(body.error?.code).toBe("FORBIDDEN");
  });

  it("financeiro cria conta a pagar (validação ou sucesso, não 403)", async () => {
    setMockSession(financeiroSession);
    const res = await postPayables(
      jsonRequest("POST", "/api/payables", {
        description: "Teste RBAC financeiro",
        amount: 100,
        dueDate: "2026-12-31",
        status: "aberta",
        origin: "manual",
      }) as never,
      testRouteCtx,
    );
    expect(res.status).not.toBe(403);
  });

  it("read_only não cria cliente (403)", async () => {
    setMockSession(readOnlySession);
    const res = await postClients(
      jsonRequest("POST", "/api/clients", {
        fullName: "Cliente RBAC",
        document: "52998224725",
        email: "rbac@test.local",
        phone: "11999999999",
      }) as never,
      testRouteCtx,
    );
    expect(res.status).toBe(403);
  });

  it("vendedor não consulta audit logs (403)", async () => {
    const res = await getAuditLogs(new Request(apiUrl("/api/audit-logs")) as never, testRouteCtx);
    expect(res.status).toBe(403);
  });

  it("admin consulta lista de utilizadores (200)", async () => {
    setMockSession(adminSession);
    const res = await getUsers(jsonRequest("GET", "/api/users") as never, testRouteCtx);
    expect(res.status).toBe(200);
  });

  it("vendedor cria carroceria usada (não 403)", async () => {
    const res = await postUsedBodies(
      jsonRequest("POST", "/api/used-bodies", {
        title: "Carroceria RBAC teste",
        lengthM: 8,
        widthM: 2.4,
        condition: "bom",
        entryValue: 3000,
      }) as never,
      testRouteCtx,
    );
    expect(res.status).not.toBe(403);
  });

  it("read_only não cria carroceria usada (403)", async () => {
    setMockSession(readOnlySession);
    const res = await postUsedBodies(
      jsonRequest("POST", "/api/used-bodies", {
        title: "Carroceria bloqueada",
        lengthM: 7,
        widthM: 2.3,
        condition: "regular",
        entryValue: 2000,
      }) as never,
      testRouteCtx,
    );
    expect(res.status).toBe(403);
  });

  it("producao não cria carroceria usada (403)", async () => {
    setMockSession(producaoSession);
    const res = await postUsedBodies(
      jsonRequest("POST", "/api/used-bodies", {
        title: "Carroceria produção",
        lengthM: 7.5,
        widthM: 2.4,
        condition: "bom",
        entryValue: 2500,
      }) as never,
      testRouteCtx,
    );
    expect(res.status).toBe(403);
  });

  it("admin cria funcionário (não 403)", async () => {
    setMockSession(adminSession);
    const res = await postEmployees(
      jsonRequest("POST", "/api/employees", {
        name: "Funcionário RBAC",
        roleTitle: "Marceneiro",
      }) as never,
      testRouteCtx,
    );
    expect(res.status).not.toBe(403);
  });

  it("vendedor não cria funcionário (403)", async () => {
    const res = await postEmployees(
      jsonRequest("POST", "/api/employees", {
        name: "Bloqueado RBAC",
        roleTitle: "Pintor",
      }) as never,
      testRouteCtx,
    );
    expect(res.status).toBe(403);
  });

  it("vendedor não inicia ordem de produção (403)", async () => {
    const res = await postStartProduction(
      jsonRequest("POST", "/api/production-orders/1/start") as never,
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(403);
  });

  it("producao não cria funcionário (403)", async () => {
    setMockSession(producaoSession);
    const res = await postEmployees(
      jsonRequest("POST", "/api/employees", {
        name: "Produção bloqueado",
        roleTitle: "Soldador",
      }) as never,
      testRouteCtx,
    );
    expect(res.status).toBe(403);
  });

  it("producao lista funcionários (200)", async () => {
    setMockSession(producaoSession);
    const res = await getEmployees(new Request(apiUrl("/api/employees?all=1&active=1")) as never, testRouteCtx);
    expect(res.status).toBe(200);
  });
});
