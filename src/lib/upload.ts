import { put } from "@vercel/blob";
import { validateUploadFile } from "@/lib/uploadValidation";

export const UPLOAD_DISABLED_MESSAGE = "Upload de ficheiros não está disponível nesta versão.";

export function isServerUploadEnabled(): boolean {
  return (
    process.env.ENABLE_SERVER_UPLOADS === "true" &&
    process.env.UPLOAD_SECURITY_CHECKLIST_CONFIRMED === "true"
  );
}

function uploadChecklistConfirmed(): boolean {
  return isServerUploadEnabled();
}

/**
 * Envia um arquivo para o Vercel Blob e devolve a URL pública HTTPS.
 * Substitui o fluxo Strapi `/api/upload` + media library.
 *
 * Requer `BLOB_READ_WRITE_TOKEN` no ambiente Vercel (ou local).
 */
export async function uploadFile(file: File): Promise<string> {
  if (!uploadChecklistConfirmed()) {
    throw new Error("Upload indisponivel: checklist de seguranca pendente.");
  }
  const pathname = `lignum/${Date.now()}-${sanitizeFilename(file.name)}`;
  try {
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return blob.url;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/private store/i.test(msg)) {
      throw new Error(
        "O Blob store está configurado como privado; fotos de veículos requerem um store Public " +
          "(Vercel Dashboard → Storage → Blob → Create → access Public). " +
          "Não é possível alterar o modo de um store existente.",
      );
    }
    throw e;
  }
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/**
 * Obtém imagem de URL externa (catálogo), valida e persiste no Blob.
 * Usado pelo import de fotos sugeridas por marca+modelo (staff).
 */
export async function uploadFromUrl(sourceUrl: string, suggestedName: string): Promise<string> {
  if (!uploadChecklistConfirmed()) {
    throw new Error("Upload indisponivel: checklist de seguranca pendente.");
  }

  const res = await fetch(sourceUrl, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Não foi possível obter a imagem (${res.status}).`);
  }

  const buf = await res.arrayBuffer();
  if (buf.byteLength <= 0) {
    throw new Error("Imagem externa vazia.");
  }

  const contentType = res.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "image/jpeg";
  const ext = EXT_BY_MIME[contentType] ?? ".jpg";
  const file = new File([buf], `${sanitizeFilename(suggestedName)}${ext}`, { type: contentType });

  const validationError = await validateUploadFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  return uploadFile(file);
}
