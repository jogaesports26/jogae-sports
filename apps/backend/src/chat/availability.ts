/**
 * Cálculo de horários livres de uma quadra em um dia, usado pela ferramenta
 * de consulta do assistente de IA. Funções puras (sem banco) para testar fácil.
 * Todos os horários são "minutos desde a meia-noite" no fuso do servidor.
 */

export type MinuteRange = { start: number; end: number };

export type DayRule = {
  startMinute: number;
  endMinute: number;
  pricePerHour: number;
};

/** Junta e ordena intervalos que se encostam ou se sobrepõem. */
export function mergeRanges(ranges: MinuteRange[]): MinuteRange[] {
  const sorted = ranges
    .filter((r) => r.end > r.start)
    .sort((a, b) => a.start - b.start);
  const out: MinuteRange[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r.start <= last.end) {
      last.end = Math.max(last.end, r.end);
    } else {
      out.push({ ...r });
    }
  }
  return out;
}

/** Tira de `open` todos os intervalos de `busy`. */
export function subtractRanges(
  open: MinuteRange[],
  busy: MinuteRange[],
): MinuteRange[] {
  const blocked = mergeRanges(busy);
  const result: MinuteRange[] = [];
  for (const o of mergeRanges(open)) {
    let cursor = o.start;
    for (const b of blocked) {
      if (b.end <= cursor || b.start >= o.end) continue;
      if (b.start > cursor) result.push({ start: cursor, end: b.start });
      cursor = Math.max(cursor, b.end);
    }
    if (cursor < o.end) result.push({ start: cursor, end: o.end });
  }
  return result;
}

/**
 * Janelas livres do dia: funcionamento (regras de preço) menos ocupações,
 * já sem o que ficou no passado (`nowMinute`, quando o dia é hoje) e sem
 * janelas menores que a reserva mínima da quadra.
 */
export function freeWindows(params: {
  rules: DayRule[];
  busy: MinuteRange[];
  minDuration: number;
  nowMinute?: number;
}): MinuteRange[] {
  const open = params.rules.map((r) => ({
    start: r.startMinute,
    end: r.endMinute,
  }));
  const busy = [...params.busy];
  if (params.nowMinute != null) busy.push({ start: 0, end: params.nowMinute });
  return subtractRanges(open, busy).filter(
    (w) => w.end - w.start >= params.minDuration,
  );
}

export function hourLabel(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

/** Menor preço por hora entre as regras que tocam a janela. */
export function priceForWindow(
  rules: DayRule[],
  window: MinuteRange,
): number | null {
  const prices = rules
    .filter((r) => r.startMinute < window.end && r.endMinute > window.start)
    .map((r) => r.pricePerHour);
  return prices.length ? Math.min(...prices) : null;
}

/**
 * Valor de um período, trecho a trecho das faixas de preço (mesma conta da reserva).
 * `null` quando alguma parte do período está fora do funcionamento.
 */
export function quoteRange(
  rules: DayRule[],
  period: MinuteRange,
): { total: number; parts: (MinuteRange & { pricePerHour: number })[] } | null {
  const parts: (MinuteRange & { pricePerHour: number })[] = [];
  let cursor = period.start;
  let total = 0;
  while (cursor < period.end) {
    const rule = rules.find(
      (r) => r.startMinute <= cursor && r.endMinute > cursor,
    );
    if (!rule) return null;
    const end = Math.min(rule.endMinute, period.end);
    total += (rule.pricePerHour * (end - cursor)) / 60;
    parts.push({ start: cursor, end, pricePerHour: rule.pricePerHour });
    cursor = end;
  }
  return { total: Math.round(total * 100) / 100, parts };
}
