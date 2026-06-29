export type QuotePricingSettings = {
  suggestedMarginPercent: number;
  minMarginPercent: number;
  laborHourRate: number;
  coverSurcharges: Record<string, number>;
  floorSurcharges: Record<string, number>;
  finishSurcharges: Record<string, number>;
  options: Record<string, { label: string; price: number }>;
};

export const DEFAULT_QUOTE_PRICING: QuotePricingSettings = {
  suggestedMarginPercent: 38,
  minMarginPercent: 25,
  laborHourRate: 85,
  coverSurcharges: {
    tampa_plana: 0,
    tampa_arqueada: 1200,
    tampa_basculante: 2500,
  },
  floorSurcharges: {
    assoalho_madeira: 0,
    assoalho_aco: 800,
    assoalho_aluminio: 1500,
  },
  finishSurcharges: {
    pintura: 0,
    verniz: 600,
    lamina_natural: 400,
  },
  options: {
    porta_lateral: { label: "Porta lateral", price: 3500 },
    iluminacao_led: { label: "Iluminação LED interna", price: 1200 },
    revestimento_interno: { label: "Revestimento interno", price: 2800 },
    rack_teto: { label: "Rack de teto", price: 1800 },
  },
};

export function parseQuotePricingJson(raw: unknown): QuotePricingSettings {
  const d = DEFAULT_QUOTE_PRICING;
  if (raw == null || typeof raw !== "object") return { ...d };
  const o = raw as Record<string, unknown>;
  return {
    suggestedMarginPercent: num(o.suggestedMarginPercent, d.suggestedMarginPercent),
    minMarginPercent: num(o.minMarginPercent, d.minMarginPercent),
    laborHourRate: num(o.laborHourRate, d.laborHourRate),
    coverSurcharges: { ...d.coverSurcharges, ...recordNum(o.coverSurcharges) },
    floorSurcharges: { ...d.floorSurcharges, ...recordNum(o.floorSurcharges) },
    finishSurcharges: { ...d.finishSurcharges, ...recordNum(o.finishSurcharges) },
    options: { ...d.options, ...parseOptions(o.options) },
  };
}

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function recordNum(v: unknown): Record<string, number> {
  if (v == null || typeof v !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    const n = Number(val);
    if (Number.isFinite(n)) out[k] = n;
  }
  return out;
}

function parseOptions(v: unknown): Record<string, { label: string; price: number }> {
  if (v == null || typeof v !== "object") return {};
  const out: Record<string, { label: string; price: number }> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (val == null || typeof val !== "object") continue;
    const row = val as Record<string, unknown>;
    const price = Number(row.price);
    if (!Number.isFinite(price)) continue;
    out[k] = { label: String(row.label ?? k), price };
  }
  return out;
}
