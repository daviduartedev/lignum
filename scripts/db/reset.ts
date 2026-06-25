import { spawnSync } from "node:child_process";

function npxBin() {
  return process.platform === "win32" ? "npx.cmd" : "npx";
}

function main() {
  if (process.env.ALLOW_DB_RESET !== "true") {
    console.error('[db:reset] Bloqueado: defina ALLOW_DB_RESET=true para permitir reset do banco.');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[db:reset] DATABASE_URL não está definido.");
    process.exit(1);
  }

  const allowlist = (process.env.DB_RESET_URL_ALLOWLIST ?? "neon.tech,neon")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const ok = allowlist.some((token) => databaseUrl.includes(token));
  if (!ok) {
    console.error(
      `[db:reset] Bloqueado: DATABASE_URL não parece ser ambiente permitido (allowlist: ${allowlist.join(", ")}).`,
    );
    console.error("[db:reset] Se for intencional, ajuste DB_RESET_URL_ALLOWLIST.");
    process.exit(1);
  }

  const res = spawnSync(npxBin(), ["prisma", "migrate", "reset", "--force"], {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (res.error) {
    console.error("[db:reset] Falha ao executar prisma migrate reset.");
    console.error(res.error);
    process.exit(1);
  }
  if (typeof res.status === "number" && res.status !== 0) {
    process.exit(res.status);
  }
}

main();

