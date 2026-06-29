import { maskCEP, maskPhoneBR } from "@/lib/masks";
import { composeAddress } from "@/lib/documentLookup/normalize";
import type { DocumentLookupNormalized } from "@/lib/documentLookup/types";

/** Resposta típica BrasilAPI GET /api/cnpj/v1/{cnpj} */
export type BrasilApiCnpjPayload = {
  razao_social?: string;
  nome_fantasia?: string;
  descricao_situacao_cadastral?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  ddd_telefone_1?: string;
  email?: string | null;
};

function cleanOptional(value: unknown): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  return s || undefined;
}

function formatPhoneFromDdd(dddPhone?: string): string | undefined {
  if (!dddPhone) return undefined;
  const digits = dddPhone.replace(/\D/g, "");
  if (digits.length < 10) return undefined;
  return maskPhoneBR(digits);
}

export function mapBrasilApiCnpjToNormalized(payload: BrasilApiCnpjPayload): DocumentLookupNormalized {
  const fullName = cleanOptional(payload.razao_social) ?? cleanOptional(payload.nome_fantasia) ?? "";
  const tradeName = cleanOptional(payload.nome_fantasia);
  const zipRaw = cleanOptional(payload.cep)?.replace(/\D/g, "");
  const zipCode = zipRaw ? maskCEP(zipRaw) : undefined;
  const street = cleanOptional(payload.logradouro);
  const streetNumber = cleanOptional(payload.numero);
  const addressComplement = cleanOptional(payload.complemento);
  const neighborhood = cleanOptional(payload.bairro);
  const city = cleanOptional(payload.municipio);
  const state = cleanOptional(payload.uf)?.toUpperCase().slice(0, 2);
  const address = composeAddress({
    street,
    streetNumber,
    addressComplement,
    neighborhood,
    city,
    state,
    zipCode,
  });

  return {
    personType: "PJ",
    fullName,
    tradeName: tradeName && tradeName !== fullName ? tradeName : undefined,
    registrationStatus: cleanOptional(payload.descricao_situacao_cadastral),
    email: cleanOptional(payload.email ?? undefined),
    phone: formatPhoneFromDdd(cleanOptional(payload.ddd_telefone_1)),
    street,
    streetNumber,
    addressComplement,
    neighborhood,
    city,
    state,
    zipCode,
    address,
  };
}
