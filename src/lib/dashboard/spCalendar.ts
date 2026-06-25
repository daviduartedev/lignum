const AMERICA_SAO_PAULO = "America/Sao_Paulo";

/** Ano e mês civil (1–12) de uma data `@db.Date` ou instante, no fuso São Paulo. */
export function saleDateToSpYearMonth(d: Date): { y: number; m: number } {
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: AMERICA_SAO_PAULO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  const [y, mo] = s.split("-").map(Number);
  return { y, m: mo };
}

function addCalendarMonthsUtc(y: number, m1to12: number, delta: number): { y: number; m: number } {
  const d = new Date(Date.UTC(y, m1to12 - 1 + delta, 1));
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 };
}

/**
 * Lista de meses civis consecutivos em America/Sao_Paulo, **do mais antigo ao mais recente**,
 * incluindo o mês corrente de `now` como último elemento.
 */
export function listConsecutiveSpMonthsOldestFirst(now: Date, count: number): { y: number; m: number }[] {
  const { y, m } = getSpYearMonth(now);
  const out: { y: number; m: number }[] = [];
  for (let back = count - 1; back >= 0; back--) {
    out.push(addCalendarMonthsUtc(y, m, -back));
  }
  return out;
}

/** Primeiro instante (UTC) do primeiro mês e último instante (UTC) do último mês da janela. */
export function utcRangeForSpMonthWindow(now: Date, monthCount: number): { start: Date; end: Date } {
  const months = listConsecutiveSpMonthsOldestFirst(now, monthCount);
  const { start } = utcBoundsForCalendarMonth(months[0].y, months[0].m);
  const { end } = utcBoundsForCalendarMonth(months[months.length - 1].y, months[months.length - 1].m);
  return { start, end };
}

/** Ano e mês (1–12) do “agora” civil em São Paulo. */
export function getSpYearMonth(now: Date): { y: number; m: number } {
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: AMERICA_SAO_PAULO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [y, mo] = s.split("-").map(Number);
  return { y, m: mo };
}

/** Primeiro e último dia do mês civil (y, m) em UTC à meia-noite, para filtrar `Date` @db.Date no Prisma. */
export function utcBoundsForCalendarMonth(y: number, m1to12: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(y, m1to12 - 1, 1, 0, 0, 0, 0));
  const lastDay = new Date(Date.UTC(y, m1to12, 0)).getUTCDate();
  const end = new Date(Date.UTC(y, m1to12 - 1, lastDay, 0, 0, 0, 0));
  return { start, end };
}
