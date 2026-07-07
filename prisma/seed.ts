import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { ERP_SETTING_DEFAULTS } from "../src/lib/erpSettingDefaults";
import { BOM_CATALOG_SEED } from "../src/lib/materials/bomCatalogSeed";
import { recordStockMovement } from "../src/lib/materials/stockMovement";
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

  const usedBodiesSeed = [
    {
      title: "Graneleira padrão 8,50m",
      lengthM: 8.5,
      widthM: 2.45,
      condition: "excelente" as const,
      entryValue: 4200,
      saleValue: 18500,
      status: "disponivel" as const,
      observations: "Estrutura em bom estado, pronta para revenda.",
    },
    {
      title: "Carga seca Scania R440",
      lengthM: 7.2,
      widthM: 2.4,
      condition: "bom" as const,
      entryValue: 3500,
      saleValue: 15200,
      status: "reservada" as const,
    },
    {
      title: "Plataforma metálica 7,00m",
      lengthM: 7,
      widthM: 2.5,
      heightM: 0.6,
      condition: "regular" as const,
      entryValue: 2800,
      saleValue: 9800,
      status: "disponivel" as const,
    },
    {
      title: "Baú frigorífico usado",
      lengthM: 6.8,
      widthM: 2.45,
      condition: "bom" as const,
      entryValue: 12000,
      saleValue: 28500,
      status: "em_reforma" as const,
      observations: "Aguardando troca de isolamento térmico.",
    },
    {
      title: "Sider seminovo",
      lengthM: 8.2,
      widthM: 2.48,
      condition: "excelente" as const,
      entryValue: 5100,
      saleValue: 22000,
      status: "vendida" as const,
    },
  ];

  for (const item of usedBodiesSeed) {
    const exists = await prisma.usedBody.findFirst({ where: { title: item.title } });
    if (exists) continue;
    const created = await prisma.usedBody.create({
      data: {
        title: item.title,
        lengthM: item.lengthM,
        widthM: item.widthM,
        heightM: "heightM" in item ? item.heightM : undefined,
        condition: item.condition,
        entryValue: item.entryValue,
        saleValue: item.saleValue,
        status: item.status,
        observations: item.observations,
      },
    });
    await prisma.usedBodyStatusHistory.create({
      data: {
        usedBodyId: created.id,
        fromStatus: null,
        toStatus: item.status,
        notes: "Seed inicial",
      },
    });
  }

  for (const item of BOM_CATALOG_SEED) {
    const exists = await prisma.material.findUnique({ where: { sku: item.sku } });
    if (exists) continue;

    const material = await prisma.material.create({
      data: {
        sku: item.sku,
        name: item.name,
        category: item.category,
        unit: item.unit,
        minStock: item.minStock,
        avgCost: item.avgCost,
        currentStock: 0,
      },
    });

    if (item.initialStock > 0) {
      await recordStockMovement({
        materialId: material.id,
        type: "entrada",
        quantity: item.initialStock,
        unitCost: item.avgCost,
        notes: "Seed inicial",
      });
    }
  }

  // Material deliberadamente abaixo do mínimo para testar alertas
  const lowSku = "EST-PER";
  const lowMat = await prisma.material.findUnique({ where: { sku: lowSku } });
  if (lowMat) {
    const current = Number(lowMat.currentStock);
    const min = Number(lowMat.minStock);
    if (current >= min) {
      await recordStockMovement({
        materialId: lowMat.id,
        type: "saida",
        quantity: Math.max(1, current - min + 1),
        notes: "Seed: forçar abaixo do mínimo",
      });
    }
  }

  const employeesSeed = [
    { name: "Roberto Silva", roleTitle: "Marceneiro", commissionPct: 2.5 },
    { name: "Ana Costa", roleTitle: "Pintora", commissionPct: 2 },
    { name: "Carlos Mendes", roleTitle: "Soldador", commissionPct: 2.5 },
    { name: "Juliana Rocha", roleTitle: "Montadora", commissionPct: 2 },
  ];
  for (const emp of employeesSeed) {
    const exists = await prisma.employee.findFirst({ where: { name: emp.name } });
    if (!exists) {
      await prisma.employee.create({
        data: {
          name: emp.name,
          roleTitle: emp.roleTitle,
          commissionPct: emp.commissionPct,
          isActive: true,
        },
      });
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
