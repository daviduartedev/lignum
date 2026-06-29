import type { NextRequest } from "next/server";
import { allStaffReadRoles, commercialWriteRoles } from "@/lib/apiRoles";
import { ok, fail } from "@/lib/jsonResponse";
import { API_BODY_SIZE_LIMIT_BYTES } from "@/lib/rateLimitService";
import { isServerUploadEnabled, uploadFile, UPLOAD_DISABLED_MESSAGE } from "@/lib/upload";
import {
  UPLOAD_MAX_FILES,
  validateUploadFile,
} from "@/lib/uploadValidation";
import { withRole } from "@/lib/withRole";

/**
 * Upload multipart para Vercel Blob (staff).
 *
 * P0 — validações quando activo:
 * - Auth staff (`withRole`); corpo limitado a `API_BODY_SIZE_LIMIT_BYTES`;
 * - MIME whitelist, extensão coerente, magic bytes, tamanho por ficheiro;
 * - rejeitar null bytes, path traversal e extensões perigosas no nome;
 * - sanitização do nome em `uploadFile()` antes de persistir no Blob.
 *
 * Desactivado por defeito até `ENABLE_SERVER_UPLOADS` + `UPLOAD_SECURITY_CHECKLIST_CONFIRMED`.
 */
export const POST = withRole(commercialWriteRoles, async (req: NextRequest) => {
  const len = req.headers.get("content-length");
  if (len) {
    const n = Number.parseInt(len, 10);
    if (Number.isFinite(n) && n > API_BODY_SIZE_LIMIT_BYTES) {
      return fail("BAD_REQUEST", 400, {
        message: "Corpo da requisição demasiado grande.",
      });
    }
  }
  if (!isServerUploadEnabled()) {
    return fail("BAD_REQUEST", 400, { message: UPLOAD_DISABLED_MESSAGE });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return fail("BAD_REQUEST", 400, { message: "Pedido multipart inválido." });
  }

  const entries = formData.getAll("files");
  const files = entries.filter((e): e is File => e instanceof File);
  if (files.length === 0) {
    return fail("BAD_REQUEST", 400, { message: "Nenhum ficheiro enviado." });
  }
  if (files.length > UPLOAD_MAX_FILES) {
    return fail("BAD_REQUEST", 400, {
      message: `Máximo de ${UPLOAD_MAX_FILES} ficheiros por pedido.`,
    });
  }

  for (const file of files) {
    const validationError = await validateUploadFile(file);
    if (validationError) {
      return fail("BAD_REQUEST", 400, { message: validationError });
    }
  }

  try {
    const urls = await Promise.all(files.map((file) => uploadFile(file)));
    return ok({ urls });
  } catch {
    return fail("INTERNAL_ERROR", 500, {
      message: "Falha ao enviar ficheiro. Tente novamente.",
    });
  }
});
