import { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { commercialWriteRoles } from "@/lib/apiRoles";
import { fail, ok } from "@/lib/jsonResponse";
import { assertDocumentLookupRateLimit } from "@/lib/rateLimitService";
import {
  documentCacheKey,
  detectDocumentKind,
  documentLogKey,
  isValidCNPJ,
  normalizeDocumentDigits,
} from "@/lib/documentLookup/normalize";
import { DocumentLookupError } from "@/lib/documentLookup/errors";
import { getDocumentLookupProvider, runDocumentLookup } from "@/lib/documentLookup/runLookup";
import {
  documentLookupCacheGet,
  documentLookupCacheSet,
} from "@/lib/documentLookup/cache";
import { logDocumentLookupEvent } from "@/lib/documentLookup/telemetry";
import { zodErrorResponse } from "@/lib/routeUtils";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

const lookupBodySchema = z.object({
  document: z.string().min(1, "Informe o CNPJ."),
  context: z.enum(["client", "supplier"]).optional(),
});

function cacheTtlSeconds(): number {
  const n = Number(process.env.DOCUMENT_LOOKUP_CACHE_TTL_SECONDS ?? "86400");
  return Number.isFinite(n) && n > 0 ? n : 86400;
}

export const POST = withRole(commercialWriteRoles, async (req: NextRequest) => {
  const session = await auth();
  const uidRaw = session?.user?.id;
  if (uidRaw == null) {
    return fail("UNAUTHENTICATED", 401);
  }
  const userId = String(uidRaw);
  const userIdNum = typeof uidRaw === "number" ? uidRaw : parseInt(userId, 10);
  if (!Number.isFinite(userIdNum)) {
    return fail("INTERNAL_ERROR", 500, { message: "Sessão inválida." });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return fail("BAD_REQUEST", 400, { message: "Corpo JSON inválido." });
  }

  const parsed = lookupBodySchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const digits = normalizeDocumentDigits(parsed.data.document);
  const kind = detectDocumentKind(digits);

  if (kind === "cpf") {
    return fail("BAD_REQUEST", 400, {
      message: "Consulta de CPF não está disponível. Cadastre pessoa física manualmente.",
      details: { code: "DOCUMENT_LOOKUP_CPF_NOT_SUPPORTED" },
    });
  }

  if (kind !== "cnpj" || !isValidCNPJ(digits)) {
    return fail("BAD_REQUEST", 400, {
      message: "CNPJ inválido.",
      details: { code: "DOCUMENT_INVALID" },
    });
  }

  const resourceKey = documentCacheKey(digits);
  const logKey = documentLogKey(digits);

  const limited = await assertDocumentLookupRateLimit(req, userId, resourceKey);
  if (limited) return limited;

  logDocumentLookupEvent("document_lookup_iniciada", { userId, resourceKey: logKey });

  const ttl = cacheTtlSeconds();

  try {
    const cached = documentLookupCacheGet(resourceKey);
    if (cached) {
      await prisma.documentLookupAudit.create({
        data: {
          userId: userIdNum,
          documentNormalized: digits,
          documentKind: "cnpj",
          provider: getDocumentLookupProvider(),
          cost: new Prisma.Decimal(0),
          success: true,
          errorCode: null,
          cachedResponse: true,
          snapshotJson: { cached: true, normalized: cached },
        },
      });
      logDocumentLookupEvent("document_lookup_sucesso", { userId, resourceKey: logKey, cached: true });
      return ok({
        ...cached,
        cached: true,
        provider: getDocumentLookupProvider(),
        cost: 0,
      });
    }

    const result = await runDocumentLookup({ document: digits });
    documentLookupCacheSet(resourceKey, result.normalized, ttl);

    const snapshotJson = JSON.parse(
      JSON.stringify({
        provider: result.provider,
        normalized: result.normalized,
        raw: result.rawForAudit,
      }),
    ) as Prisma.InputJsonValue;

    await prisma.documentLookupAudit.create({
      data: {
        userId: userIdNum,
        documentNormalized: digits,
        documentKind: "cnpj",
        provider: result.provider,
        cost: new Prisma.Decimal(result.unitCost),
        success: true,
        errorCode: null,
        cachedResponse: false,
        snapshotJson,
      },
    });

    logDocumentLookupEvent("document_lookup_sucesso", { userId, resourceKey: logKey, cached: false });
    return ok({
      ...result.normalized,
      cached: false,
      provider: result.provider,
      cost: result.unitCost,
    });
  } catch (e: unknown) {
    if (e instanceof DocumentLookupError) {
      logDocumentLookupEvent("document_lookup_erro", { userId, resourceKey: logKey, code: e.code });
      await prisma.documentLookupAudit.create({
        data: {
          userId: userIdNum,
          documentNormalized: digits,
          documentKind: "cnpj",
          provider: getDocumentLookupProvider(),
          cost: new Prisma.Decimal(0),
          success: false,
          errorCode: e.code,
          cachedResponse: false,
          snapshotJson: { error: e.code, message: e.message },
        },
      });

      if (e.code === "CNPJ_NOT_FOUND") {
        return fail("NOT_FOUND", 404, { message: e.message, details: { code: e.code } });
      }
      return fail("BAD_REQUEST", 400, { message: e.message, details: { code: e.code } });
    }
    console.error("[document-lookup]", e);
    return fail("INTERNAL_ERROR", 500);
  }
});
