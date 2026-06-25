import { spawnSync } from "node:child_process";
import { generateSmokeHtmlReport } from "./generateReport";
import { resolve } from "node:path";

function npxBin() {
  return process.platform === "win32" ? "npx.cmd" : "npx";
}

function timestamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(
    d.getSeconds(),
  )}`;
}

function run(cmd: string, args: string[], extraEnv?: Record<string, string>) {
  const res = spawnSync(cmd, args, {
    stdio: "inherit",
    env: { ...process.env, ...(extraEnv ?? {}) },
    shell: process.platform === "win32",
  });
  if (res.error) throw res.error;
  if (typeof res.status === "number" && res.status !== 0) process.exit(res.status);
}

function main() {
  if (process.env.ALLOW_DB_RESET !== "true") {
    console.error('[test:smoke] Bloqueado: defina ALLOW_DB_RESET=true (one-shot).');
    process.exit(1);
  }

  const ts = timestamp();

  run("npm", ["run", "db:dump"]);
  run("npm", ["run", "db:reset"]);
  run("npm", ["run", "db:seed"], { SEED_CLEAR: "true", SEED_PASSWORD: process.env.SEED_PASSWORD ?? "Teste@123" });

  run(npxBin(), ["playwright", "test", "--config=playwright.smoke.config.ts"], { SMOKE_TIMESTAMP: ts });

  const dir = resolve(process.cwd(), "test-reports", `smoke-${ts}`);
  generateSmokeHtmlReport(dir);
  console.log(`[test:smoke] Relatório HTML: ${resolve(dir, "index.html")}`);
}

main();

