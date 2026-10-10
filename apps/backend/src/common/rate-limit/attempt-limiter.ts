/**
 * Contador em memória por chave, com janela fixa. Suficiente para uma instância única
 * (Render ou a VPS); com várias réplicas, trocar por Redis/tabela.
 */
export class AttemptLimiter {
  private readonly entries = new Map<
    string,
    { count: number; resetAt: number }
  >();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** Registra uma ocorrência e devolve true se ainda está dentro do limite. */
  hit(key: string): boolean {
    this.prune();
    const now = this.now();
    const entry = this.entries.get(key);
    if (!entry || entry.resetAt <= now) {
      this.entries.set(key, { count: 1, resetAt: now + this.windowMs });
      return this.max >= 1;
    }
    entry.count += 1;
    return entry.count <= this.max;
  }

  /** true se a chave já estourou o limite (sem registrar nova ocorrência). */
  isBlocked(key: string): boolean {
    const entry = this.entries.get(key);
    return !!entry && entry.resetAt > this.now() && entry.count >= this.max;
  }

  reset(key: string): void {
    this.entries.delete(key);
  }

  private prune(): void {
    if (this.entries.size < 1000) return;
    const now = this.now();
    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) this.entries.delete(key);
    }
  }
}
