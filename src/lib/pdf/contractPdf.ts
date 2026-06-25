import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { ContractType } from "@prisma/client";
import { ensureFontsRegistered } from "@/lib/pdf/registerFonts";
import { ContractDocument } from "@/lib/pdf/templates/ContractDocument";
import type { ContractViewModel } from "@/lib/pdf/templates/types";

/**
 * Forma minima das relacoes carregadas pelo endpoint. Mantida estrutural
 * (nao importa os tipos completos do Prisma) para o renderer permanecer
 * desacoplado e testavel.
 */
export type ContractWithRelations = {
  id: number;
  documentId?: string | null;
  contractType: ContractType;
  contractValue: unknown;
  contractDate: Date;
  specialClauses?: string | null;
  witness1Name?: string | null;
  witness1Document?: string | null;
  witness2Name?: string | null;
  witness2Document?: string | null;
  vehicle: {
    brand: string;
    model: string;
    version?: string | null;
    yearManufacture: number;
    yearModel: number;
    plate: string;
    renavam?: string | null;
    chassis?: string | null;
    color?: string | null;
    mileage?: number | null;
  };
  client: {
    fullName: string;
    document: string;
    rg?: string | null;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
  };
};

export type IssuerSettings = {
  companyName: string;
  companyTaxId: string;
  companyStateReg: string;
  companyAddress: string;
  companyCity: string;
  companyState: string;
  companyZip: string;
  companyPhone: string;
  companyEmail: string;
};

const EMPTY_ISSUER: IssuerSettings = {
  companyName: "",
  companyTaxId: "",
  companyStateReg: "",
  companyAddress: "",
  companyCity: "",
  companyState: "",
  companyZip: "",
  companyPhone: "",
  companyEmail: "",
};

export function buildContractViewModel(
  contract: ContractWithRelations,
  issuer: IssuerSettings | null,
): ContractViewModel {
  const safeIssuer = issuer ?? EMPTY_ISSUER;
  return {
    contractNumber: contract.documentId ?? String(contract.id),
    contractDate: contract.contractDate,
    contractValue: String(contract.contractValue ?? "0"),
    specialClauses: contract.specialClauses ?? null,
    issuer: safeIssuer,
    client: {
      fullName: contract.client.fullName,
      document: contract.client.document,
      rg: contract.client.rg ?? null,
      address: contract.client.address ?? null,
      city: contract.client.city ?? null,
      phone: contract.client.phone ?? null,
      email: contract.client.email ?? null,
    },
    vehicle: {
      brand: contract.vehicle.brand,
      model: contract.vehicle.model,
      version: contract.vehicle.version ?? null,
      yearManufacture: contract.vehicle.yearManufacture,
      yearModel: contract.vehicle.yearModel,
      plate: contract.vehicle.plate,
      renavam: contract.vehicle.renavam ?? null,
      chassis: contract.vehicle.chassis ?? null,
      color: contract.vehicle.color ?? null,
      mileage: contract.vehicle.mileage ?? null,
    },
    witnesses: [
      { name: contract.witness1Name ?? null, document: contract.witness1Document ?? null },
      { name: contract.witness2Name ?? null, document: contract.witness2Document ?? null },
    ],
  };
}

export async function renderContractPdf(
  contract: ContractWithRelations,
  issuer: IssuerSettings | null,
): Promise<Buffer> {
  ensureFontsRegistered();
  const vm = buildContractViewModel(contract, issuer);
  const element = React.createElement(ContractDocument, { vm, type: contract.contractType });
  return renderToBuffer(element as Parameters<typeof renderToBuffer>[0]);
}
