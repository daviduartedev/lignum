"use client";

import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePickerField } from "@/components/ui/DatePickerField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClientAttributes } from "@/types";

export type ClientFormValues = {
  fullName: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  personType: "" | "pf" | "pj";
  rg: string;
  maritalStatus: string;
  profession: string;
  zipCode: string;
  nationality: string;
  neighborhood: string;
  street: string;
  city: string;
  streetNumber: string;
  addressComplement: string;
  birthDate: string;
};

export const EMPTY_CLIENT_FORM: ClientFormValues = {
  fullName: "",
  document: "",
  email: "",
  phone: "",
  address: "",
  personType: "",
  rg: "",
  maritalStatus: "",
  profession: "",
  zipCode: "",
  nationality: "",
  neighborhood: "",
  street: "",
  city: "",
  streetNumber: "",
  addressComplement: "",
  birthDate: "",
};

export function clientAttrsToFormValues(a: ClientAttributes): ClientFormValues {
  return {
    fullName: a.full_name || "",
    document: a.document || "",
    email: a.email || "",
    phone: a.phone || "",
    address: a.address || "",
    personType: a.person_type === "PF" ? "pf" : a.person_type === "PJ" ? "pj" : "",
    rg: a.rg || "",
    maritalStatus: a.marital_status || "",
    profession: a.profession || "",
    zipCode: a.zip_code || "",
    nationality: a.nationality || "",
    neighborhood: a.neighborhood || "",
    street: a.street || "",
    city: a.city || "",
    streetNumber: a.street_number || "",
    addressComplement: a.address_complement || "",
    birthDate: a.birth_date || "",
  };
}

export function clientFormValuesToPayload(values: ClientFormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    fullName: values.fullName.trim(),
    document: values.document.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim() || undefined,
    address: values.address.trim() || undefined,
    personType: values.personType || undefined,
    zipCode: values.zipCode.trim() || undefined,
    nationality: values.nationality.trim() || undefined,
    neighborhood: values.neighborhood.trim() || undefined,
    street: values.street.trim() || undefined,
    city: values.city.trim() || undefined,
    streetNumber: values.streetNumber.trim() || undefined,
    addressComplement: values.addressComplement.trim() || undefined,
  };
  if (values.personType === "pf") {
    payload.rg = values.rg.trim() || undefined;
    payload.maritalStatus = values.maritalStatus.trim() || undefined;
    payload.profession = values.profession.trim() || undefined;
    payload.birthDate = values.birthDate.trim() || undefined;
  }
  return payload;
}

type ClientFormFieldsProps = {
  values: ClientFormValues;
  onChange: (patch: Partial<ClientFormValues>) => void;
  idPrefix?: string;
};

export function ClientFormFields({ values, onChange, idPrefix = "client" }: ClientFormFieldsProps) {
  const isPf = values.personType === "pf";
  const isPj = values.personType === "pj";

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-fullName`}>Nome completo *</Label>
        <Input
          id={`${idPrefix}-fullName`}
          value={values.fullName}
          onChange={(e) => onChange({ fullName: e.target.value })}
          required
          placeholder={isPj ? "Ex.: Auto Peças Ltda." : "Ex.: Maria Silva"}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-personType`}>Tipo de pessoa</Label>
        <Select
          value={values.personType || "__empty__"}
          onValueChange={(v) => onChange({ personType: v === "__empty__" ? "" : (v as "pf" | "pj") })}
        >
          <SelectTrigger id={`${idPrefix}-personType`}>
            <SelectValue placeholder="Selecione (opcional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__empty__">Não informado</SelectItem>
            <SelectItem value="pf">Pessoa física (PF)</SelectItem>
            <SelectItem value="pj">Pessoa jurídica (PJ)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-document`}>CPF ou CNPJ *</Label>
          <MaskedInput
            id={`${idPrefix}-document`}
            mask="cpf_cnpj"
            value={values.document}
            onChange={(e) => onChange({ document: e.target.value })}
            required
            placeholder="000.000.000-00 ou 00.000.000/0001-00"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-phone`}>Telefone / WhatsApp</Label>
          <MaskedInput
            id={`${idPrefix}-phone`}
            mask="phone"
            value={values.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-email`}>E-mail *</Label>
        <Input
          id={`${idPrefix}-email`}
          type="email"
          value={values.email}
          onChange={(e) => onChange({ email: e.target.value })}
          required
          placeholder="cliente@email.com"
        />
      </div>

      {isPf ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-rg`}>RG</Label>
            <Input
              id={`${idPrefix}-rg`}
              value={values.rg}
              onChange={(e) => onChange({ rg: e.target.value })}
              placeholder="Opcional"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-birthDate`}>Data de nascimento</Label>
            <DatePickerField
              id={`${idPrefix}-birthDate`}
              value={values.birthDate}
              onChange={(birthDate) => onChange({ birthDate })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-maritalStatus`}>Estado civil</Label>
            <Input
              id={`${idPrefix}-maritalStatus`}
              value={values.maritalStatus}
              onChange={(e) => onChange({ maritalStatus: e.target.value })}
              placeholder="Ex.: Solteiro(a)"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-profession`}>Profissão</Label>
            <Input
              id={`${idPrefix}-profession`}
              value={values.profession}
              onChange={(e) => onChange({ profession: e.target.value })}
              placeholder="Opcional"
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor={`${idPrefix}-nationality`}>Nacionalidade</Label>
            <Input
              id={`${idPrefix}-nationality`}
              value={values.nationality}
              onChange={(e) => onChange({ nationality: e.target.value })}
              placeholder="Ex.: Brasileira"
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-3 rounded-lg border border-[#E5E7EB] p-4">
        <p className="text-sm font-medium text-[#374151]">Endereço estruturado</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-zipCode`}>CEP</Label>
            <Input
              id={`${idPrefix}-zipCode`}
              value={values.zipCode}
              onChange={(e) => onChange({ zipCode: e.target.value })}
              placeholder="00000-000"
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor={`${idPrefix}-street`}>Rua / Avenida</Label>
            <Input
              id={`${idPrefix}-street`}
              value={values.street}
              onChange={(e) => onChange({ street: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-streetNumber`}>Número</Label>
            <Input
              id={`${idPrefix}-streetNumber`}
              value={values.streetNumber}
              onChange={(e) => onChange({ streetNumber: e.target.value })}
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor={`${idPrefix}-addressComplement`}>Complemento</Label>
            <Input
              id={`${idPrefix}-addressComplement`}
              value={values.addressComplement}
              onChange={(e) => onChange({ addressComplement: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-neighborhood`}>Bairro</Label>
            <Input
              id={`${idPrefix}-neighborhood`}
              value={values.neighborhood}
              onChange={(e) => onChange({ neighborhood: e.target.value })}
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor={`${idPrefix}-city`}>Cidade</Label>
            <Input
              id={`${idPrefix}-city`}
              value={values.city}
              onChange={(e) => onChange({ city: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-address`}>Endereço (texto livre / legado)</Label>
        <Textarea
          id={`${idPrefix}-address`}
          value={values.address}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder="Rua, número, localidade - campo legado"
          rows={3}
        />
      </div>
    </div>
  );
}
