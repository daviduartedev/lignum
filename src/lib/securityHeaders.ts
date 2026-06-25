const HSTS_VALUE = "max-age=31536000; includeSubDomains; preload";

export function contentSecurityPolicy(nodeEnv = process.env.NODE_ENV): string {
  const scriptSrc = nodeEnv === "production" ? "'self' 'unsafe-inline'" : "'self' 'unsafe-inline' 'unsafe-eval'";
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export function securityHeaderEntries(nodeEnv = process.env.NODE_ENV): Array<{ key: string; value: string }> {
  const entries = [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(nodeEnv) },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ];

  if (nodeEnv === "production") {
    entries.push({ key: "Strict-Transport-Security", value: HSTS_VALUE });
  }

  return entries;
}

export function applySecurityHeaders(headers: Headers, nodeEnv = process.env.NODE_ENV): Headers {
  for (const { key, value } of securityHeaderEntries(nodeEnv)) {
    headers.set(key, value);
  }
  return headers;
}

export function withSecurityHeaders<T extends Response>(response: T, nodeEnv = process.env.NODE_ENV): T {
  applySecurityHeaders(response.headers, nodeEnv);
  return response;
}
