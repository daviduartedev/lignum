/**
 * Stage 3 smoke — upload Vercel Blob + persistência em veículo de teste.
 *
 * Uso:
 *   npx tsx scripts/smoke/vehicle-upload-smoke.ts [--plate DASH001] [--keep]
 *
 * Por defeito restaura o estado original do veículo após validar (use --keep para
 * deixar URLs no BD e inspecionar manualmente nas telas).
 */
import { config } from "dotenv";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { isServerUploadEnabled, uploadFile } from "@/lib/upload";

config({ path: resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

const DEFAULT_PLATE = "DASH001";
const OUT_PATH = resolve(
  process.cwd(),
  "cycles/Q22026/0523-imagens-veiculos-vercel/stage3-upload-smoke.json",
);

/** PNG 1×1 px válido (67 bytes) — renderizável no browser (não usar JPEG truncado). */
function tinyPngFile(name: string): File {
  const bytes = Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
    0x42, 0x60, 0x82,
  ]);
  return new File([bytes], name, { type: "image/png" });
}

async function checkUrlAccessible(url: string): Promise<{ ok: boolean; status?: number; bytes?: number }> {
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    const buf = await res.arrayBuffer();
    return { ok: res.ok && buf.byteLength >= 32, status: res.status, bytes: buf.byteLength };
  } catch {
    return { ok: false };
  }
}

async function main() {
  const plateArg = process.argv.find((a) => a.startsWith("--plate="))?.split("=")[1];
  const plateIdx = process.argv.indexOf("--plate");
  const plate = plateArg ?? (plateIdx >= 0 ? process.argv[plateIdx + 1] : DEFAULT_PLATE);
  const keep = process.argv.includes("--keep");

  if (!process.env.DATABASE_URL) {
    console.error("[smoke:upload] DATABASE_URL não definido.");
    process.exit(1);
  }

  if (!isServerUploadEnabled()) {
    console.error(
      "[smoke:upload] Upload desactivado. Defina ENABLE_SERVER_UPLOADS=true e UPLOAD_SECURITY_CHECKLIST_CONFIRMED=true.",
    );
    process.exit(1);
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    console.error("[smoke:upload] BLOB_READ_WRITE_TOKEN vazio.");
    process.exit(1);
  }

  const vehicle = await prisma.vehicle.findFirst({ where: { plate } });
  if (!vehicle) {
    console.error(`[smoke:upload] Veículo com placa ${plate} não encontrado.`);
    process.exit(1);
  }

  const snapshot = {
    mainPhotoUrl: vehicle.mainPhotoUrl,
    galleryUrls: [...vehicle.galleryUrls],
    attachmentUrls: [...vehicle.attachmentUrls],
  };

  console.log(`[smoke:upload] Veículo id=${vehicle.id} placa=${plate}`);

  const mainUrl = await uploadFile(tinyPngFile("stage3-main.png"));
  const galleryUrl = await uploadFile(tinyPngFile("stage3-gallery.png"));
  console.log(`[smoke:upload] Blob main: ${mainUrl}`);
  console.log(`[smoke:upload] Blob gallery: ${galleryUrl}`);

  const mainCheck = await checkUrlAccessible(mainUrl);
  const galleryCheck = await checkUrlAccessible(galleryUrl);
  if (!mainCheck.ok || !galleryCheck.ok) {
    console.error("[smoke:upload] URL Blob inacessível ou conteúdo inválido após upload.");
    process.exit(1);
  }
  console.log(`[smoke:upload] Tamanhos: main=${mainCheck.bytes}B gallery=${galleryCheck.bytes}B`);

  await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: {
      mainPhotoUrl: mainUrl,
      galleryUrls: [galleryUrl],
      attachmentUrls: snapshot.attachmentUrls,
    },
  });

  const reread = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
  if (!reread?.mainPhotoUrl || reread.mainPhotoUrl !== mainUrl) {
    console.error("[smoke:upload] mainPhotoUrl não persistiu.");
    process.exit(1);
  }
  if (!reread.galleryUrls.includes(galleryUrl)) {
    console.error("[smoke:upload] galleryUrls não persistiu.");
    process.exit(1);
  }

  console.log("[smoke:upload] Persistência OK (mainPhotoUrl + galleryUrls).");

  const evidence = {
    timestamp: new Date().toISOString(),
    plate,
    vehicleId: vehicle.id,
    uploadEnabled: true,
    mainPhotoUrl: mainUrl,
    galleryUrls: [galleryUrl],
    urlChecks: { main: mainCheck, gallery: galleryCheck },
    reloaded: {
      mainPhotoUrl: reread.mainPhotoUrl,
      galleryUrls: reread.galleryUrls,
    },
    keptInDb: keep,
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(evidence, null, 2));
  console.log(`[smoke:upload] Evidência: ${OUT_PATH}`);

  if (!keep) {
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: snapshot,
    });
    console.log("[smoke:upload] Estado original restaurado (--keep para manter URLs).");
  } else {
    console.log("[smoke:upload] URLs mantidas no BD para smoke manual UI.");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("[smoke:upload] Falha:", e instanceof Error ? e.message : e);
  process.exit(1);
});
