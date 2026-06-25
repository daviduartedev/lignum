import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function timestamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(
    d.getSeconds(),
  )}`;
}

function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[db:dump] DATABASE_URL não está definido.");
    process.exit(1);
  }

  const requirePgDump = process.env.REQUIRE_PG_DUMP === "true";

  const outDir = resolve(process.cwd(), "db-dumps");
  mkdirSync(outDir, { recursive: true });
  const outFile = resolve(outDir, `dump-${timestamp()}.dump`);

  const args = ["--format=custom", "--file", outFile, databaseUrl];
  const res = spawnSync("pg_dump", args, { stdio: "inherit", env: process.env });
  if (res.error) {
    if ((res.error as NodeJS.ErrnoException).code === "ENOENT" && !requirePgDump) {
      const noteFile = resolve(outDir, `dump-${timestamp()}.SKIPPED.txt`);
      writeFileSync(
        noteFile,
        [
          "[db:dump] SKIPPED",
          "Motivo: pg_dump não encontrado no PATH (Postgres client tools não instalados).",
          "Para habilitar dump real:",
          "- instale PostgreSQL (ou apenas client tools) e garanta pg_dump no PATH",
          "- ou rode com REQUIRE_PG_DUMP=true para falhar se não houver pg_dump",
        ].join("\n"),
        "utf8",
      );
      console.warn("[db:dump] pg_dump não encontrado; dump foi pulado (fallback).");
      console.warn(`[db:dump] Nota: ${noteFile}`);
      return;
    }
    console.error("[db:dump] Falha ao executar pg_dump. Verifique se o Postgres (pg_dump) está instalado e no PATH.");
    console.error(res.error);
    process.exit(1);
  }
  if (typeof res.status === "number" && res.status !== 0) {
    process.exit(res.status);
  }

  console.log(`[db:dump] Dump gerado: ${outFile}`);
}

main();

