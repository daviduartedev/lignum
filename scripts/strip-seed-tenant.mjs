import fs from "node:fs";

function stripSeedFile(file) {
  let s = fs.readFileSync(file, "utf8");

  s = s.replace(
    /import \{ ensureDefaultTenant, ensureSecondTenant, ensureSuperAdmin, seedSecondTenantData \} from "\.\/seedTenant";\n/,
    "",
  );

  s = s.replace(
    /\/\/ Garante o Tenant "default"\.[\s\S]*?console\.log\(`\[seed\] Tenant default id=\$\{tenantId\} \(Loja Padrão\)\.`\);\n\n/,
    "",
  );

  s = s.replace(
    /\/\/ ErpSetting agora é 1:1 por tenant \(não mais singleton id=1\)\.\n  await prisma\.erpSetting\.upsert\(\{\n    where: \{ tenantId \},\n    create: \{ tenant: \{ connect: \{ id: tenantId \} \} \},\n    update: \{\},\n  \}\);\n\n/,
    `  await prisma.erpSetting.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  });

`,
  );

  s = s.replace(
    /  await seedLegacyDemo\(admin\.id, tenantId\);\n  await seedDashboardShowcase\(admin\.id, tenantId\);\n  await seedBulkMass\(prisma, admin\.id, tenantId\);\n\n  \/\/ Stage 5: segunda loja \+ super-admin[\s\S]*?console\.log\(`\[seed\] Tenant B id=\$\{tenantBId\} \(Loja B\) \+ super_admin criados\.`\);\n\n/,
    `  await seedLegacyDemo(admin.id);
  await seedDashboardShowcase(admin.id);
  await seedBulkMass(prisma, admin.id);

`,
  );

  s = s.replace(/, tenantId: number/g, "");
  s = s.replace(/\(prisma: PrismaClient, adminId: number, tenantId: number\)/, "(prisma: PrismaClient, adminId: number)");
  s = s.replace(/\n\s*tenantId,\n/g, "\n");
  s = s.replace(/\n\s*tenantId,\n/g, "\n");
  s = s.replace(/, tenantId/g, "");
  s = s.replace(/\{ \.\.\.sup, tenantId \}/g, "{ ...sup }");
  s = s.replace(/  console\.log\(`- admin Loja B: admin\.lojab@seed\.local \/ \$\{seedPassword\}`\);\n/, "");
  s = s.replace(/  console\.log\(`- super_admin: superadmin@movix\.local \/ \$\{seedPassword\}`\);\n/, "");

  fs.writeFileSync(file, s);
}

stripSeedFile("prisma/seed.ts");
stripSeedFile("prisma/seedBulk.ts");
console.log("seed files stripped for single-tenant");
