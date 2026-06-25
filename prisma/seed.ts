import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { ERP_SETTING_DEFAULTS } from "../src/lib/erpSettingDefaults";

const prisma = new PrismaClient();

async function main() {
  const seedPassword =
    process.env.SEED_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD ?? "Teste@123456";
  const passwordHash = await hash(seedPassword, 12);
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@lignum.local").toLowerCase().trim();
  const adminName = process.env.SEED_ADMIN_NAME ?? "Administrador Lignum";

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash,
      name: adminName,
      role: "admin",
      lgpdConsentVersion: "1.0",
      lgpdConsentAt: new Date(),
    },
    update: {
      name: adminName,
      role: "admin",
      passwordHash,
    },
  });

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

  console.log("[seed] Lignum seed mínimo aplicado (idempotente).");
  console.log(`[seed] Admin: ${adminEmail} / ${seedPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
