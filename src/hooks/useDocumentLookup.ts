"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { applyDocumentLookupToClientForm } from "@/lib/documentLookup/applyAutofill";
import { normalizeDocumentDigits, detectDocumentKind } from "@/lib/documentLookup/normalize";
import { documentLookup } from "@/services/internal/documentLookup";
import type { ClientFormValues } from "@/components/comercial/ClientFormFields";

export function useDocumentLookupClient(onChange: (patch: Partial<ClientFormValues>) => void) {
  return useMutation({
    mutationFn: async (values: ClientFormValues) => {
      const digits = normalizeDocumentDigits(values.document);
      const kind = detectDocumentKind(digits);
      if (kind === "cpf") {
        throw new Error("Consulta de CPF não disponível. Cadastre manualmente.");
      }
      if (kind !== "cnpj") {
        throw new Error("Informe um CNPJ válido para consultar.");
      }
      return documentLookup({ document: digits, context: "client" });
    },
    onSuccess: (data, values) => {
      const merged = applyDocumentLookupToClientForm(values, data);
      onChange(merged);
      toast.success(data.cached ? "Dados do CNPJ (cache)." : "Dados do CNPJ preenchidos.");
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Falha na consulta.";
      toast.error(msg);
    },
  });
}

export type SupplierLookupFields = {
  companyName: string;
  document: string;
  phone: string;
  email: string;
  notes: string;
  zipCode: string;
  street: string;
  streetNumber: string;
  addressComplement: string;
  neighborhood: string;
  city: string;
  registrationStatus: string;
};

export function useDocumentLookupSupplier(
  onApply: (patch: Partial<SupplierLookupFields>) => void,
) {
  return useMutation({
    mutationFn: async (fields: SupplierLookupFields) => {
      const digits = normalizeDocumentDigits(fields.document);
      const kind = detectDocumentKind(digits);
      if (kind !== "cnpj") {
        throw new Error("Informe um CNPJ válido para consultar.");
      }
      return documentLookup({ document: digits, context: "supplier" });
    },
    onSuccess: (data, fields) => {
      const merged = applyDocumentLookupToClientForm(
        {
          fullName: fields.companyName,
          email: fields.email,
          phone: fields.phone,
          address: "",
          zipCode: fields.zipCode,
          street: fields.street,
          streetNumber: fields.streetNumber,
          addressComplement: fields.addressComplement,
          neighborhood: fields.neighborhood,
          city: fields.city,
          registrationStatus: fields.registrationStatus,
        },
        data,
      );
      onApply({
        companyName: merged.fullName || fields.companyName,
        email: merged.email || fields.email,
        phone: merged.phone || fields.phone,
        zipCode: merged.zipCode || fields.zipCode,
        street: merged.street || fields.street,
        streetNumber: merged.streetNumber || fields.streetNumber,
        addressComplement: merged.addressComplement || fields.addressComplement,
        neighborhood: merged.neighborhood || fields.neighborhood,
        city: merged.city || fields.city,
        registrationStatus: merged.registrationStatus || fields.registrationStatus,
      });
      toast.success(data.cached ? "Dados do CNPJ (cache)." : "Dados do CNPJ preenchidos.");
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Falha na consulta.";
      toast.error(msg);
    },
  });
}
