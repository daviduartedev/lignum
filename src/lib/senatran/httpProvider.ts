import type { SenatranLookupInput, SenatranNormalizedVehicle } from "@/lib/senatran/types";
import { SenatranLookupError } from "@/lib/senatran/errors";
import { mapFuelLabelToFuelType } from "@/lib/senatran/mapFuel";
import { isValidBrazilPlate, normalizePlate, normalizeRenavamDigits } from "@/lib/senatran/normalize";

type ParsedVehicleData = Record<string, string>;

const EXTRATO_SERVICE = "teste_new";
const EXTRATO_RENAVAM_SERVICE = "renavam";
const DEFAULT_BASE_URL = "https://extratoveiculo.com.br";
const DEFAULT_PLATE_PATH = "/api/teste_new.php";
const DEFAULT_RENAVAM_PATH = "/cliente/api_get.php";
const DEFAULT_TIMEOUT_MS = 240_000;

const FIELD_ALIASES = {
  plate: ["placa", "placa do veiculo", "placa veículo", "placa veiculo"],
  renavam: ["renavam", "codigo renavam", "cod renavam"],
  chassis: ["chassi", "chassis", "vin"],
  brand: ["marca", "marca do veiculo", "marca veiculo"],
  model: ["modelo", "modelo do veiculo", "modelo veiculo"],
  version: ["versao", "versão", "submodelo"],
  yearManufacture: ["ano fabricacao", "ano fabricação", "ano de fabricacao", "ano fabr", "anofabricacao"],
  yearModel: ["ano modelo", "ano do modelo", "anomodelo"],
  color: ["cor", "cor predominante"],
  fuel: ["combustivel", "combustível", "tipo combustivel", "tipo combustível"],
  species: ["especie", "espécie", "tipo veiculo", "tipo veículo"],
  city: ["municipio", "município", "cidade"],
  uf: ["uf", "estado"],
  situation: ["situacao", "situação", "situacao veiculo", "situação veículo"],
  cautelar: ["cautelar", "sinistro", "leilao", "leilão"],
} as const;

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeKey(value: string): string {
  return stripAccents(value)
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function decodeHtml(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    ccedil: "ç",
    Ccedil: "Ç",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
    aacute: "á",
    Aacute: "Á",
    acirc: "â",
    Acirc: "Â",
    agrave: "à",
    Agrave: "À",
    atilde: "ã",
    Atilde: "Ã",
    eacute: "é",
    Eacute: "É",
    ecirc: "ê",
    Ecirc: "Ê",
    iacute: "í",
    Iacute: "Í",
    oacute: "ó",
    Oacute: "Ó",
    ocirc: "ô",
    Ocirc: "Ô",
    otilde: "õ",
    Otilde: "Õ",
    uacute: "ú",
    Uacute: "Ú",
  };

  return value
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&([a-zA-Z]+);/g, (match, name) => named[name] ?? match);
}

function cleanText(value: string): string {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function addPair(out: ParsedVehicleData, rawKey: string, rawValue: string): void {
  const key = normalizeKey(cleanText(rawKey));
  const value = cleanText(rawValue);
  if (!key || !value || value === "-" || value.toLowerCase() === "null") return;
  out[key] = value;
}

function flattenObject(input: unknown, prefix = "", out: ParsedVehicleData = {}): ParsedVehicleData {
  if (input == null) return out;
  if (Array.isArray(input)) {
    input.forEach((item, index) => flattenObject(item, `${prefix} ${index}`, out));
    return out;
  }
  if (typeof input === "object") {
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      const nextPrefix = prefix ? `${prefix} ${key}` : key;
      if (value != null && typeof value === "object") {
        flattenObject(value, nextPrefix, out);
      } else if (value != null) {
        addPair(out, nextPrefix, String(value));
      }
    }
  }
  return out;
}

function tryParseEmbeddedJson(html: string): ParsedVehicleData {
  const preMatches = [...html.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/gi)];
  const scriptJsonMatches = [...html.matchAll(/<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const candidates = [...preMatches, ...scriptJsonMatches].map((m) => cleanText(m[1] ?? ""));

  for (const candidate of candidates) {
    if (!candidate.startsWith("{") && !candidate.startsWith("[")) continue;
    try {
      return flattenObject(JSON.parse(candidate));
    } catch {
      // Continue with table/text parsing.
    }
  }

  return {};
}

function parseTablePairs(html: string): ParsedVehicleData {
  const out: ParsedVehicleData = {};

  for (const rowMatch of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...(rowMatch[1] ?? "").matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) => m[1] ?? "");
    if (cells.length >= 2) {
      addPair(out, cells[0], cells[1]);
    }
  }

  for (const divMatch of html.matchAll(/<(?:div|p|li|span)[^>]*>([\s\S]*?)<\/(?:div|p|li|span)>/gi)) {
    const text = cleanText(divMatch[1] ?? "");
    const idx = text.indexOf(":");
    if (idx > 0 && idx < 80) {
      addPair(out, text.slice(0, idx), text.slice(idx + 1));
    }
  }

  return out;
}

