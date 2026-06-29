import { describe, it, expect } from "vitest";
import { mapBrasilApiCnpjToNormalized } from "@/lib/documentLookup/mapper";
import { mockDocumentLookup } from "@/lib/documentLookup/mockProvider";
import {
  __clearDocumentLookupCacheForTests,
  documentLookupCacheGet,
  documentLookupCacheSet,
} from "@/lib/documentLookup/cache";
import { applyDocumentLookupToClientForm, mergeAutofillEmptyOnly } from "@/lib/documentLookup/applyAutofill";
import { isValidCNPJ, normalizeDocumentDigits } from "@/lib/documentLookup/normalize";
import type { DocumentLookupNormalized } from "@/lib/documentLookup/types";

describe("isValidCNPJ", () => {
  it("aceita CNPJ válido", () => {
    expect(isValidCNPJ("11.222.333/0001-81")).toBe(true);
  });

  it("rejeita sequência inválida", () => {
    expect(isValidCNPJ("11.111.111/1111-11")).toBe(false);
  });
});

describe("mapBrasilApiCnpjToNormalized", () => {
  it("mapeia campos principais", () => {
    const n = mapBrasilApiCnpjToNormalized({
      razao_social: "Acme Ltda",
      nome_fantasia: "Acme",
      descricao_situacao_cadastral: "ATIVA",
      logradouro: "Rua A",
      numero: "10",
      bairro: "Centro",
      municipio: "São Paulo",
      uf: "SP",
      cep: "01310100",
      ddd_telefone_1: "1199999999",
      email: "a@acme.local",
    });
    expect(n.fullName).toBe("Acme Ltda");
    expect(n.registrationStatus).toBe("ATIVA");
    expect(n.city).toBe("São Paulo");
    expect(n.address).toContain("Rua A");
  });
});

describe("mockDocumentLookup", () => {
  it("retorna fixture para CNPJ válido", async () => {
    const r = await mockDocumentLookup({ document: "11222333000181" });
    expect(r.normalized.fullName).toContain("Demonstração");
  });

  it("lança CNPJ_NOT_FOUND para CNPJ reservado", async () => {
    await expect(mockDocumentLookup({ document: "00000000000000" })).rejects.toMatchObject({
      code: "CNPJ_NOT_FOUND",
    });
  });
});

describe("documentLookupCache", () => {
  it("armazena e devolve valor dentro do TTL", () => {
    __clearDocumentLookupCacheForTests();
    const v = { personType: "PJ", fullName: "X" } as DocumentLookupNormalized;
    documentLookupCacheSet("cnpj:1", v, 3600);
    expect(documentLookupCacheGet("cnpj:1")).toEqual(v);
  });
});

describe("mergeAutofillEmptyOnly", () => {
  it("não sobrescreve campos preenchidos", () => {
    const current = { a: "existente", b: "" };
    const next = mergeAutofillEmptyOnly(current, { a: "novo", b: "preenchido" });
    expect(next.a).toBe("existente");
    expect(next.b).toBe("preenchido");
  });

  it("aplica autofill em formulário de cliente", () => {
    const base = {
      fullName: "",
      email: "fixo@test.local",
      phone: "",
      address: "",
      zipCode: "",
      street: "",
      streetNumber: "",
      addressComplement: "",
      neighborhood: "",
      city: "",
      registrationStatus: "",
    };
    const merged = applyDocumentLookupToClientForm(base, {
      fullName: "Empresa X",
      email: "outro@test.local",
      city: "Campinas",
    });
    expect(merged.fullName).toBe("Empresa X");
    expect(merged.email).toBe("fixo@test.local");
    expect(merged.city).toBe("Campinas");
  });
});

describe("normalizeDocumentDigits", () => {
  it("remove máscara", () => {
    expect(normalizeDocumentDigits("11.222.333/0001-81")).toBe("11222333000181");
  });
});
