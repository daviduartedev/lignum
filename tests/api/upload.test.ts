import "./helpers/authMock";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { adminSession, setMockSession } from "./helpers/authMock";
import { apiUrl, parseEnvelope, testRouteCtx } from "./helpers/http";
import { __resetRateLimitStateForTests } from "@/lib/rateLimitService";

const uploadFileMock = vi.hoisted(() =>
  vi.fn<(file: File) => Promise<string>>().mockResolvedValue("https://blob.example/lignum/test.jpg"),
);

vi.mock("@/lib/sessionRevocation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/sessionRevocation")>();
  return {
    ...actual,
    isSessionRevoked: vi.fn().mockResolvedValue(false),
  };
});

vi.mock("@/lib/upload", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/upload")>();
  return {
    ...actual,
    uploadFile: uploadFileMock,
  };
});

import { POST as postUpload } from "@/app/api/upload/route";

/** Cabeçalho JPEG mínimo válido para passar validação de magic bytes. */
function tinyJpegFile(name = "foto.jpg"): File {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
  return new File([bytes], name, { type: "image/jpeg" });
}

function multipartUploadRequest(files: File[]): NextRequest {
  const form = new FormData();
  for (const f of files) {
    form.append("files", f);
  }
  return new NextRequest(apiUrl("/api/upload"), { method: "POST", body: form });
}

describe("POST /api/upload", () => {
  beforeEach(() => {
    __resetRateLimitStateForTests();
    setMockSession(adminSession);
    uploadFileMock.mockClear();
    vi.unstubAllEnvs();
    delete process.env.ENABLE_SERVER_UPLOADS;
    delete process.env.UPLOAD_SECURITY_CHECKLIST_CONFIRMED;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejeita upload quando flags env estão desactivadas", async () => {
    const res = await postUpload(multipartUploadRequest([tinyJpegFile()]) as never, testRouteCtx as never);
    expect(res.status).toBe(400);
    const body = await parseEnvelope(res);
    expect(body.error?.message).toMatch(/não está disponível/i);
    expect(uploadFileMock).not.toHaveBeenCalled();
  });

  it("aceita ficheiro válido quando upload activo (mock Blob)", async () => {
    vi.stubEnv("ENABLE_SERVER_UPLOADS", "true");
    vi.stubEnv("UPLOAD_SECURITY_CHECKLIST_CONFIRMED", "true");

    const res = await postUpload(multipartUploadRequest([tinyJpegFile()]) as never, testRouteCtx as never);
    expect(res.status).toBe(200);
    const body = await parseEnvelope(res);
    expect(body.success).toBe(true);
    expect((body.data as { urls: string[] }).urls).toEqual(["https://blob.example/lignum/test.jpg"]);
    expect(uploadFileMock).toHaveBeenCalledOnce();
  });

  it("rejeita ficheiro com magic bytes inválidos", async () => {
    vi.stubEnv("ENABLE_SERVER_UPLOADS", "true");
    vi.stubEnv("UPLOAD_SECURITY_CHECKLIST_CONFIRMED", "true");

    const bad = new File(["not-an-image"], "foto.jpg", { type: "image/jpeg" });
    const res = await postUpload(multipartUploadRequest([bad]) as never, testRouteCtx as never);
    expect(res.status).toBe(400);
    const body = await parseEnvelope(res);
    expect(body.error?.message).toMatch(/conteúdo/i);
    expect(uploadFileMock).not.toHaveBeenCalled();
  });
});
