/**
 * Smoke do renderer de PDF (cycle 0614 Stage 1).
 * Exercita o MESMO caminho do endpoint (renderContractPdf -> template -> buffer)
 * com dados representativos do seed (DB remoto nao acessivel do sandbox).
 * Rodar: npx tsx scripts/smoke-pdf.mts
 */
import { writeFileSync } from "node:fs";
import {
  renderContractPdf,
  type ContractWithRelations,
  type IssuerSettings,
} from "@/lib/pdf/contractPdf";

const issuer: IssuerSettings = {
  companyName: "Movix Veiculos LTDA",
  companyTaxId: "12.345.678/0001-90",
  companyStateReg: "123.456.789.000",
  companyAddress: "Av. das Industrias, 1000",
  companyCity: "Sao Paulo",
  companyState: "SP",
  companyZip: "01000-000",
  companyPhone: "(11) 4000-0000",
  companyEmail: "contato@movix.local",
};

const contract: ContractWithRelations = {
  id: 1,
  documentId: "CT-2026-0001",
  contractType: "compra_venda",
  contractValue: "78500.00",
  contractDate: new Date("2026-06-15T00:00:00Z"),
  specialClauses:
    "O veiculo passa por revisao completa antes da entrega. Garantia adicional de 90 dias para motor e cambio, conforme acordado entre as partes.",
  witness1Name: "Maria Oliveira",
  witness1Document: "111.222.333-44",
  witness2Name: "Carlos Souza",
  witness2Document: "555.666.777-88",
  vehicle: {
    brand: "Toyota",
    model: "Corolla",
    version: "XEI 2.0",
    yearManufacture: 2022,
    yearModel: 2023,
    plate: "ABC1D23",
    renavam: "01234567890",
    chassis: "9BR53ZEC4P4000001",
    color: "Prata",
    mileage: 41250,
  },
  client: {
    fullName: "Joao da Silva",
    document: "123.456.789-00",
    rg: "MG-12.345.678",
    address: "Rua das Flores, 250 - Centro",
    city: "Belo Horizonte",
    phone: "(31) 99999-0000",
    email: "joao.silva@example.com",
  },
};

const buf = await renderContractPdf(contract, issuer);
const out = process.argv[2] ?? "/tmp/contrato-compra-venda-smoke.pdf";
writeFileSync(out, buf);

const header = buf.subarray(0, 5).toString("latin1");
console.log("BYTES:", buf.length);
console.log(
  "HEADER:",
  JSON.stringify(header),
  header.startsWith("%PDF-") ? "OK (PDF valido)" : "FALHA",
);
console.log("OUT:", out);
