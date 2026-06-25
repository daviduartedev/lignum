import { API_BODY_SIZE_LIMIT_BYTES } from "@/lib/rateLimitService";

/** Máximo de ficheiros por pedido (alinhado ao formulário de veículo). */
export const UPLOAD_MAX_FILES = 20;

/** Limite por ficheiro (igual ao limite global de corpo da API). */
export const UPLOAD_MAX_FILE_BYTES = API_BODY_SIZE_LIMIT_BYTES;

export const ALLOWED_UPLOAD_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const EXTENSIONS_BY_MIME: Record<string, readonly string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "application/pdf": [".pdf"],
};

const DANGEROUS_EXTENSIONS = /\.(php|phtml|phar|exe|sh|bat|cmd|js|mjs|cjs|html|htm|svg)$/i;

export function extensionForFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? name;
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "";
  return base.slice(dot).toLowerCase();
}

/** Valida nome antes do upload; devolve mensagem PT-BR ou null se válido. */
export function validateUploadFilename(name: string): string | null {
  if (!name.trim()) return "Nome de ficheiro inválido.";
  if (name.includes("\0")) return "Nome de ficheiro inválido.";
  if (/[/\\]|\.\./.test(name)) return "Nome de ficheiro inválido.";
  if (DANGEROUS_EXTENSIONS.test(name)) return "Extensão de ficheiro não permitida.";
  const parts = name.split(".");
  if (parts.length > 2 && parts.slice(0, -1).some((p) => DANGEROUS_EXTENSIONS.test(`.${p}`))) {
    return "Extensão de ficheiro não permitida.";
  }
  return null;
}

function mimeMatchesExtension(mime: string, filename: string): boolean {
  const ext = extensionForFilename(filename);
  const allowed = EXTENSIONS_BY_MIME[mime];
  if (!allowed) return false;
  return allowed.includes(ext);
}

async function readMagicBytes(file: File, length: number): Promise<Uint8Array> {
  const buf = await file.slice(0, length).arrayBuffer();
  return new Uint8Array(buf);
}

function bytesMatchMagic(mime: string, bytes: Uint8Array): boolean {
  switch (mime) {
    case "image/jpeg":
      return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return (
        bytes.length >= 8 &&
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47
      );
    case "image/gif":
      return (
        bytes.length >= 6 &&
        bytes[0] === 0x47 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x38
      );
    case "image/webp":
      return (
        bytes.length >= 12 &&
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      );
    case "application/pdf":
      return (
        bytes.length >= 5 &&
        bytes[0] === 0x25 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x44 &&
        bytes[3] === 0x46 &&
        bytes[4] === 0x2d
      );
    default:
      return false;
  }
}

/** Valida um ficheiro; devolve mensagem PT-BR ou null se válido. */
export async function validateUploadFile(file: File): Promise<string | null> {
  const nameError = validateUploadFilename(file.name);
  if (nameError) return nameError;

  if (!ALLOWED_UPLOAD_MIMES.has(file.type)) {
    return "Tipo de ficheiro não permitido.";
  }

  if (!mimeMatchesExtension(file.type, file.name)) {
    return "Extensão não corresponde ao tipo de ficheiro.";
  }

  if (file.size <= 0) return "Ficheiro vazio.";
  if (file.size > UPLOAD_MAX_FILE_BYTES) {
    return "Ficheiro excede o tamanho máximo permitido.";
  }

  const magic = await readMagicBytes(file, 16);
  if (!bytesMatchMagic(file.type, magic)) {
    return "Conteúdo do ficheiro não corresponde ao tipo declarado.";
  }

  return null;
}
