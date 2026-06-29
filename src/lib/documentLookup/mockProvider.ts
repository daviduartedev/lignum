import type { DocumentLookupInput, DocumentLookupProviderResult } from "@/lib/documentLookup/types";
import { DocumentLookupError } from "@/lib/documentLookup/errors";
import { mapBrasilApiCnpjToNormalized } from "@/lib/documentLookup/mapper";
import { normalizeDocumentDigits } from "@/lib/documentLookup/normalize";

const CNPJ_NOT_FOUND = "00000000000000";

export async function mockDocumentLookup(input: DocumentLookupInput): Promise<DocumentLookupProviderResult> {
  const digits = normalizeDocumentDigits(input.document);
  if (digits === CNPJ_NOT_FOUND) {
    throw new DocumentLookupError("CNPJ_NOT_FOUND", "CNPJ não encontrado na base consultada.");
  }

  const normalized = mapBrasilApiCnpjToNormalized({
    razao_social: "Empresa Demonstração Ltda",
    nome_fantasia: "Demo Peças",
    descricao_situacao_cadastral: "ATIVA",
    logradouro: "Rua das Indústrias",
    numero: "100",
    complemento: "Galpão 2",
    bairro: "Distrito Industrial",
    municipio: "São Paulo",
    uf: "SP",
    cep: "01310100",
    ddd_telefone_1: "1134567890",
    email: "contato@demo.lignum.local",
  });

  return {
    normalized,
    rawForAudit: {
      cnpj: digits,
      mock: true,
      vendor: "mock",
    },
  };
}

export function mockRawSnapshotForAudit(digits: string): Record<string, unknown> {
  return { cnpj: digits, mock: true };
}
