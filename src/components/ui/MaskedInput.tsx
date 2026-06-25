"use client";

import * as React from "react";
import { Input } from "./input";
import { cn } from "./utils";
import {
  maskBRL,
  maskCEP,
  maskCNPJ,
  maskCPF,
  maskCPFCNPJ,
  maskDecimal2,
  maskIntegerReais,
  maskKm,
  maskPhoneBR,
  maskPlate,
  maskQty,
  maskYear,
} from "@/lib/masks";

export type MaskKind =
  | "cpf"
  | "cnpj"
  | "cpf_cnpj"
  | "phone"
  | "cep"
  | "currency"
  | "integer_currency"
  | "km"
  | "year"
  | "plate"
  | "decimal2"
  | "qty";

const apply: Record<MaskKind, (v: string) => string> = {
  cpf: maskCPF,
  cnpj: maskCNPJ,
  cpf_cnpj: maskCPFCNPJ,
  phone: maskPhoneBR,
  cep: maskCEP,
  currency: maskBRL,
  integer_currency: maskIntegerReais,
  km: maskKm,
  year: maskYear,
  plate: maskPlate,
  decimal2: maskDecimal2,
  qty: maskQty,
};

export interface MaskedInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange" | "type"> {
  mask: MaskKind;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function MaskedInput({ mask, value, onChange, className, ...rest }: MaskedInputProps) {
  const inputMode: React.HTMLAttributes<HTMLInputElement>["inputMode"] =
    mask === "currency" || mask === "integer_currency" || mask === "km" || mask === "qty" || mask === "year"
      ? "numeric"
      : mask === "decimal2"
        ? "decimal"
        : "text";

  return (
    <Input
      {...rest}
      type="text"
      inputMode={inputMode}
      autoComplete="off"
      className={cn(className)}
      value={value}
      onChange={(e) => {
        const next = apply[mask](e.target.value);
        if (next === value) return;
        const el = e.target;
        const synthetic = {
          ...e,
          target: { ...el, value: next },
          currentTarget: { ...el, value: next },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(synthetic);
      }}
    />
  );
}