function parseExtratoHtml(html: string): ParsedVehicleData {
  return {
    ...tryParseEmbeddedJson(html),
    ...parseTablePairs(html),
  };
}

function envPositiveInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function looksPending(html: string): boolean {
  const text = stripAccents(cleanText(html)).toLowerCase();
  return [
    "aguarde",
    "andamento",
    "async",
    "assinc",
    "consulta em processamento",
    "consultando",
    "em processamento",
    "processando",
    "tente novamente",
  ].some((needle) => text.includes(needle));
}

function apiErrorMessage(status: number, body: string): string {
  const text = cleanText(body).slice(0, 260);
  if (status === 401) return "Autenticação inválida na Extrato Veicular. Verifique a chave da API.";
  if (status === 402) return "Saldo insuficiente na Extrato Veicular.";
  if (status === 403) return "Chave sem permissão ou desativada na Extrato Veicular.";
  if (status === 429) return "Rate limit diário excedido na Extrato Veicular.";
  return `Extrato Veicular respondeu HTTP ${status}${text ? `: ${text}` : "."}`;
}

async function fetchExtratoResponse(url: URL, plate: string, apiKey: string): Promise<{ body: string; contentType: string | null }> {
  const timeoutMs = envPositiveInt("EXTRATO_VEICULAR_TIMEOUT_MS", DEFAULT_TIMEOUT_MS);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ placa: plate, api_key: apiKey }),
      signal: controller.signal,
    });
    const body = await response.text();

    if (!response.ok) {
      throw new SenatranLookupError("API_FAILURE", apiErrorMessage(response.status, body));
    }

    return { body, contentType: response.headers.get("content-type") };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new SenatranLookupError(
        "API_FAILURE",
        "A consulta da Extrato Veicular excedeu o tempo limite configurado.",
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchExtratoGetResponse(url: URL, apiKey: string): Promise<{ body: string; contentType: string | null }> {
  const timeoutMs = envPositiveInt("EXTRATO_VEICULAR_TIMEOUT_MS", DEFAULT_TIMEOUT_MS);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
        Authorization: `Bearer ${apiKey}`,
        "X-API-Key": apiKey,
      },
      signal: controller.signal,
    });
    const body = await response.text();

    if (!response.ok) {
      throw new SenatranLookupError("API_FAILURE", apiErrorMessage(response.status, body));
    }

    return { body, contentType: response.headers.get("content-type") };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new SenatranLookupError(
        "API_FAILURE",
        "A consulta da Extrato Veicular excedeu o tempo limite configurado.",
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function pick(data: ParsedVehicleData, aliases: readonly string[]): string | undefined {
  const normalizedAliases = aliases.map(normalizeKey);
  for (const alias of normalizedAliases) {
    if (data[alias]) return data[alias];
  }
  for (const [key, value] of Object.entries(data)) {
    if (normalizedAliases.some((alias) => key === alias || key.endsWith(` ${alias}`) || key.includes(alias))) {
      return value;
    }
  }
  return undefined;
}

function pickYear(data: ParsedVehicleData, aliases: readonly string[]): number | undefined {
  const value = pick(data, aliases);
  const match = value?.match(/\b(19|20)\d{2}\b/);
  const year = match ? Number(match[0]) : Number(value);
  return Number.isFinite(year) && year >= 1900 && year <= 2100 ? year : undefined;
}

function mapLegalSituation(value: string | undefined): SenatranNormalizedVehicle["legalSituation"] {
  const v = stripAccents(value ?? "").toLowerCase();
  if (!v) return "regular";
  if (v.includes("restri") || v.includes("alien") || v.includes("gravame")) return "com_restricao";
  if (v.includes("irregular") || v.includes("bloque") || v.includes("roubo") || v.includes("furto")) return "irregular";
  return "regular";
}

function mapCautelar(data: ParsedVehicleData): SenatranNormalizedVehicle["cautelar"] {
  const joined = Object.entries(data)
    .filter(([key]) => key.includes("cautelar") || key.includes("sinistro") || key.includes("leilao"))
    .map(([, value]) => stripAccents(value).toLowerCase())
    .join(" ");
  if (joined.includes("leilao") && joined.includes("sinistro")) return "leilao_sinistro";
  if (joined.includes("leilao")) return "leilao";
  if (joined.includes("sinistro")) return "sinistro";
  if (joined.includes("restri")) return "outras_restricoes";
  return "nao";
}

function makeOfficialExtra(data: ParsedVehicleData): Record<string, string> {
  const blocked = new Set([
    "cpf",
    "cnpj",
    "documento",
    "endereco",
    "nome proprietario",
    "proprietario",
    "telefone",
  ]);
  return Object.fromEntries(
    Object.entries(data)
      .filter(([key]) => ![...blocked].some((blockedKey) => key.includes(blockedKey)))
      .slice(0, 80),
  );
}

function mapToNormalized(plate: string, data: ParsedVehicleData): SenatranNormalizedVehicle {
  const brand = pick(data, FIELD_ALIASES.brand) ?? "";
  const model = pick(data, FIELD_ALIASES.model) ?? "";
  const version = pick(data, FIELD_ALIASES.version);
  const currentYear = new Date().getFullYear();
  const title = [brand, model, version].filter(Boolean).join(" ").trim() || plate;

  if (!brand && !model && !pick(data, FIELD_ALIASES.chassis) && !pick(data, FIELD_ALIASES.renavam)) {
    throw new SenatranLookupError("PLATE_NOT_FOUND", "A consulta retornou sem dados veiculares aproveitáveis.");
  }

  return {
    plate,
    renavam: pick(data, FIELD_ALIASES.renavam) ?? "",
    chassis: pick(data, FIELD_ALIASES.chassis) ?? "",
    brand: brand || "Não informado",
    model: [model, version].filter(Boolean).join(" ").trim() || "Não informado",
    yearManufacture: pickYear(data, FIELD_ALIASES.yearManufacture) ?? pickYear(data, FIELD_ALIASES.yearModel) ?? currentYear,
    yearModel: pickYear(data, FIELD_ALIASES.yearModel) ?? pickYear(data, FIELD_ALIASES.yearManufacture) ?? currentYear,
    color: pick(data, FIELD_ALIASES.color),
    fuel: mapFuelLabelToFuelType(pick(data, FIELD_ALIASES.fuel)),
    categoryKind: "carro",
    speciesCategory: pick(data, FIELD_ALIASES.species),
    registrationCity: pick(data, FIELD_ALIASES.city),
    registrationUf: pick(data, FIELD_ALIASES.uf)?.toUpperCase().slice(0, 2),
    legalSituation: mapLegalSituation(pick(data, FIELD_ALIASES.situation)),
    cautelar: mapCautelar(data),
    listingTitleDefault: title,
    officialExtra: makeOfficialExtra(data),
  };
}

export async function httpLookup(input: SenatranLookupInput): Promise<{
  normalized: SenatranNormalizedVehicle;
  rawForAudit: Record<string, unknown>;
}> {
  const apiKey = process.env.EXTRATO_VEICULAR_API_KEY?.trim();
  if (!apiKey) {
    throw new SenatranLookupError("API_FAILURE", "EXTRATO_VEICULAR_API_KEY não configurada.");
  }

  const baseUrl = process.env.EXTRATO_VEICULAR_BASE_URL?.trim() || DEFAULT_BASE_URL;
  const isRenavamLookup = !input.plate?.trim() && !!input.renavam?.trim();
  const resource = isRenavamLookup ? normalizeRenavamDigits(input.renavam ?? "") : normalizePlate(input.plate ?? "");

  if (isRenavamLookup && resource.length !== 11) {
    throw new SenatranLookupError("RENAVAM_LOOKUP_NOT_SUPPORTED", "RENAVAM deve conter 11 dígitos.");
  }
  if (!isRenavamLookup && !isValidBrazilPlate(resource)) {
    throw new SenatranLookupError("PLATE_INVALID", "Placa com formato inválido.");
  }

  const service = isRenavamLookup
    ? process.env.EXTRATO_VEICULAR_RENAVAM_SERVICE?.trim() || EXTRATO_RENAVAM_SERVICE
    : process.env.EXTRATO_VEICULAR_PLATE_SERVICE?.trim() || EXTRATO_SERVICE;
  const path = isRenavamLookup
    ? process.env.EXTRATO_VEICULAR_RENAVAM_PATH?.trim() || DEFAULT_RENAVAM_PATH
    : process.env.EXTRATO_VEICULAR_PLATE_PATH?.trim() || DEFAULT_PLATE_PATH;
  const url = new URL(path, baseUrl);

  const response = isRenavamLookup
    ? (() => {
        url.searchParams.set("chave", apiKey);
        url.searchParams.set("servico", service);
        url.searchParams.set("renavam", resource);
        return fetchExtratoGetResponse(url, apiKey);
      })()
    : fetchExtratoResponse(url, resource, apiKey);
  const { body, contentType } = await response;
  if (looksPending(body)) {
    throw new SenatranLookupError(
      "API_FAILURE",
      "A Extrato Veicular retornou a consulta ainda em processamento. Tente novamente em alguns segundos.",
    );
  }

  const trimmed = body.trim();
  if (trimmed === "" || trimmed === "null") {
    throw new SenatranLookupError("PLATE_NOT_FOUND", "A Extrato Veicular retornou resposta vazia para esta placa.");
  }

  const parsed =
    contentType?.includes("json") || trimmed.startsWith("{") || trimmed.startsWith("[")
      ? flattenObject(JSON.parse(trimmed))
      : parseExtratoHtml(body);
  const parsedPlate = normalizePlate(pick(parsed, FIELD_ALIASES.plate) ?? "");
  const normalized = mapToNormalized(isValidBrazilPlate(parsedPlate) ? parsedPlate : resource, parsed);

  return {
    normalized,
    rawForAudit: {
      provider: "extrato_veicular",
      service,
      endpoint: path,
      lookupKind: isRenavamLookup ? "renavam" : "plate",
      parsed,
      htmlPreview: body.slice(0, 5000),
    },
  };
}
