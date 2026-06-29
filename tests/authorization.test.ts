import "./api/helpers/authMock";

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  adminSession,
  financeiroSession,
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
import { GET as getAuditLogs } from "@/app/api/audit-logs/route";
import { GET as getUsers } from "@/app/api/users/route";

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
});
