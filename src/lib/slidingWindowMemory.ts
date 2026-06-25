/** Janela deslizante in-memory (fallback quando Redis não está configurado). */
export class SlidingWindowMemory {
  private buckets = new Map<string, number[]>();

  constructor(private readonly windowMs: number) {}

  prune(key: string, now: number): number[] {
    const arr = (this.buckets.get(key) ?? []).filter((t) => now - t < this.windowMs);
    this.buckets.set(key, arr);
    return arr;
  }

  /** Regista um evento; devolve se ainda está abaixo do limite (true = permitido). */
  hit(key: string, limit: number): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const arr = this.prune(key, now);
    if (arr.length >= limit) {
      return { allowed: false, remaining: 0 };
    }
    arr.push(now);
    this.buckets.set(key, arr);
    return { allowed: true, remaining: Math.max(0, limit - arr.length) };
  }

  /** Apenas consulta consumo atual sem incrementar. */
  peek(key: string, limit: number): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const arr = this.prune(key, now);
    const used = arr.length;
    return { allowed: used < limit, remaining: Math.max(0, limit - used) };
  }

  /** Só para testes, limpa contadores. */
  clear(): void {
    this.buckets.clear();
  }
}
