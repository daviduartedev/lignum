const CORS_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const CORS_HEADERS = "Content-Type, Authorization, X-Requested-With";

function allowedOrigins(): Set<string> {
  return new Set(
    (process.env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

export function corsHeaders(req: Request): Headers | null {
  const origin = req.headers.get("origin");
  if (!origin) return new Headers({ Vary: "Origin" });
  const requestOrigin = new URL(req.url).origin;
  if (origin !== requestOrigin && !allowedOrigins().has(origin)) {
    return null;
  }
  return new Headers({
    Vary: "Origin",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": CORS_METHODS,
    "Access-Control-Allow-Headers": CORS_HEADERS,
  });
}
