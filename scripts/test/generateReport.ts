import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type Result = {
  path: string;
  method: string;
  status: number;
  ok: boolean;
  error?: string;
  response?: { headers?: Record<string, string>; bodyText?: string };
};

function esc(s: string) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function generateSmokeHtmlReport(dir: string) {
  const files = readdirSync(dir).filter((f) => f.startsWith("results-") && f.endsWith(".json"));
  const byProject = new Map<string, Result[]>();
  for (const f of files) {
    const raw = JSON.parse(readFileSync(resolve(dir, f), "utf8")) as { project: string; results: Result[] };
    byProject.set(raw.project, raw.results);
  }

  const projects = [...byProject.keys()].sort();
  const allKeys = new Set<string>();
  for (const [, rs] of byProject) for (const r of rs) allKeys.add(`${r.method} ${r.path}`);
  const keys = [...allKeys].sort();

  const totals = projects.map((p) => {
    const rs = byProject.get(p) ?? [];
    const pass = rs.filter((r) => r.ok).length;
    const fail = rs.filter((r) => !r.ok).length;
    return { project: p, pass, fail, total: rs.length };
  });

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Smoke report</title>
  <style>
    body{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;margin:24px;color:#111}
    h1{margin:0 0 8px}
    .muted{color:#555}
    table{border-collapse:collapse;width:100%;margin-top:16px}
    th,td{border:1px solid #ddd;padding:8px;vertical-align:top}
    th{background:#f6f6f6;text-align:left;position:sticky;top:0}
    .ok{background:#e6ffed}
    .bad{background:#ffe6e6}
    details pre{white-space:pre-wrap;word-break:break-word;background:#0b1020;color:#eaeaea;padding:12px;border-radius:8px}
    .pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px}
    .pill-ok{background:#1a7f37;color:#fff}
    .pill-bad{background:#b42318;color:#fff}
  </style>
</head>
<body>
  <h1>Smoke E2E</h1>
  <div class="muted">Matriz endpoint × perfil</div>
  <ul>
    ${totals
      .map((t) => {
        const cls = t.fail === 0 ? "pill-ok" : "pill-bad";
        return `<li><strong>${esc(t.project)}</strong> - <span class="pill ${cls}">${t.pass}/${t.total} ok</span></li>`;
      })
      .join("")}
  </ul>
  <table>
    <thead>
      <tr>
        <th>Endpoint</th>
        ${projects.map((p) => `<th>${esc(p)}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${keys
        .map((k) => {
          const [method, ...rest] = k.split(" ");
          const path = rest.join(" ");
          const cells = projects
            .map((p) => {
              const r = (byProject.get(p) ?? []).find((x) => `${x.method} ${x.path}` === k);
              if (!r) return `<td class="bad">missing</td>`;
              const cls = r.ok ? "ok" : "bad";
              const badge = r.ok ? "PASS" : "FAIL";
              const detail = r.ok
                ? ""
                : `<details>
  <summary>Detalhes</summary>
  <pre>${esc(
    JSON.stringify(
      {
        status: r.status,
        error: r.error,
        responseHeaders: r.response?.headers,
        responseBody: r.response?.bodyText,
      },
      null,
      2,
    ),
  )}</pre>
</details>`;
              return `<td class="${cls}"><div><strong>${badge}</strong> <span class="muted">${r.status}</span></div>${detail}</td>`;
            })
            .join("");
          return `<tr><td><strong>${esc(method)}</strong> ${esc(path)}</td>${cells}</tr>`;
        })
        .join("")}
    </tbody>
  </table>
</body>
</html>`;

  writeFileSync(resolve(dir, "index.html"), html, "utf8");
}

if (require.main === module) {
  const dir = process.argv[2];
  if (!dir) {
    console.error("Uso: tsx scripts/test/generateReport.ts <dir>");
    process.exit(1);
  }
  generateSmokeHtmlReport(resolve(process.cwd(), dir));
}

