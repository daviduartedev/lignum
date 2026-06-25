const failureBuckets = new Map<string, number[]>();

function prune(arr: number[], windowMs: number, now: number): number[] {
  return arr.filter((t) => now - t < windowMs);
}

/** Verifica se ainda há tentativas disponíveis (falhas recentes < limite). */
export function checkLoginRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean } {
  const now = Date.now();
  const arr = prune(failureBuckets.get(key) ?? [], windowMs, now);
  failureBuckets.set(key, arr);
  return { allowed: arr.length < limit };
}

/** Regista uma falha de autenticação (credenciais inválidas). */
export function recordLoginFailure(key: string, windowMs: number): void {
  const now = Date.now();
  const arr = prune(failureBuckets.get(key) ?? [], windowMs, now);
  arr.push(now);
  failureBuckets.set(key, arr);
}

export function clearLoginFailures(key: string): void {
  failureBuckets.delete(key);
}
