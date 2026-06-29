import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { ERP_SETTING_DEFAULTS } from "../src/lib/erpSettingDefaults";
import { DEFAULT_QUOTE_PRICING } from "../src/lib/quotes/quotePricingDefaults";

const prisma = new PrismaClient();

const SEED_USERS = [
  { key: "admin", email: "admin@lignum.local", name: "Administrador Lignum", role: "admin" as const },
  { key: "vendedor", email: "vendedor@lignum.local", name: "Vendedor Lignum", role: "vendedor" as const },
  { key: "financeiro", email: "financeiro@lignum.local", name: "Financeiro Lignum", role: "financeiro" as const },
  { key: "producao", email: "producao@lignum.local", name: "Produção Lignum", role: "producao" as const },
  { key: "read_only", email: "readonly@lignum.local", name: "Leitura Lignum", role: "read_only" as const },
];

async function main() {
  const seedPassword =
    process.env.SEED_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD ?? "Teste@123456";
  const passwordHash = await hash(seedPassword, 12);
  const now = new Date();

  for (const u of SEED_USERS) {
    const email =
      (process.env[`SEED_${u.key.toUpperCase()}_EMAIL`] as string | undefined)?.toLowerCase().trim() ??
      u.email;
    await prisma.user.upsert({
      where: { email },
      create: {
        email,
        passwordHash,
        name: u.name,
        role: u.role,
        isActive: true,
        lgpdConsentVersion: "1.0",
        lgpdConsentAt: now,
      },
      update: {
        name: u.name,
        role: u.role,
        passwordHash,
        isActive: true,
      },
    });
  }

  const d = ERP_SETTING_DEFAULTS;
  await prisma.erpSetting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      companyName: d.company_name,
      companyTaxId: d.company_tax_id,
      companyStateReg: d.company_state_reg,
      companyAddress: d.company_address,
      companyCity: d.company_city,
      companyState: d.company_state,
      companyZip: d.company_zip,
      companyPhone: d.company_phone,
      companyEmail: d.company_email,
      alertGiroEnabled: d.alert_giro_enabled,
      alertGiroWarnDays: d.alert_giro_warn_days,
      alertGiroCritDays: d.alert_giro_crit_days,
      alertPromEnabled: d.alert_prom_enabled,
      alertPromDaysBefore: d.alert_prom_days_before,
      alertDocsEnabled: d.alert_docs_enabled,
      alertEmailDigestEnabled: d.alert_email_digest_enabled,
      financeEventNotifyDaysBefore: d.finance_event_notify_days_before,
      inboxPreEventPopupMinutes: d.inbox_pre_event_popup_minutes,
      quotePricingJson: DEFAULT_QUOTE_PRICING,
    },
    update: {
      companyName: d.company_name,
      companyTaxId: d.company_tax_id,
      companyStateReg: d.company_state_reg,
      companyAddress: d.company_address,
      companyCity: d.company_city,
      companyState: d.company_state,
      companyZip: d.company_zip,
      companyPhone: d.company_phone,
      companyEmail: d.company_email,
    },
  });

  const bodyModels = [
    { name: "Baú seco padrão", description: "Carroceria baú para carga seca", basePrice: 18500, pricePerM2: 95 },
    { name: "Frigorífico", description: "Baú frigorífico com isolamento", basePrice: 42000, pricePerM2: 180 },
    { name: "Sider", description: "Carroceria sider cortina", basePrice: 32000, pricePerM2: 140 },
  ];
  for (const m of bodyModels) {
    const existing = await prisma.bodyModel.findFirst({ where: { name: m.name } });
    if (!existing) {
      await prisma.bodyModel.create({ data: m });
    }
  }

  console.log("[seed] Lignum seed mínimo aplicado (idempotente).");
  console.log(`[seed] Senha partilhada: ${seedPassword}`);
  for (const u of SEED_USERS) {
    const email =
      (process.env[`SEED_${u.key.toUpperCase()}_EMAIL`] as string | undefined)?.toLowerCase().trim() ??
      u.email;
    console.log(`[seed] ${u.role}: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
