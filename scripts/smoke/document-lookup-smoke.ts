/**
 * Smoke — consulta CNPJ (mock) + cadastro cliente PJ.
 *
 * Uso: npx tsx scripts/smoke/document-lookup-smoke.ts
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { mockDocumentLookup } from "@/lib/documentLookup/mockProvider";
import { applyDocumentLookupToClientForm } from "@/lib/documentLookup/applyAutofill";
import { isValidCNPJ } from "@/lib/documentLookup/normalize";

config({ path: resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();
const TEST_CNPJ = "11.222.333/0001-81";
const TEST_EMAIL = "smoke.document.lookup@lignum.local";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("[smoke:document-lookup] DATABASE_URL não definido.");
    process.exit(1);
  }

  if (!isValidCNPJ(TEST_CNPJ)) {
    console.error("[smoke:document-lookup] CNPJ de teste inválido.");
    process.exit(1);
  }

  process.env.DOCUMENT_LOOKUP_PROVIDER = "mock";

  const lookup = await mockDocumentLookup({ document: TEST_CNPJ.replace(/\D/g, "") });
  console.log("[smoke:document-lookup] mock OK:", lookup.normalized.fullName);

  const form = applyDocumentLookupToClientForm(
    {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      zipCode: "",
      street: "",
      streetNumber: "",
      addressComplement: "",
      neighborhood: "",
      city: "",
      registrationStatus: "",
    },
    lookup.normalized,
  );

  const existing = await prisma.client.findFirst({ where: { email: TEST_EMAIL } });
  if (existing) {
    await prisma.client.delete({ where: { id: existing.id } });
  }

  const created = await prisma.client.create({
    data: {
      fullName: form.fullName || lookup.normalized.fullName,
      document: TEST_CNPJ,
      email: TEST_EMAIL,
      personType: "pj",
      phone: form.phone,
      address: form.address,
      zipCode: form.zipCode,
      street: form.street,
      streetNumber: form.streetNumber,
      neighborhood: form.neighborhood,
      city: form.city,
      registrationStatus: form.registrationStatus || lookup.normalized.registrationStatus,
    },
  });

  console.log("[smoke:document-lookup] cliente criado id=", created.id);

  await prisma.client.delete({ where: { id: created.id } });
  console.log("[smoke:document-lookup] cleanup OK");
}

main()
  .catch((e) => {
    console.error("[smoke:document-lookup] falhou:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
