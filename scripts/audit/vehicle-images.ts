/**
 * Inventário read-only de imagens de veículos (Stage 0 — ciclo imagens Vercel).
 * Uso: npx tsx scripts/audit/vehicle-images.ts [--check-urls] [--out path.json]
 */
import { PrismaClient } from "@prisma/client";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const prisma = new PrismaClient();

const HTTP_URL = /^https?:\/\//i;
const CHECK_TIMEOUT_MS = 8_000;
const MAX_URL_CHECKS = 40;

export function normalizeModelKey(brand: string, model: string): string {
  return `${brand.trim().toLowerCase()}/${model.trim().toLowerCase()}`;
}

function classifyMainUrl(url: string | null | undefined): "empty" | "valid_http" | "invalid_scheme" {
  const u = (url ?? "").trim();
  if (!u) return "empty";
  if (HTTP_URL.test(u)) return "valid_http";
  return "invalid_scheme";
}

async function checkUrlAccessible(url: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" });
    if (res.status === 405 || res.status === 501) {
      const getRes = await fetch(url, { method: "GET", signal: controller.signal, redirect: "follow" });
      return { ok: getRes.ok, status: getRes.status };
    }
    return { ok: res.ok, status: res.status };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg.slice(0, 120) };
  } finally {
    clearTimeout(timer);
  }
}

type PhotoState =
  | "sem_foto"
  | "so_galeria"
  | "main_valida"
  | "main_invalida"
  | "main_quebrada";

async function main() {
  const checkUrls = process.argv.includes("--check-urls");
  const outIdx = process.argv.indexOf("--out");
  const outPath = outIdx >= 0 ? process.argv[outIdx + 1] : undefined;

  if (!process.env.DATABASE_URL) {
    console.error("[audit:vehicle-images] DATABASE_URL não definido.");
    process.exit(1);
  }

  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      plate: true,
      brand: true,
      model: true,
      status: true,
      mainPhotoUrl: true,
      galleryUrls: true,
      attachmentUrls: true,
    },
    orderBy: { id: "asc" },
  });

  const uniqueModels = new Map<string, { brand: string; model: string; count: number }>();
  const rows: Array<{
    id: number;
    plate: string;
    brand: string;
    model: string;
    status: string;
    estado: PhotoState;
    mainPhotoUrl: string | null;
    galleryCount: number;
    attachmentCount: number;
    catalogKey: string;
    notas: string;
  }> = [];

  let semFoto = 0;
  let comMain = 0;
  let soGaleria = 0;
  let mainInvalida = 0;

  for (const v of vehicles) {
    const mainClass = classifyMainUrl(v.mainPhotoUrl);
    const galleryCount = v.galleryUrls?.length ?? 0;
    const attachmentCount = v.attachmentUrls?.length ?? 0;
    const catalogKey = normalizeModelKey(v.brand, modelKey(v.model));

    const prev = uniqueModels.get(catalogKey);
    if (prev) prev.count += 1;
    else uniqueModels.set(catalogKey, { brand: v.brand, model: v.model, count: 1 });

    let estado: PhotoState;
    let notas = "";

    if (mainClass === "valid_http") {
      estado = "main_valida";
      comMain += 1;
    } else if (mainClass === "invalid_scheme") {
      estado = "main_invalida";
      mainInvalida += 1;
      notas = `URL inválida: ${v.mainPhotoUrl}`;
    } else if (galleryCount > 0) {
      estado = "so_galeria";
      soGaleria += 1;
      notas = "Sem mainPhotoUrl; tem galeria";
    } else {
      estado = "sem_foto";
      semFoto += 1;
      notas = "Sem mainPhotoUrl nem galeria — candidato a catálogo Stage 1";
    }

    rows.push({
      id: v.id,
      plate: v.plate,
      brand: v.brand,
      model: v.model,
      status: v.status,
      estado,
      mainPhotoUrl: v.mainPhotoUrl,
      galleryCount,
      attachmentCount,
      catalogKey,
      notas,
    });
  }

  const urlChecks: Array<{ url: string; vehicleIds: number[]; ok: boolean; status?: number; error?: string }> = [];

  if (checkUrls) {
    const urlToIds = new Map<string, number[]>();
    for (const v of vehicles) {
      const u = v.mainPhotoUrl?.trim();
      if (u && HTTP_URL.test(u)) {
        const ids = urlToIds.get(u) ?? [];
        ids.push(v.id);
        urlToIds.set(u, ids);
      }
      for (const g of v.galleryUrls ?? []) {
        const gu = g.trim();
        if (gu && HTTP_URL.test(gu)) {
          const ids = urlToIds.get(gu) ?? [];
          ids.push(v.id);
          urlToIds.set(gu, ids);
        }
      }
    }

    let checked = 0;
    for (const [url, vehicleIds] of urlToIds) {
      if (checked >= MAX_URL_CHECKS) break;
      const result = await checkUrlAccessible(url);
      urlChecks.push({ url, vehicleIds, ...result });
      if (!result.ok) {
        for (const row of rows) {
          if (vehicleIds.includes(row.id) && row.estado === "main_valida" && row.mainPhotoUrl === url) {
            row.estado = "main_quebrada";
            row.notas = `URL inacessível (${result.status ?? result.error ?? "?"})`;
          }
        }
      }
      checked += 1;
    }
  }

  const mainQuebrada = rows.filter((r) => r.estado === "main_quebrada").length;
  const modelosUnicos = uniqueModels.size;
  const modelosSemFoto = new Set(rows.filter((r) => r.estado === "sem_foto").map((r) => r.catalogKey)).size;

  const report = {
    generatedAt: new Date().toISOString(),
    databaseUrlPresent: true,
    totals: {
      vehicles: vehicles.length,
      semFoto,
      comMainUrl: comMain,
      soGaleria,
      mainInvalida,
      mainQuebrada: checkUrls ? mainQuebrada : null,
      modelosUnicos,
      modelosSemFotoDistinct: modelosSemFoto,
    },
    urlChecksPerformed: checkUrls ? urlChecks.length : 0,
    urlChecks,
    uniqueBrandModels: [...uniqueModels.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([key, v]) => ({ key, ...v })),
    vehicles: rows,
  };

  const json = JSON.stringify(report, null, 2);
  console.log(json);

  if (outPath) {
    const abs = resolve(process.cwd(), outPath);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, json, "utf8");
    console.error(`[audit:vehicle-images] Escrito: ${abs}`);
  }

  await prisma.$disconnect();
}

/** Normaliza model para chave de catálogo (ex.: "GLA 250" mantém-se). */
function modelKey(model: string): string {
  return model.trim();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
