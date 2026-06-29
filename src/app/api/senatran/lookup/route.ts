import { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { allStaffReadRoles, commercialWriteRoles } from "@/lib/apiRoles";
import { fail, ok } from "@/lib/jsonResponse";
import { assertSenatranLookupRateLimit } from "@/lib/rateLimitService";
import { SenatranLookupError } from "@/lib/senatran/errors";
import { normalizePlate, normalizeRenavamDigits } from "@/lib/senatran/normalize";
import { getSenatranProvider, runSenatranLookup } from "@/lib/senatran/runLookup";
import { senatranCacheGet, senatranCacheSet } from "@/lib/senatran/cache";
import { logSenatranEvent } from "@/lib/senatran/telemetry";
import { zodErrorResponse } from "@/lib/routeUtils";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

const lookupBodySchema = z
  .object({
    plate: z.string().optional(),
    renavam: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasPlate = !!data.plate?.trim();
    const hasRenavam = !!data.renavam?.trim();
    if (!hasPlate && !hasRenavam) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe a placa ou o RENAVAM.",
        path: ["plate"],
      });
    }
  });

function cacheTtlSeconds(): number {
  const n = Number(process.env.SENATRAN_CACHE_TTL_SECONDS ?? "86400");
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

  const plateIn = parsed.data.plate?.trim();
  const renavamIn = parsed.data.renavam?.trim();

  const resourceKey = plateIn
    ? `plate:${normalizePlate(plateIn)}`
    : `renavam:${normalizeRenavamDigits(renavamIn ?? "")}`;

  const limited = await assertSenatranLookupRateLimit(req, userId, resourceKey);
  if (limited) return limited;

  logSenatranEvent("senatran_consulta_iniciada", { userId, resourceKey });

  const ttl = cacheTtlSeconds();
  const cacheKey = resourceKey;

  try {
    const cached = senatranCacheGet(cacheKey);
    if (cached) {
      await prisma.senatranLookupAudit.create({
        data: {
          userId: userIdNum,
          plateNormalized: cached.plate,
          renavamQuery: renavamIn ? normalizeRenavamDigits(renavamIn) : null,
          provider: getSenatranProvider(),
          cost: new Prisma.Decimal(0),
          success: true,
          errorCode: null,
          cachedResponse: true,
          snapshotJson: { cached: true, normalized: cached },
        },
      });
      logSenatranEvent("senatran_consulta_sucesso", { userId, resourceKey, cached: true });
      return ok({
        normalized: cached,
        cached: true,
        provider: getSenatranProvider(),
        cost: 0,
      });
    }

    const result = await runSenatranLookup({
      plate: plateIn,
      renavam: renavamIn,
    });

    senatranCacheSet(cacheKey, result.normalized, ttl);

    const snapshotJson = JSON.parse(
      JSON.stringify({
        provider: result.provider,
        normalized: result.normalized,
        raw: result.rawForAudit,
      }),
    ) as Prisma.InputJsonValue;

    await prisma.senatranLookupAudit.create({
      data: {
        userId: userIdNum,
        plateNormalized: result.normalized.plate,
        renavamQuery: renavamIn ? normalizeRenavamDigits(renavamIn) : null,
        provider: result.provider,
        cost: new Prisma.Decimal(result.unitCost),
        success: true,
        errorCode: null,
        cachedResponse: false,
        snapshotJson,
      },
    });

    logSenatranEvent("senatran_consulta_sucesso", { userId, resourceKey, cached: false });
    return ok({
      normalized: result.normalized,
      cached: false,
      provider: result.provider,
      cost: result.unitCost,
    });
  } catch (e: unknown) {
    if (e instanceof SenatranLookupError) {
      logSenatranEvent("senatran_consulta_erro", { userId, resourceKey, code: e.code });
      await prisma.senatranLookupAudit.create({
        data: {
          userId: userIdNum,
          plateNormalized: plateIn ? normalizePlate(plateIn) : "",
          renavamQuery: renavamIn ? normalizeRenavamDigits(renavamIn) : null,
          provider: getSenatranProvider(),
          cost: new Prisma.Decimal(0),
          success: false,
          errorCode: e.code,
          cachedResponse: false,
          snapshotJson: { error: e.code, message: e.message },
        },
      });

      if (e.code === "PLATE_NOT_FOUND") {
        return fail("NOT_FOUND", 404, { message: e.message, details: { senatranCode: e.code } });
      }
      return fail("BAD_REQUEST", 400, { message: e.message, details: { senatranCode: e.code } });
    }
    console.error("[senatran/lookup]", e);
    return fail("INTERNAL_ERROR", 500);
  }
});
