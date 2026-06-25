import { readdirSync, statSync, readFileSync } from "node:fs";
import { join, posix } from "node:path";

export type DiscoveredEndpoint = {
  routeFile: string;
  path: string;
  methods: ("GET" | "POST" | "PUT" | "PATCH" | "DELETE")[];
};

const METHOD_NAMES = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function toApiPath(routeFile: string) {
  // routeFile: <repo>/src/app/api/<...>/route.ts
  const marker = `${posix.sep}src${posix.sep}app${posix.sep}api${posix.sep}`;
  const norm = routeFile.replaceAll("\\", "/");
  const idx = norm.indexOf("/src/app/api/");
  if (idx === -1) throw new Error(`routeFile not under src/app/api: ${routeFile}`);
  const sub = norm.slice(idx + "/src/app/api/".length);
  const without = sub.replace(/\/route\.ts$/, "");
  return `/api/${without}`;
}

function discoverMethods(source: string) {
  const methods: DiscoveredEndpoint["methods"] = [];
  for (const m of METHOD_NAMES) {
    if (new RegExp(`export\\s+const\\s+${m}\\b`).test(source)) methods.push(m);
  }
  return methods;
}

export function discoverApiEndpoints(repoRoot: string): DiscoveredEndpoint[] {
  const apiRoot = join(repoRoot, "src", "app", "api");
  const files = walk(apiRoot).filter((f) => f.endsWith(`${join("route.ts")}`) || f.endsWith("/route.ts"));

  const endpoints: DiscoveredEndpoint[] = [];
  for (const f of files) {
    const source = readFileSync(f, "utf8");
    const methods = discoverMethods(source);
    if (methods.length === 0) continue;
    endpoints.push({ routeFile: f, path: toApiPath(f), methods });
  }

  endpoints.sort((a, b) => a.path.localeCompare(b.path));
  return endpoints;
}

