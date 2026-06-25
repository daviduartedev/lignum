import { test, expect } from "@playwright/test";
import { discoverApiEndpoints } from "./helpers/discoverApiEndpoints";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

function reportDir() {
  const ts = process.env.SMOKE_TIMESTAMP ?? "local";
  const dir = resolve(process.cwd(), "test-reports", `smoke-${ts}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function redactHeaders(headers: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    const key = k.toLowerCase();
    if (key === "authorization" || key === "cookie" || key === "set-cookie") out[k] = "[REDACTED]";
    else out[k] = v;
  }
  return out;
}

test.describe("Smoke completo (API + inbox UI)", () => {
  test("API endpoints (descoberta) + inbox UI básico", async ({ page }, testInfo) => {
    // UI: garantir que o inbox carrega e o sininho abre (quando existir).
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();

    // Drawer do sininho (Topbar): se o botão existir, deve abrir.
    const bell = page.getByRole("button", { name: /alertas|notifica|inbox|sininho/i });
    if (await bell.count()) {
      await bell.first().click();
      await expect(page.getByText(/centro de alertas|alertas|notifica/i)).toBeVisible();
    }

    const repoRoot = resolve(process.cwd());
    const endpoints = discoverApiEndpoints(repoRoot);

    const results: Array<{
      path: string;
      method: string;
      status: number;
      ok: boolean;
      error?: string;
      request?: { headers: Record<string, string>; body?: unknown };
      response?: { headers: Record<string, string>; bodyText?: string };
    }> = [];

    for (const ep of endpoints) {
      for (const method of ep.methods) {
        // Skip: NextAuth internal handlers variam bastante e não são “fluxo de negócio”.
        if (ep.path.startsWith("/api/auth/") && ep.path.includes("[...nextauth]")) continue;

        const isMutation = method !== "GET";
        const body = isMutation ? {} : undefined;

        let status = 0;
        let ok = false;
        let respText = "";
        let respHeaders: Record<string, string> = {};
        try {
          const resp = await page.request.fetch(ep.path, {
            method,
            data: body,
          });
          status = resp.status();
          respHeaders = redactHeaders(resp.headers());
          respText = await resp.text();

          // Happy: GET deve ser 200/204; mutações tipicamente 200/201/204; inválido deve ser 400 com mensagem.
          if (status >= 200 && status < 300) {
            ok = true;
          } else if (isMutation && status === 400) {
            // Erro esperado: deve ter envelope com message em PT-BR (mínimo: string não vazia).
            try {
              const parsed = JSON.parse(respText) as { message?: string } | { error?: { message?: string } };
              const message =
                (parsed as { message?: string }).message ?? (parsed as { error?: { message?: string } }).error?.message;
              ok = typeof message === "string" && message.trim().length > 0;
            } catch {
              ok = false;
            }
          } else if (!isMutation && (status === 401 || status === 403)) {
            // Para perfis sem permissão, 401/403 é aceitável (o objetivo é cobrir e não 500).
            ok = true;
          } else {
            ok = false;
          }
        } catch (e) {
          status = 0;
          ok = false;
          respText = "";
          respHeaders = {};
          results.push({
            path: ep.path,
            method,
            status,
            ok,
            error: String(e),
          });
          continue;
        }

        results.push({
          path: ep.path,
          method,
          status,
          ok,
          request: { headers: {}, body },
          response: { headers: respHeaders, bodyText: respText.slice(0, 50_000) },
        });
      }
    }

    // Falha se qualquer endpoint resultar em não-ok (exceto os skips).
    for (const r of results) {
      expect.soft(r.ok, `${r.method} ${r.path} => ${r.status}`).toBeTruthy();
    }

    const out = resolve(reportDir(), `results-${testInfo.project.name}.json`);
    writeFileSync(out, JSON.stringify({ project: testInfo.project.name, results }, null, 2), "utf8");
  });
});

