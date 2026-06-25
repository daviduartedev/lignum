const REDACTED = "[REDACTED]";

const SENSITIVE_KEY = /(password|senha|token|secret|authorization|cookie|hash|cpf|cnpj|document|phone|email|address|tenant)/i;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const CPF = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const CNPJ = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g;
const BEARER = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;

export function createCorrelationId(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function redactString(value: string): string {
  return value
    .replace(BEARER, "Bearer [REDACTED]")
    .replace(EMAIL, REDACTED)
    .replace(CPF, REDACTED)
    .replace(CNPJ, REDACTED);
}

export function redactSensitive(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[MaxDepth]";
  if (value == null) return value;
  if (typeof value === "string") return redactString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
      stack: process.env.NODE_ENV === "production" ? undefined : redactString(value.stack ?? ""),
    };
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY.test(key) ? REDACTED : redactSensitive(item, depth + 1);
    }
    return out;
  }
  return value;
}

export function logSecurityError(scope: string, error: unknown, context?: Record<string, unknown>): string {
  const correlationId = context?.correlationId ? String(context.correlationId) : createCorrelationId();
  console.error(
    JSON.stringify({
      level: "error",
      scope,
      correlationId,
      context: redactSensitive(context ?? {}),
      error: redactSensitive(error),
    }),
  );
  return correlationId;
}

export function logSecurityWarn(scope: string, context?: Record<string, unknown>): void {
  console.warn(
    JSON.stringify({
      level: "warn",
      scope,
      context: redactSensitive(context ?? {}),
    }),
  );
}
