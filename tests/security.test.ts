import "./api/helpers/authMock";
import { adminSession, setMockSession } from "./api/helpers/authMock";

vi.mock("@/lib/sessionRevocation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/sessionRevocation")>();
  return {
    ...actual,
    isSessionRevoked: vi.fn().mockResolvedValue(false),
  };
});

import { POST as postUpload } from "@/app/api/upload/route";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  __resetRateLimitStateForTests,
  assertRegisterPostRateLimit,
} from "@/lib/rateLimitService";
import { fail } from "@/lib/jsonResponse";
import { parsePagination } from "@/lib/pagination";
import { redactSensitive } from "@/lib/secureLogger";
import { uploadFile, UPLOAD_DISABLED_MESSAGE } from "@/lib/upload";
import { validateUploadFilename } from "@/lib/uploadValidation";
import { vehicleCreateSchema } from "@/lib/zodSchemas";
import { corsHeaders } from "@/lib/cors";
import { isSessionRevocationSchemaMissing } from "@/lib/sessionRevocation";
import { securityHeaderEntries } from "@/lib/securityHeaders";
import nextConfig from "../next.config";

describe("rate limit (memória / fallback)", () => {
  beforeEach(() => {
    __resetRateLimitStateForTests();
  });

  it("bloqueia o 6.º POST /api/auth/register na mesma IP (5 / 10 min)", async () => {
    const url = "http://test.local/api/auth/register";
    for (let i = 0; i < 5; i++) {
      const res = await assertRegisterPostRateLimit(new NextRequest(url, { method: "POST" }));
      expect(res).toBeNull();
    }
    const blocked = await assertRegisterPostRateLimit(new NextRequest(url, { method: "POST" }));
    expect(blocked?.status).toBe(429);
    expect(blocked?.headers.get("Retry-After")).toBe("60");
    const body = blocked ? ((await blocked.json()) as { success: boolean; error?: { code: string } }) : null;
    expect(body?.success).toBe(false);
    expect(body?.error?.code).toBe("RATE_LIMITED");
  });
});

