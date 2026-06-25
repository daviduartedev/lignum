import fs from "node:fs";

let s = fs.readFileSync("prisma/schema.prisma", "utf8");

s = s.replace(
  "// AutoCore, migração Strapi → Prisma",
  "// Lignum Gestão — schema Prisma (single-tenant)",
);

s = s.replace(
  /enum Role \{[\s\S]*?\}/,
  `enum Role {
  admin
  authenticated
  public
  sales
  finance
  read_only
}`,
);

s = s.replace(/enum SiteVehiclesVisible \{[\s\S]*?\}\n\n/, "");

s = s.replace(
  /\/\/\/ Tenant \(loja\)[\s\S]*?@@map\("tenants"\)\n\}\n\n/,
  "",
);

s = s.replace(
  /\n  \/\/\/ Tenant do utilizador[\s\S]*?tenant                       Tenant\?   @relation\(fields: \[tenantId\], references: \[id\], onDelete: Cascade\)\n/,
  "\n",
);

s = s.replace(/\n  tenantId[^\n]+\n/g, "\n");
s = s.replace(/\n  tenant[^\n]+\n/g, "\n");
s = s.replace(/\n  storefrontLeads[^\n]+\n/g, "\n");
s = s.replace(/\n  @@index\(\[tenantId\]\)\n/g, "\n");
s = s.replace(/  showInStorefront[^\n]+\n/g, "");

s = s.replace(
  /\/\/\/ Configuração da loja[\s\S]*?@@map\("erp_settings"\)\n\}/,
  `/// Configuração da fábrica — singleton (id = 1).
model ErpSetting {
  id                       Int      @id @default(1)
  companyName              String   @default("") @map("company_name")
  companyTaxId             String   @default("") @map("company_tax_id")
  companyStateReg          String   @default("") @map("company_state_reg")
  companyAddress           String   @default("") @map("company_address")
  companyCity              String   @default("") @map("company_city")
  companyState             String   @default("") @map("company_state")
  companyZip               String   @default("") @map("company_zip")
  companyPhone             String   @default("") @map("company_phone")
  companyEmail             String   @default("") @map("company_email")
  alertGiroEnabled         Boolean  @default(true) @map("alert_giro_enabled")
  alertGiroWarnDays        Int      @default(30) @map("alert_giro_warn_days")
  alertGiroCritDays        Int      @default(45) @map("alert_giro_crit_days")
  alertPromEnabled         Boolean  @default(true) @map("alert_prom_enabled")
  alertPromDaysBefore      Int      @default(7) @map("alert_prom_days_before")
  alertDocsEnabled         Boolean  @default(true) @map("alert_docs_enabled")
  alertEmailDigestEnabled  Boolean  @default(true) @map("alert_email_digest_enabled")
  financeEventNotifyDaysBefore Int  @default(1) @map("finance_event_notify_days_before")
  inboxPreEventPopupMinutes Int     @default(30) @map("inbox_pre_event_popup_minutes")
  updatedAt                DateTime @updatedAt @map("updated_at")

  @@map("erp_settings")
}`,
);

s = s.replace(
  /\/\/\/ Lead capturado[\s\S]*?@@map\("storefront_leads"\)\n\}/,
  `/// Lead CRM (single-tenant).
model StorefrontLead {
  id          Int       @id @default(autoincrement())
  name        String
  email       String
  phone       String
  message     String?
  vehicleId   Int?      @map("vehicle_id")
  vehicle     Vehicle?  @relation(fields: [vehicleId], references: [id], onDelete: SetNull)
  source      String    @default("crm")
  consentText String    @map("consent_text")
  consentAt   DateTime  @map("consent_at")
  readAt      DateTime? @map("read_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  @@index([vehicleId])
  @@index([createdAt])
  @@index([readAt])
  @@map("storefront_leads")
}`,
);

fs.writeFileSync("prisma/schema.prisma", s);
console.log("schema updated");
