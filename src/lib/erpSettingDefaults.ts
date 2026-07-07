import { DEFAULT_QUOTE_PRICING, parseQuotePricingJson } from "@/lib/quotes/quotePricingDefaults";

export type ErpSettingFlat = {
  company_name: string;
  company_tax_id: string;
  company_state_reg: string;
  company_address: string;
  company_city: string;
  company_state: string;
  company_zip: string;
  company_phone: string;
  company_email: string;
  alert_docs_enabled: boolean;
  alert_email_digest_enabled: boolean;
  finance_event_notify_days_before: number;
  inbox_pre_event_popup_minutes: number;
  quote_suggested_margin_percent: number;
  quote_min_margin_percent: number;
  quote_labor_hour_rate: number;
};

export const ERP_SETTING_DEFAULTS: ErpSettingFlat = {
  company_name: "AlaCruz Carrocerias LTDA",
  company_tax_id: "12.345.678/0001-90",
  company_state_reg: "123.456.789.012",
  company_address: "Av. Paulista, 1000",
  company_city: "São Paulo",
  company_state: "SP",
  company_zip: "01310-100",
  company_phone: "(11) 3456-7890",
  company_email: "contato@lignum.local",
  alert_docs_enabled: true,
  alert_email_digest_enabled: true,
  finance_event_notify_days_before: 1,
  inbox_pre_event_popup_minutes: 30,
  quote_suggested_margin_percent: 38,
  quote_min_margin_percent: 25,
  quote_labor_hour_rate: 85,
};

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
  if (typeof v === "boolean") return v;
  if (v === "true" || v === true) return true;
  if (v === "false" || v === false) return false;
  return fallback;
}

function str(v: unknown, fallback: string): string {
  if (v == null) return fallback;
  return String(v);
}

/** API Prisma (camelCase) → formulário. */
export function mapErpApiRowToFlat(row: Record<string, unknown>): ErpSettingFlat {
  return {
    company_name: str(row.companyName, ERP_SETTING_DEFAULTS.company_name),
    company_tax_id: str(row.companyTaxId, ERP_SETTING_DEFAULTS.company_tax_id),
    company_state_reg: str(row.companyStateReg, ERP_SETTING_DEFAULTS.company_state_reg),
    company_address: str(row.companyAddress, ERP_SETTING_DEFAULTS.company_address),
    company_city: str(row.companyCity, ERP_SETTING_DEFAULTS.company_city),
    company_state: str(row.companyState, ERP_SETTING_DEFAULTS.company_state),
    company_zip: str(row.companyZip, ERP_SETTING_DEFAULTS.company_zip),
    company_phone: str(row.companyPhone, ERP_SETTING_DEFAULTS.company_phone),
    company_email: str(row.companyEmail, ERP_SETTING_DEFAULTS.company_email),
    alert_docs_enabled: bool(row.alertDocsEnabled, ERP_SETTING_DEFAULTS.alert_docs_enabled),
    alert_email_digest_enabled: bool(
      row.alertEmailDigestEnabled,
      ERP_SETTING_DEFAULTS.alert_email_digest_enabled,
    ),
    finance_event_notify_days_before: num(
      row.financeEventNotifyDaysBefore,
      ERP_SETTING_DEFAULTS.finance_event_notify_days_before,
    ),
    inbox_pre_event_popup_minutes: num(
      row.inboxPreEventPopupMinutes,
      ERP_SETTING_DEFAULTS.inbox_pre_event_popup_minutes,
    ),
    quote_suggested_margin_percent: num(
      parseQuotePricingJson(row.quotePricingJson).suggestedMarginPercent,
      ERP_SETTING_DEFAULTS.quote_suggested_margin_percent,
    ),
    quote_min_margin_percent: num(
      parseQuotePricingJson(row.quotePricingJson).minMarginPercent,
      ERP_SETTING_DEFAULTS.quote_min_margin_percent,
    ),
    quote_labor_hour_rate: num(
      parseQuotePricingJson(row.quotePricingJson).laborHourRate,
      ERP_SETTING_DEFAULTS.quote_labor_hour_rate,
    ),
  };
}

export function flatToErpPutBody(f: ErpSettingFlat): Record<string, unknown> {
  const existing = parseQuotePricingJson(undefined);
  const quotePricingJson = {
    ...DEFAULT_QUOTE_PRICING,
    suggestedMarginPercent: f.quote_suggested_margin_percent,
    minMarginPercent: f.quote_min_margin_percent,
    laborHourRate: f.quote_labor_hour_rate,
    coverSurcharges: existing.coverSurcharges,
    floorSurcharges: existing.floorSurcharges,
    finishSurcharges: existing.finishSurcharges,
    options: DEFAULT_QUOTE_PRICING.options,
  };
  return {
    companyName: f.company_name,
    companyTaxId: f.company_tax_id,
    companyStateReg: f.company_state_reg,
    companyAddress: f.company_address,
    companyCity: f.company_city,
    companyState: f.company_state,
    companyZip: f.company_zip,
    companyPhone: f.company_phone,
    companyEmail: f.company_email,
    alertDocsEnabled: f.alert_docs_enabled,
    alertEmailDigestEnabled: f.alert_email_digest_enabled,
    financeEventNotifyDaysBefore: f.finance_event_notify_days_before,
    inboxPreEventPopupMinutes: f.inbox_pre_event_popup_minutes,
    quotePricingJson,
  };
}