describe("envelope de erro seguro", () => {
  it("inclui correlationId sem expor details quando nao informado", async () => {
    const res = fail("INTERNAL_ERROR", 500, { correlationId: "req_test_123" });
    const body = (await res.json()) as {
      success: false;
      error: { code: string; message: string; correlationId?: string; details?: unknown };
    };

    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(body.error.correlationId).toBe("req_test_123");
    expect(body.error.details).toBeUndefined();
  });

  it("inclui headers defensivos em respostas de erro controladas pela app", () => {
    const res = fail("UNAUTHENTICATED", 401);

    expect(res.headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(res.headers.get("Permissions-Policy")).toContain("camera=()");
  });
});

describe("security headers", () => {
  it("define a politica completa para producao e reteste externo", () => {
    const headers = new Map(securityHeaderEntries("production").map(({ key, value }) => [key, value]));

    expect(headers.get("Content-Security-Policy")).toContain("default-src 'self'");
    expect(headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(headers.get("Strict-Transport-Security")).toBe("max-age=31536000; includeSubDomains; preload");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("Permissions-Policy")).toContain("geolocation=()");
  });

  it("publica a politica tambem via next.config para todas as rotas", async () => {
    expect(typeof nextConfig.headers).toBe("function");
    const rules = await nextConfig.headers?.();
    const globalRule = rules?.find((rule) => rule.source === "/:path*");
    const headers = new Map(globalRule?.headers.map(({ key, value }) => [key, value]));

    expect(headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});

describe("redacao de logs", () => {
  it("remove secrets e PII conhecida antes da serializacao", () => {
    const redacted = redactSensitive({
      email: "cliente@example.com",
      password: "Teste@123456",
      token: "abc",
      nested: {
        message: "Contato cliente@example.com CPF 123.456.789-09",
      },
    }) as Record<string, unknown>;

    expect(redacted.email).toBe("[REDACTED]");
    expect(redacted.password).toBe("[REDACTED]");
    expect(redacted.token).toBe("[REDACTED]");
    expect(JSON.stringify(redacted)).not.toContain("cliente@example.com");
    expect(JSON.stringify(redacted)).not.toContain("123.456.789-09");
  });
});

describe("upload desativado", () => {
  it("falha se o upload server-side for chamado sem checklist confirmado", async () => {
    const prevUploads = process.env.ENABLE_SERVER_UPLOADS;
    const prevChecklist = process.env.UPLOAD_SECURITY_CHECKLIST_CONFIRMED;
    process.env.ENABLE_SERVER_UPLOADS = "false";
    process.env.UPLOAD_SECURITY_CHECKLIST_CONFIRMED = "false";
    try {
      await expect(uploadFile(new File(["x"], "teste.txt", { type: "text/plain" }))).rejects.toThrow(
        /checklist de seguranca/,
      );
    } finally {
      if (prevUploads !== undefined) process.env.ENABLE_SERVER_UPLOADS = prevUploads;
      if (prevChecklist !== undefined) process.env.UPLOAD_SECURITY_CHECKLIST_CONFIRMED = prevChecklist;
    }
  });

  it("rejeita path traversal no nome do ficheiro", () => {
    expect(validateUploadFilename("../etc/passwd.jpg")).toMatch(/inválido/i);
    expect(validateUploadFilename("photo.php.jpg")).toMatch(/não permitida/i);
  });

  it("POST /api/upload devolve 400 quando checklist pendente", async () => {
    setMockSession(adminSession);
    const form = new FormData();
    form.append("files", new File(["x"], "x.jpg", { type: "image/jpeg" }));
    const req = new NextRequest("http://test.local/api/upload", { method: "POST", body: form });
    const prevUploads = process.env.ENABLE_SERVER_UPLOADS;
    const prevChecklist = process.env.UPLOAD_SECURITY_CHECKLIST_CONFIRMED;
    process.env.ENABLE_SERVER_UPLOADS = "false";
    process.env.UPLOAD_SECURITY_CHECKLIST_CONFIRMED = "false";
    try {
      const res = await postUpload(req as never, { params: Promise.resolve({}) } as never);
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error?: { message: string } };
      expect(body.error?.message).toBe(UPLOAD_DISABLED_MESSAGE);
    } finally {
      if (prevUploads !== undefined) process.env.ENABLE_SERVER_UPLOADS = prevUploads;
      if (prevChecklist !== undefined) process.env.UPLOAD_SECURITY_CHECKLIST_CONFIRMED = prevChecklist;
    }
  });
});

describe("revogacao de sessao", () => {
  it("reconhece erro de migration ausente sem mascarar outros erros", () => {
    expect(
      isSessionRevocationSchemaMissing({
        code: "P2022",
        meta: { column: "users.session_revoked_at" },
      }),
    ).toBe(true);

    expect(
      isSessionRevocationSchemaMissing(new Error('column "session_revoked_at" does not exist')),
    ).toBe(true);

    expect(isSessionRevocationSchemaMissing(new Error("database connection failed"))).toBe(false);
  });
});

describe("CORS", () => {
  it("rejeita origem cross-origin que nao esta na allowlist", () => {
    const req = new Request("https://app.example.com/api/vehicles", {
      headers: { origin: "https://evil.example.com" },
    });

    expect(corsHeaders(req)).toBeNull();
  });

  it("aceita mesma origem sem wildcard", () => {
    const req = new Request("https://app.example.com/api/vehicles", {
      headers: { origin: "https://app.example.com" },
    });
    const headers = corsHeaders(req);

    expect(headers?.get("Access-Control-Allow-Origin")).toBe("https://app.example.com");
    expect(headers?.get("Access-Control-Allow-Origin")).not.toBe("*");
  });
});

describe("paginação", () => {
  it("ignora page e pageSize inválidos", () => {
    const p = new URLSearchParams({ page: "NaN", pageSize: "Infinity" });
    const r = parsePagination(p);
    expect(r.page).toBe(1);
    expect(r.pageSize).toBeGreaterThan(0);
  });
});

describe("validação Zod (veículo)", () => {
  it("rejeita mainPhotoUrl com esquema javascript:", () => {
    const parsed = vehicleCreateSchema.safeParse({
      plate: "ABC1D23",
      brand: "X",
      model: "Y",
      yearManufacture: 2020,
      yearModel: 2020,
      mileage: 0,
      purchasePrice: "1000",
      status: "disponivel",
      mainPhotoUrl: "javascript:alert(1)",
      renavam: "12345678901",
      chassis: "9BWZZZ377VT004251",
      legalSituation: "regular",
      categoryKind: "carro",
      cautelar: "nao",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejeita observações com marcação HTML", () => {
    const parsed = vehicleCreateSchema.safeParse({
      plate: "ABC1D23",
      brand: "X",
      model: "Y",
      yearManufacture: 2020,
      yearModel: 2020,
      mileage: 0,
      purchasePrice: "1000",
      status: "disponivel",
      observations: "<script>x</script>",
      renavam: "12345678901",
      chassis: "9BWZZZ377VT004251",
      legalSituation: "regular",
      categoryKind: "carro",
      cautelar: "nao",
    });
    expect(parsed.success).toBe(false);
  });
});
