"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ImageIcon, Loader2, Save, Search, Sparkles, Upload, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { Label } from "@/components/ui/label";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { TimePickerField } from "@/components/ui/TimePickerField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { parseBRLMoney } from "@/lib/money";
import {
  maskIntegerReais,
  maskKm,
  maskPlate,
  numberToBRLMaskedFromReais,
  parseIntegerReais,
  parseKm,
} from "@/lib/masks";
import { strapiEntityId } from "@/lib/strapiEntity";
import { toast } from "@/lib/toast";
import { apiFetch } from "@/lib/apiClient";
import { ProfitVsFipeBlock } from "@/components/finance/ProfitVsFipeBlock";
import { VehicleColorCombobox } from "@/components/ui/VehicleColorCombobox";
import { ApiError } from "@/lib/apiErrors";
import { senatranLookup } from "@/services/internal/senatranLookup";
import { uploadFiles } from "@/services/internal/vehicleCrud";
import { useCreateVehicle, useUpdateVehicle, useVehicle } from "@/hooks/useVehicles";
import { useCreateSupplier, useSuppliers } from "@/hooks/useSuppliers";
import { normalizePlate } from "@/lib/senatran/normalize";
import { logSenatranEvent } from "@/lib/senatran/telemetry";
import type {
  FuelType,
  Supplier,
  TransmissionType,
  Vehicle,
  VehicleCautelar,
  VehicleCategoryKind,
  VehicleLegalSituation,
} from "@/types";
import { vehicleAttrs, vehicleMainPhoto } from "@/types";

const FUELS: { value: FuelType; label: string }[] = [
  { value: "flex", label: "Flex" },
  { value: "gasolina", label: "Gasolina" },
  { value: "diesel", label: "Diesel" },
  { value: "eletrico", label: "Elétrico" },
  { value: "hibrido", label: "Híbrido" },
];

const TRANSMISSIONS: { value: TransmissionType; label: string }[] = [
  { value: "automatico", label: "Automático" },
  { value: "manual", label: "Manual" },
  { value: "cvt", label: "CVT" },
];

const LEGAL: { value: VehicleLegalSituation; label: string }[] = [
  { value: "regular", label: "Regular" },
  { value: "irregular", label: "Irregular" },
  { value: "com_restricao", label: "Com restrição" },
];

const CAUTELAR_OPTS: { value: VehicleCautelar; label: string }[] = [
  { value: "nao", label: "Não" },
  { value: "leilao", label: "Leilão" },
  { value: "sinistro", label: "Sinistro" },
  { value: "leilao_sinistro", label: "Leilão e sinistro" },
  { value: "outras_restricoes", label: "Outras restrições" },
];

const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

function splitPurchaseEntryAt(iso?: string): { date: string; time: string } {
  if (!iso?.trim()) return { date: "", time: "" };
  const direct = iso.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/);
  if (direct) return { date: direct[1], time: direct[2] ?? "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function combinePurchaseEntryAt(date: string, time: string): string | undefined {
  if (!date.trim()) return undefined;
  const t = time.trim() || "00:00";
  const parsed = new Date(`${date}T${t}`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

type Provenance = "senatran" | "manual";
type FieldKey =
  | "brand"
  | "model"
  | "plate"
  | "renavam"
  | "chassis"
  | "color"
  | "fuel"
  | "yearMfr"
  | "yearModel"
  | "categoryKind"
  | "speciesCategory"
  | "registrationCity"
  | "registrationUf"
  | "legalSituation"
  | "cautelar"
  | "listingTitle";

const EMPTY_PROVENANCE: Record<FieldKey, Provenance> = {
  brand: "manual",
  model: "manual",
  plate: "manual",
  renavam: "manual",
  chassis: "manual",
  color: "manual",
  fuel: "manual",
  yearMfr: "manual",
  yearModel: "manual",
  categoryKind: "manual",
  speciesCategory: "manual",
  registrationCity: "manual",
  registrationUf: "manual",
  legalSituation: "manual",
  cautelar: "manual",
  listingTitle: "manual",
};

const FIELD_LABELS: Record<FieldKey, string> = {
  brand: "Marca",
  model: "Modelo",
  plate: "Placa",
  renavam: "RENAVAM",
  chassis: "Chassi",
  color: "Cor",
  fuel: "Combustível",
  yearMfr: "Ano fabricação",
  yearModel: "Ano modelo",
  categoryKind: "Espécie/Categoria",
  speciesCategory: "Espécie/Categoria",
  registrationCity: "Município",
  registrationUf: "UF",
  legalSituation: "Situação legal",
  cautelar: "Consulta cautelar",
  listingTitle: "Título do anúncio",
};

const FORM_STEPS = [
  { id: 1, title: "Dados básicos", description: "Consulta, identificação e dados oficiais" },
  { id: 2, title: "Compra", description: "Entrada, fornecedor e pagamento" },
  { id: 3, title: "Preços", description: "Compra, FIPE, manutenção e venda" },
  { id: 4, title: "Fotos", description: "Foto principal e galeria" },
  { id: 5, title: "Documentos", description: "Anexos do veículo" },
] as const;

interface PhotoPreview {
  file: File;
  previewUrl: string;
}

export function FormVeiculo() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : undefined;
  const isEditing = !!id;

  const { data: vehicleData } = useVehicle(isEditing ? id : undefined);
  const a = vehicleData ? vehicleAttrs(vehicleData as Vehicle) : undefined;

  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();
  const isMutating = createMutation.isPending || updateMutation.isPending;

  const [brand, setBrand] = useState(a?.brand ?? "");
  const [model, setModel] = useState(a?.model ?? "");
  const [version, setVersion] = useState(a?.version ?? "");
  const [yearMfr, setYearMfr] = useState(String(a?.year_manufacture ?? new Date().getFullYear()));
  const [yearModel, setYearModel] = useState(String(a?.year_model ?? new Date().getFullYear()));
  const [plate, setPlate] = useState(a?.plate ?? "");
  const [mileage, setMileage] = useState(String(a?.mileage ?? ""));
  const [color, setColor] = useState(a?.color ?? "");
  const [fuel, setFuel] = useState<FuelType | "">((a?.fuel as FuelType | undefined) ?? "");
  const [transmission, setTrans] = useState<TransmissionType>(a?.transmission ?? "automatico");
  const [observations, setObs] = useState(a?.observations ?? "");
  const [purchasePrice, setPurchase] = useState(String(a?.purchase_price ?? ""));
  const [sellingPrice, setSelling] = useState(String(a?.selling_price ?? ""));
  const [minimumSellingPrice, setMinimumSellingPrice] = useState(
    a?.minimum_selling_price != null && Number(a.minimum_selling_price) > 0
      ? numberToBRLMaskedFromReais(Number(a.minimum_selling_price))
      : "",
  );
  const [fipePrice, setFipe] = useState(String(a?.fipe_price ?? ""));
  const [maintCost, setMaintCost] = useState(String(a?.estimated_maintenance_cost ?? ""));
  const [fipeLoading, setFipeLoading] = useState(false);
  const [lastFipeMeta, setLastFipeMeta] = useState<{ label?: string; provider?: string } | null>(null);
  const [step, setStep] = useState<(typeof FORM_STEPS)[number]["id"]>(1);

  const initialEntry = splitPurchaseEntryAt(a?.purchase_entry_at);
  const [purchaseEntryDate, setPurchaseEntryDate] = useState(initialEntry.date);
  const [purchaseEntryTime, setPurchaseEntryTime] = useState(initialEntry.time);
  const [doorsCount, setDoorsCount] = useState<string>(a?.doors_count ? String(a.doors_count) : "");
  const [lastLicensingDate, setLastLicensingDate] = useState<string>(a?.last_licensing_date ?? "");
  const [purchaseEntryMileage, setPurchaseEntryMileage] = useState<string>(
    a?.purchase_entry_mileage != null ? String(a.purchase_entry_mileage) : "",
  );
  const [purchaseSupplierId, setPurchaseSupplierId] = useState<string>(
    a?.purchase_supplier_id != null ? String(a.purchase_supplier_id) : "",
  );
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState<string>(
    (a?.purchase_payment_json as { method?: string } | undefined)?.method ?? "",
  );
  const [purchasePaymentNotes, setPurchasePaymentNotes] = useState<string>(
    (a?.purchase_payment_json as { notes?: string } | undefined)?.notes ?? "",
  );
  const initialInstallmentPlan = (a?.purchase_payment_json as {
    installmentPlan?: {
      totalInstallments?: number;
      installmentAmount?: number;
      firstDueDate?: string;
      intervalMonths?: number;
    };
  } | undefined)?.installmentPlan;
  const [purchaseInstallments, setPurchaseInstallments] = useState(
    initialInstallmentPlan?.totalInstallments != null ? String(initialInstallmentPlan.totalInstallments) : "3",
  );
  const [purchaseInstallmentAmount, setPurchaseInstallmentAmount] = useState(
    initialInstallmentPlan?.installmentAmount != null
      ? numberToBRLMaskedFromReais(Number(initialInstallmentPlan.installmentAmount))
      : "",
  );
  const [purchaseInstallmentFirstDue, setPurchaseInstallmentFirstDue] = useState(
    initialInstallmentPlan?.firstDueDate ?? new Date().toISOString().slice(0, 10),
  );
  const [purchaseInstallmentInterval, setPurchaseInstallmentInterval] = useState(
    initialInstallmentPlan?.intervalMonths != null ? String(initialInstallmentPlan.intervalMonths) : "1",
  );
  const purchaseSuggestsParcelado = /parcel/i.test(purchasePaymentMethod);

  const [renavam, setRenavam] = useState(a?.renavam ?? "");
  const [chassis, setChassis] = useState(a?.chassis ?? "");
  const [listingTitle, setListingTitle] = useState(a?.listing_title ?? "");
  const [showInStorefront, setShowInStorefront] = useState<boolean>(a?.show_in_storefront ?? false);
  const [speciesCategory, setSpeciesCategory] = useState(a?.species_category ?? "");
  const [registrationCity, setRegistrationCity] = useState(a?.registration_city ?? "");
  const [registrationUf, setRegistrationUf] = useState(a?.registration_uf ?? "");
  const [legalSituation, setLegalSituation] = useState<VehicleLegalSituation>(
    (a?.legal_situation as VehicleLegalSituation | undefined) ?? "regular",
  );
  const [categoryKind, setCategoryKind] = useState<VehicleCategoryKind>(
    (a?.category_kind as VehicleCategoryKind | undefined) ?? "carro",
  );
  const [cautelar, setCautelar] = useState<VehicleCautelar>(
    (a?.cautelar as VehicleCautelar | undefined) ?? "nao",
  );
  const [officialExtra, setOfficialExtra] = useState<Record<string, string>>(a?.official_extra_fields ?? {});
  const [prov, setProv] = useState<Record<FieldKey, Provenance>>(() => {
    const p = a?.senatran_field_provenance;
    if (!p) return { ...EMPTY_PROVENANCE };
    return { ...EMPTY_PROVENANCE, ...p };
  });

  const [senatranLoading, setSenatranLoading] = useState(false);
  const [localLookupKey, setLocalLookupKey] = useState<string | null>(null);
  const [showRenavamFallback, setShowRenavamFallback] = useState(false);
  const [reconsultOpen, setReconsultOpen] = useState(false);
  const [reconsultNormalized, setReconsultNormalized] = useState<import("@/lib/senatran/types").SenatranNormalizedVehicle | null>(
    null,
  );

  const { data: suppliers = [] } = useSuppliers();
  const createSupplierMutation = useCreateSupplier();
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");

  const provRef = useRef(prov);
  provRef.current = prov;

  const markManual = (key: FieldKey) => {
    setProv((prev) => {
      if (prev[key] === "manual") return prev;
      logSenatranEvent("senatran_campo_sobrescrito_manualmente", { field: key });
      return { ...prev, [key]: "manual" };
    });
  };

  useEffect(() => {
    if (!isEditing || !a) return;
    setBrand(a.brand ?? "");
    setModel(a.model ?? "");
    setVersion(a.version ?? "");
    setYearMfr(String(a.year_manufacture ?? new Date().getFullYear()));
    setYearModel(String(a.year_model ?? new Date().getFullYear()));
    setPlate(a.plate ? maskPlate(String(a.plate)) : "");
    setMileage(a.mileage != null && !Number.isNaN(Number(a.mileage)) ? maskKm(String(a.mileage)) : "");
    setColor(a.color ?? "");
    setFuel((a.fuel as FuelType | undefined) ?? "");
    setTrans((a.transmission as TransmissionType) ?? "automatico");
    setObs(a.observations ?? "");
    setDoorsCount(a.doors_count != null ? String(a.doors_count) : "");
    setLastLicensingDate(a.last_licensing_date ?? "");
    const purchaseEntry = splitPurchaseEntryAt(a.purchase_entry_at ?? "");
    setPurchaseEntryDate(purchaseEntry.date);
    setPurchaseEntryTime(purchaseEntry.time);
    setPurchaseEntryMileage(a.purchase_entry_mileage != null ? String(a.purchase_entry_mileage) : "");
    setPurchaseSupplierId(a.purchase_supplier_id != null ? String(a.purchase_supplier_id) : "");
    setPurchasePaymentMethod((a.purchase_payment_json as { method?: string } | undefined)?.method ?? "");
    setPurchasePaymentNotes((a.purchase_payment_json as { notes?: string } | undefined)?.notes ?? "");
    const plan = (a.purchase_payment_json as {
      installmentPlan?: {
        totalInstallments?: number;
        installmentAmount?: number;
        firstDueDate?: string;
        intervalMonths?: number;
      };
    } | undefined)?.installmentPlan;
    setPurchaseInstallments(plan?.totalInstallments != null ? String(plan.totalInstallments) : "3");
    setPurchaseInstallmentAmount(
      plan?.installmentAmount != null ? numberToBRLMaskedFromReais(Number(plan.installmentAmount)) : "",
    );
    setPurchaseInstallmentFirstDue(plan?.firstDueDate ?? new Date().toISOString().slice(0, 10));
    setPurchaseInstallmentInterval(plan?.intervalMonths != null ? String(plan.intervalMonths) : "1");
    setRenavam(a.renavam ?? "");
    setChassis(a.chassis ?? "");
    setListingTitle(a.listing_title ?? "");
    setSpeciesCategory(a.species_category ?? "");
    setRegistrationCity(a.registration_city ?? "");
    setRegistrationUf(a.registration_uf ?? "");
    setLegalSituation((a.legal_situation as VehicleLegalSituation | undefined) ?? "regular");
    setCategoryKind((a.category_kind as VehicleCategoryKind | undefined) ?? "carro");
    setCautelar((a.cautelar as VehicleCautelar | undefined) ?? "nao");
    setOfficialExtra(a.official_extra_fields ?? {});
    setProv(
      a.senatran_field_provenance
        ? { ...EMPTY_PROVENANCE, ...a.senatran_field_provenance }
        : { ...EMPTY_PROVENANCE },
    );
    setPurchase(
      a.purchase_price != null && Number(a.purchase_price) > 0
        ? numberToBRLMaskedFromReais(Number(a.purchase_price))
        : "",
    );
    setSelling(
      a.selling_price != null && Number(a.selling_price) > 0
        ? numberToBRLMaskedFromReais(Number(a.selling_price))
        : "",
    );
    setMinimumSellingPrice(
      a.minimum_selling_price != null && Number(a.minimum_selling_price) > 0
        ? numberToBRLMaskedFromReais(Number(a.minimum_selling_price))
        : "",
    );
    setFipe(
      a.fipe_price != null && Number(a.fipe_price) > 0
        ? maskIntegerReais(String(Math.round(Number(a.fipe_price))))
        : "",
    );
    setMaintCost(
      a.estimated_maintenance_cost != null && Number(a.estimated_maintenance_cost) > 0
        ? numberToBRLMaskedFromReais(Number(a.estimated_maintenance_cost))
        : "",
    );
  }, [isEditing, a]);

  const purchase = parseBRLMoney(purchasePrice) || 0;
  const selling = parseBRLMoney(sellingPrice) || 0;
  const maint = parseBRLMoney(maintCost) || 0;
  const lucro = selling - purchase - maint;
  const margem = selling > 0 ? ((lucro / selling) * 100).toFixed(1) : "0";
  const fipeNum = parseIntegerReais(fipePrice) ?? 0;

  const applyFromNormalized = (
    n: import("@/lib/senatran/types").SenatranNormalizedVehicle,
    mode: "all" | "respectManual",
  ) => {
    const prev = provRef.current;
    const allow = (k: FieldKey) => mode === "all" || prev[k] !== "manual";
    if (allow("brand")) setBrand(n.brand);
    if (allow("model")) setModel(n.model);
    if (allow("plate")) setPlate(maskPlate(n.plate));
    if (allow("renavam")) setRenavam(n.renavam);
    if (allow("chassis")) setChassis(n.chassis.toUpperCase());
    if (allow("color")) setColor(n.color ?? "");
    if (allow("fuel")) setFuel((n.fuel as FuelType | undefined) ?? "");
    if (allow("yearMfr")) setYearMfr(String(n.yearManufacture));
    if (allow("yearModel")) setYearModel(String(n.yearModel));
    if (allow("categoryKind")) setCategoryKind(n.categoryKind);
    if (allow("speciesCategory")) setSpeciesCategory(n.speciesCategory ?? "");
    if (allow("registrationCity")) setRegistrationCity(n.registrationCity ?? "");
    if (allow("registrationUf")) setRegistrationUf(n.registrationUf ?? "");
    if (allow("legalSituation")) setLegalSituation(n.legalSituation);
    if (allow("cautelar")) setCautelar(n.cautelar);
    if (allow("listingTitle")) setListingTitle(n.listingTitleDefault || n.model);
    if (mode === "all") {
      setOfficialExtra(n.officialExtra);
    } else {
      setOfficialExtra((oe) => ({ ...oe, ...n.officialExtra }));
    }
    setProv((p) => {
      const next = { ...p };
      const keys: FieldKey[] = [
        "brand",
        "model",
        "plate",
        "renavam",
        "chassis",
        "color",
        "fuel",
        "yearMfr",
        "yearModel",
        "categoryKind",
        "speciesCategory",
        "registrationCity",
        "registrationUf",
        "legalSituation",
        "cautelar",
        "listingTitle",
      ];
      for (const k of keys) {
        if (mode === "all" || p[k] !== "manual") next[k] = "senatran";
      }
      return next;
    });
  };

  const senatranErrorMessage = (e: unknown): string => {
    if (ApiError.isApiError(e)) {
      const d = e.details as { senatranCode?: string } | undefined;
      const code = d?.senatranCode;
      if (code === "PLATE_INVALID") return "Placa inválida. Use Mercosul (ABC1D23) ou formato antigo (ABC1234).";
      if (code === "RENAVAM_LOOKUP_NOT_SUPPORTED") return "Consulta por RENAVAM indisponível ou RENAVAM não encontrado.";
      if (e.message) return e.message;
    }
    return "Não foi possível consultar os dados oficiais.";
  };

  const runPlateLookup = async (opts?: { skipLocalDedupe?: boolean }) => {
    const raw = plate.trim().toUpperCase().replace(/\s/g, "");
    if (!raw) {
      toast.error("Informe a placa.");
      return;
    }
    const key = normalizePlate(plate);
    if (!opts?.skipLocalDedupe && localLookupKey === key) {
      toast.info("Esta placa já foi consultada neste formulário.");
      return;
    }
    setSenatranLoading(true);
    setShowRenavamFallback(false);
    try {
      const res = await senatranLookup({ plate: raw });
      applyFromNormalized(res.normalized, "all");
      setLocalLookupKey(key);
      toast.success(res.cached ? "Dados recuperados (cache)." : "Dados oficiais carregados.");
    } catch (e: unknown) {
      if (ApiError.isApiError(e) && e.status === 404) {
        setShowRenavamFallback(true);
        toast.warning("Placa não encontrada. Pode tentar pelo RENAVAM ou preencher manualmente.");
      } else {
        toast.error(senatranErrorMessage(e));
      }
    } finally {
      setSenatranLoading(false);
    }
  };

  const runRenavamLookup = async () => {
    const d = renavam.replace(/\D/g, "");
    if (d.length < 9) {
      toast.error("Informe um RENAVAM válido (9 a 11 dígitos).");
      return;
    }
    setSenatranLoading(true);
    try {
      const res = await senatranLookup({ renavam: d });
      applyFromNormalized(res.normalized, "all");
      setLocalLookupKey(`r:${d}`);
      toast.success("Dados carregados pelo RENAVAM.");
      setShowRenavamFallback(false);
    } catch (e: unknown) {
      toast.error(senatranErrorMessage(e));
    } finally {
      setSenatranLoading(false);
    }
  };

  const beginReconsult = async () => {
    const raw = plate.trim().toUpperCase().replace(/\s/g, "");
    if (!raw) {
      toast.error("Informe a placa para re-consultar.");
      return;
    }
    setSenatranLoading(true);
    try {
      const res = await senatranLookup({ plate: raw });
      setReconsultNormalized(res.normalized);
      setReconsultOpen(true);
    } catch (e: unknown) {
      toast.error(senatranErrorMessage(e));
    } finally {
      setSenatranLoading(false);
    }
  };

  const confirmReconsult = () => {
    if (!reconsultNormalized) return;
    applyFromNormalized(reconsultNormalized, "respectManual");
    setReconsultOpen(false);
    setReconsultNormalized(null);
    setLocalLookupKey(normalizePlate(plate));
    toast.success("Campos atualizados conforme a re-consulta.");
  };

  const handleBuscarFipe = async () => {
    const y = parseInt(yearModel, 10);
    const plateForFipe = normalizePlate(plate);
    if (!plateForFipe && (!brand.trim() || !model.trim() || !Number.isFinite(y))) {
      toast.error("Preencha a placa ou marca, modelo e ano modelo para consultar a FIPE.");
      return;
    }
    setFipeLoading(true);
    try {
      const q = new URLSearchParams();
      if (plateForFipe) q.set("plate", plateForFipe);
      if (brand.trim()) q.set("brand", brand.trim());
      if (model.trim()) q.set("model", model.trim());
      if (Number.isFinite(y)) q.set("yearModel", String(y));
      const row = await apiFetch<{ fipePrice: number; label?: string; provider?: string }>(
        `/api/fipe/quote?${q.toString()}`,
      );
      setFipe(maskIntegerReais(String(Math.round(row.fipePrice))));
      setLastFipeMeta({ label: row.label, provider: row.provider });
      if (row.label) {
        toast.success(`FIPE (${row.provider ?? "consulta"}): ${row.label}`);
      } else {
        toast.success("Valor FIPE atualizado.");
      }
    } catch (e: unknown) {
      toast.apiError(e);
    } finally {
      setFipeLoading(false);
    }
  };

  const [mainPhotoPreviews, setMainPhotoPreviews] = useState<PhotoPreview[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<PhotoPreview[]>([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<PhotoPreview[]>([]);
  const [importedMainUrl, setImportedMainUrl] = useState<string | undefined>();
  const [importedGalleryUrls, setImportedGalleryUrls] = useState<string[]>([]);
  const [removedExistingGalleryUrls, setRemovedExistingGalleryUrls] = useState<string[]>([]);
  const [isImportingCatalog, setIsImportingCatalog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mainPhotoRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const attachmentRef = useRef<HTMLInputElement>(null);

  const existingGalleryUrls =
    vehicleData && vehicleAttrs(vehicleData as Vehicle).gallery?.data
      ? (vehicleAttrs(vehicleData as Vehicle).gallery!.data as { url: string }[]).map((m) => m.url).filter(Boolean)
      : [];
  const existingAttachmentUrls =
    vehicleData && vehicleAttrs(vehicleData as Vehicle).attachments?.data
      ? (vehicleAttrs(vehicleData as Vehicle).attachments!.data as { url: string }[]).map((m) => m.url).filter(Boolean)
      : [];

  const visibleExistingGalleryUrls = existingGalleryUrls.filter((u) => !removedExistingGalleryUrls.includes(u));
  const existingMainUrl = isEditing && vehicleData ? vehicleMainPhoto(vehicleData as Vehicle) : undefined;
  const displayMainUrl = mainPhotoPreviews[0]?.previewUrl ?? importedMainUrl ?? existingMainUrl;
  const gallerySlotCount =
    visibleExistingGalleryUrls.length + importedGalleryUrls.length + galleryPreviews.length;

  const handleImportSuggestedPhotos = async () => {
    if (!brand.trim() || !model.trim()) {
      toast.error("Informe marca e modelo antes de importar fotos sugeridas.");
      return;
    }
    setIsImportingCatalog(true);
    try {
      const data = await apiFetch<{
        urls: string[];
        mainPhotoUrl: string;
        galleryUrls: string[];
        query?: string;
      }>("/api/vehicles/suggested-photos", {
        method: "POST",
        body: JSON.stringify({
          brand: brand.trim(),
          model: model.trim(),
          version: version.trim() || undefined,
        }),
      });
      setImportedMainUrl(data.mainPhotoUrl);
      setImportedGalleryUrls(data.galleryUrls);
      setMainPhotoPreviews([]);
      setGalleryPreviews([]);
      toast.success(`Foto do Unsplash importada (${data.query ?? `${brand} ${model}`}).`);
    } catch (e) {
      toast.apiError(e);
    } finally {
      setIsImportingCatalog(false);
    }
  };

  const handleFiles = useCallback(
    (files: FileList | null, setter: React.Dispatch<React.SetStateAction<PhotoPreview[]>>, multi = false) => {
      if (!files) return;
      const arr = Array.from(files).slice(0, multi ? 20 : 1);
      const previews: PhotoPreview[] = arr.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setter(multi ? (prev) => [...prev, ...previews] : previews);
    },
    [],
  );

  const removePhoto = (setter: React.Dispatch<React.SetStateAction<PhotoPreview[]>>, index: number) => {
    setter((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    let newMainUrl: string | undefined;
    let newGalleryUrls: string[] = [];
    let newAttachmentUrls: string[] = [];

    try {
      if (mainPhotoPreviews.length > 0) {
        const urls = await uploadFiles([mainPhotoPreviews[0].file]);
        newMainUrl = urls[0];
      }
      if (galleryPreviews.length > 0) {
        newGalleryUrls = await uploadFiles(galleryPreviews.map((p) => p.file));
      }
      if (attachmentPreviews.length > 0) {
        newAttachmentUrls = await uploadFiles(attachmentPreviews.map((p) => p.file));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao enviar os arquivos.";
      toast.error(msg);
      setIsUploading(false);
      return;
    }

    const purchasePriceNum = parseBRLMoney(purchasePrice);
    const sellingPriceNum = parseBRLMoney(sellingPrice);
    const minimumSellingPriceNum = parseBRLMoney(minimumSellingPrice);
    const maintCostNum = parseBRLMoney(maintCost);
    const fipeInt = parseIntegerReais(fipePrice);

    const mainPhotoUrl =
      newMainUrl ??
      importedMainUrl ??
      (mainPhotoPreviews.length === 0 && !importedMainUrl && isEditing && vehicleData
        ? vehicleMainPhoto(vehicleData as Vehicle)
        : undefined);

    const galleryUrls = [...visibleExistingGalleryUrls, ...importedGalleryUrls, ...newGalleryUrls].filter(
      (u, i, arr) => u !== mainPhotoUrl && arr.indexOf(u) === i,
    );
    const attachmentUrls = [...existingAttachmentUrls, ...newAttachmentUrls];

    const renavamDigits = renavam.replace(/\D/g, "");
    const chassisUp = chassis.trim().toUpperCase();
    if (renavamDigits && !/^\d{9,11}$/.test(renavamDigits)) {
      toast.error("RENAVAM deve ter 9 a 11 dígitos.");
      setIsUploading(false);
      setStep(1);
      return;
    }
    if (chassisUp && !/^[A-HJ-NPR-Z0-9]{17}$/i.test(chassisUp)) {
      toast.error("Chassi inválido: 17 caracteres alfanuméricos (sem I, O nem Q).");
      setIsUploading(false);
      setStep(1);
      return;
    }

    const payload: Record<string, unknown> = {
      brand: brand.trim(),
      model: model.trim(),
      version: version.trim() || undefined,
      plate: plate.trim().toUpperCase().replace(/\s/g, ""),
      yearManufacture: Number.isFinite(parseInt(yearMfr, 10)) ? parseInt(yearMfr, 10) : new Date().getFullYear(),
      yearModel: Number.isFinite(parseInt(yearModel, 10)) ? parseInt(yearModel, 10) : new Date().getFullYear(),
      mileage: parseKm(mileage) ?? 0,
      color: color || undefined,
      fuel: fuel || undefined,
      transmission,
      purchasePrice: purchasePriceNum ?? 0,
      sellingPrice: sellingPriceNum ?? undefined,
      minimumSellingPrice: minimumSellingPriceNum ?? undefined,
      fipePrice: fipeInt != null ? fipeInt : undefined,
      estimatedMaintenanceCost: maintCostNum ?? undefined,
      observations: observations.trim() || undefined,
      doorsCount: doorsCount ? Number(doorsCount) : undefined,
      lastLicensingDate: lastLicensingDate || undefined,
      purchaseEntryAt: combinePurchaseEntryAt(purchaseEntryDate, purchaseEntryTime) || undefined,
      purchaseEntryMileage: purchaseEntryMileage ? parseKm(purchaseEntryMileage) ?? undefined : undefined,
      purchaseSupplierId: purchaseSupplierId ? Number(purchaseSupplierId) : undefined,
      purchasePaymentJson: (() => {
        if (!purchasePaymentMethod && !purchasePaymentNotes && !purchaseSuggestsParcelado) return undefined;
        const json: Record<string, unknown> = {
          method: purchasePaymentMethod || undefined,
          notes: purchasePaymentNotes.trim() || undefined,
        };
        if (purchaseSuggestsParcelado) {
          const installmentAmount = parseBRLMoney(purchaseInstallmentAmount);
          if (installmentAmount != null && installmentAmount > 0 && purchaseInstallmentFirstDue.trim()) {
            json.installmentPlan = {
              totalInstallments: Math.max(1, parseInt(purchaseInstallments, 10) || 1),
              installmentAmount,
              firstDueDate: purchaseInstallmentFirstDue,
              intervalMonths: Math.max(1, parseInt(purchaseInstallmentInterval, 10) || 1),
            };
          }
        }
        return json;
      })(),
      status: isEditing && a?.status ? a.status : "disponivel",
      mainPhotoUrl: mainPhotoUrl || undefined,
      galleryUrls,
      attachmentUrls,
      renavam: renavamDigits || "",
      chassis: chassisUp || "",
      legalSituation,
      categoryKind,
      cautelar,
      speciesCategory: speciesCategory.trim() || undefined,
      registrationCity: registrationCity.trim() || undefined,
      registrationUf: registrationUf.trim().toUpperCase().slice(0, 2) || undefined,
      listingTitle: listingTitle.trim() || undefined,
      showInStorefront,
      officialExtraFields: Object.keys(officialExtra).length > 0 ? officialExtra : undefined,
      senatranFieldProvenance: prov,
    };

    try {
      if (isEditing && vehicleData) {
        const routeId = strapiEntityId(vehicleData as Vehicle);
        await updateMutation.mutateAsync({ routeId, data: payload });
        router.push(`/veiculo/${routeId}`);
      } else {
        const result = await createMutation.mutateAsync(payload);
        router.push(`/veiculo/${strapiEntityId(result)}`);
      }
      router.refresh();
    } finally {
      setIsUploading(false);
    }
  };

  const isSubmitting = isMutating || isUploading;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] mb-1">
            {isEditing ? "Editar Veículo" : "Cadastrar Veículo"}
          </h1>
          <p className="text-sm text-[#6B7280]">
            {isEditing ? `Editando: ${a?.brand} ${a?.model}` : "Preencha os dados do novo veículo"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border border-[#E5E7EB] p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="lg:sticky lg:top-6 lg:self-start">
              <Card className="border border-[#E5E7EB] p-3 shadow-sm">
                <div className="space-y-2">
                  {FORM_STEPS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStep(item.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                        step === item.id ? "bg-[#22C55E] text-white shadow-sm" : "text-[#6B7280] hover:bg-[#F3F4F6]"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                          step === item.id ? "bg-white text-[#16A34A]" : "bg-[#F3F4F6] text-[#6B7280]"
                        }`}
                      >
                        {item.id}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{item.title}</span>
                        <span className={`block text-xs ${step === item.id ? "text-white/80" : "text-[#9CA3AF]"}`}>
                          {item.description}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
            </aside>

            <div className="min-w-0">
            <section aria-labelledby="fv-sec-dados" className={step === 1 ? "scroll-mt-3" : "hidden"}>
              <h2
                id="fv-sec-dados"
                className="mb-4 border-b border-border/80 pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Dados básicos
              </h2>
              {isEditing ? (
                <div className="mb-4 flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={senatranLoading}
                    onClick={() => void beginReconsult()}
                  >
                    {senatranLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Re-consultar SENATRAN
                  </Button>
                </div>
              ) : null}

              <div className="mx-auto flex max-w-3xl flex-col gap-8">
                <div className="space-y-4">
                  <div className={`rounded-lg border border-border/60 p-3 space-y-3 ${senatranLoading ? "animate-pulse" : ""}`}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Consulta oficial</p>
                    <div className="flex flex-wrap gap-2 items-end">
                      <div className="flex-1 min-w-[140px]">
                        <div className="flex items-center gap-2 mb-1">
                          <Label htmlFor="plate">Placa *</Label>
                          <Badge variant={prov.plate === "senatran" ? "default" : "secondary"} className="text-[10px] px-1.5">
                            {prov.plate === "senatran" ? "SENATRAN" : "Manual"}
                          </Badge>
                        </div>
                        <MaskedInput
                          id="plate"
                          mask="plate"
                          value={plate}
                          onChange={(e) => {
                            setPlate(e.target.value);
                            markManual("plate");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void runPlateLookup();
                            }
                          }}
                          required
                          placeholder="ABC-1D23"
                          maxLength={8}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0"
                        disabled={senatranLoading}
                        onClick={() => void runPlateLookup()}
                      >
                        {senatranLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
                        Buscar dados oficiais
                      </Button>
                    </div>
                    {showRenavamFallback ? (
                      <div className="flex flex-wrap gap-2 items-end pt-1 border-t border-border/40">
                        <p className="text-sm text-muted-foreground w-full">Não encontrou pela placa? Tente o RENAVAM (modo demonstração: 12345678901).</p>
                        <div className="flex-1 min-w-[160px]">
                          <Label htmlFor="renavam-fallback">RENAVAM</Label>
                          <Input
                            id="renavam-fallback"
                            inputMode="numeric"
                            value={renavam}
                            onChange={(e) => {
                              setRenavam(e.target.value);
                              markManual("renavam");
                            }}
                            placeholder="Somente números"
                          />
                        </div>
                        <Button type="button" variant="outline" size="sm" disabled={senatranLoading} onClick={() => void runRenavamLookup()}>
                          Buscar por RENAVAM
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Label htmlFor="brand">Marca *</Label>
                      <Badge variant={prov.brand === "senatran" ? "default" : "secondary"} className="text-[10px] px-1.5">
                        {prov.brand === "senatran" ? "SENATRAN" : "Manual"}
                      </Badge>
                    </div>
                    <Input
                      id="brand"
                      className={senatranLoading ? "animate-pulse" : undefined}
                      value={brand}
                      onChange={(e) => {
                        setBrand(e.target.value);
                        markManual("brand");
                      }}
                      required
                      placeholder="Ex: Toyota"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Label htmlFor="model">Modelo *</Label>
                      <Badge variant={prov.model === "senatran" ? "default" : "secondary"} className="text-[10px] px-1.5">
                        {prov.model === "senatran" ? "SENATRAN" : "Manual"}
                      </Badge>
                    </div>
                    <Input
                      id="model"
                      className={senatranLoading ? "animate-pulse" : undefined}
                      value={model}
                      onChange={(e) => {
                        setModel(e.target.value);
                        markManual("model");
                      }}
                      required
                      placeholder="Ex: Corolla"
                    />
                  </div>
                  <div>
                    <Label htmlFor="version">Versão</Label>
                    <Input id="version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Ex: XEi 2.0 Flex Aut." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Label htmlFor="yearMfr">Ano Fabricação</Label>
                        <Badge variant={prov.yearMfr === "senatran" ? "default" : "secondary"} className="text-[10px] px-1.5">
                          {prov.yearMfr === "senatran" ? "SENATRAN" : "Manual"}
                        </Badge>
                      </div>
                      <MaskedInput
                        id="yearMfr"
                        mask="year"
                        value={yearMfr}
                        onChange={(e) => {
                          setYearMfr(e.target.value);
                          markManual("yearMfr");
                        }}
                        placeholder="Ex: 2024"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Label htmlFor="yearModel">Ano Modelo</Label>
                        <Badge variant={prov.yearModel === "senatran" ? "default" : "secondary"} className="text-[10px] px-1.5">
                          {prov.yearModel === "senatran" ? "SENATRAN" : "Manual"}
                        </Badge>
                      </div>
                      <MaskedInput
                        id="yearModel"
                        mask="year"
                        value={yearModel}
                        onChange={(e) => {
                          setYearModel(e.target.value);
                          markManual("yearModel");
                        }}
                        placeholder="Ex: 2025"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Label htmlFor="renavam">RENAVAM</Label>
                      <Badge variant={prov.renavam === "senatran" ? "default" : "secondary"} className="text-[10px] px-1.5">
                        {prov.renavam === "senatran" ? "SENATRAN" : "Manual"}
                      </Badge>
                    </div>
                    <Input
                      id="renavam"
                      inputMode="numeric"
                      value={renavam}
                      onChange={(e) => {
                        setRenavam(e.target.value);
                        markManual("renavam");
                      }}
                      placeholder="9 a 11 dígitos"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Label htmlFor="chassis">Chassi</Label>
                      <Badge variant={prov.chassis === "senatran" ? "default" : "secondary"} className="text-[10px] px-1.5">
                        {prov.chassis === "senatran" ? "SENATRAN" : "Manual"}
                      </Badge>
                    </div>
                    <Input
                      id="chassis"
                      value={chassis}
                      onChange={(e) => {
                        setChassis(e.target.value.toUpperCase());
                        markManual("chassis");
                      }}
                      maxLength={17}
                      placeholder="17 caracteres (sem I, O, Q)"
                    />
                  </div>
                </div>

                <div className="space-y-4 border-t border-border/60 pt-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="doorsCount">Portas</Label>
                      <Select value={doorsCount || "__empty__"} onValueChange={(v) => setDoorsCount(v === "__empty__" ? "" : v)}>
                        <SelectTrigger id="doorsCount">
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__empty__">-</SelectItem>
                          <SelectItem value="2">2P</SelectItem>
                          <SelectItem value="4">4P</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="lastLicensingDate">Último licenciamento</Label>
                      <DatePickerField
                        id="lastLicensingDate"
                        value={lastLicensingDate}
                        onChange={setLastLicensingDate}
                        placeholder="Selecione a data"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="mileage">Quilometragem</Label>
                    <MaskedInput id="mileage" mask="km" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="Ex: 15.000" />
                  </div>
                  <div>
                    <Label htmlFor="purchaseEntryMileage">KM de entrada</Label>
                    <MaskedInput
                      id="purchaseEntryMileage"
                      mask="km"
                      value={purchaseEntryMileage}
                      onChange={(e) => setPurchaseEntryMileage(e.target.value)}
                      placeholder="Ex: 15.000"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">Cor</span>
                      <Badge variant={prov.color === "senatran" ? "default" : "secondary"} className="text-[10px] px-1.5">
                        {prov.color === "senatran" ? "SENATRAN" : "Manual"}
                      </Badge>
                    </div>
                    <VehicleColorCombobox
                      id="color"
                      value={color}
                      onChange={(v) => {
                        setColor(v);
                        markManual("color");
                      }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Label htmlFor="fuel">Combustível</Label>
                      <Badge variant={prov.fuel === "senatran" ? "default" : "secondary"} className="text-[10px] px-1.5">
                        {prov.fuel === "senatran" ? "SENATRAN" : "Manual"}
                      </Badge>
                    </div>
                    <Select
                      value={fuel || "__empty__"}
                      onValueChange={(v) => {
                        setFuel(v === "__empty__" ? "" : (v as FuelType));
                        markManual("fuel");
                      }}
                    >
                      <SelectTrigger id="fuel">
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__empty__">-</SelectItem>
                        {FUELS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="transmission">Câmbio</Label>
                    <Select value={transmission} onValueChange={(v) => setTrans(v as TransmissionType)}>
                      <SelectTrigger id="transmission">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSMISSIONS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Label htmlFor="speciesCategory">Espécie/Categoria</Label>
                      <Badge variant={prov.speciesCategory === "senatran" ? "default" : "secondary"} className="text-[10px] px-1.5">
                        {prov.speciesCategory === "senatran" ? "SENATRAN" : "Manual"}
                      </Badge>
                    </div>
                    <Input
                      id="speciesCategory"
                      value={speciesCategory}
                      onChange={(e) => {
                        setSpeciesCategory(e.target.value);
                        markManual("speciesCategory");
                      }}
                      placeholder="Ex: Automóvel"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Label htmlFor="registrationCity">Município</Label>
                        <Badge variant={prov.registrationCity === "senatran" ? "default" : "secondary"} className="text-[10px] px-1.5">
                          {prov.registrationCity === "senatran" ? "SENATRAN" : "Manual"}
                        </Badge>
                      </div>
                      <Input
                        id="registrationCity"
                        value={registrationCity}
                        onChange={(e) => {
                          setRegistrationCity(e.target.value);
                          markManual("registrationCity");
                        }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Label htmlFor="registrationUf">UF</Label>
                        <Badge variant={prov.registrationUf === "senatran" ? "default" : "secondary"} className="text-[10px] px-1.5">
                          {prov.registrationUf === "senatran" ? "SENATRAN" : "Manual"}
                        </Badge>
                      </div>
                      <Select
                        value={registrationUf ? registrationUf.toUpperCase() : "__empty__"}
                        onValueChange={(v) => {
                          setRegistrationUf(v === "__empty__" ? "" : v);
                          markManual("registrationUf");
                        }}
                      >
                        <SelectTrigger id="registrationUf">
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__empty__">-</SelectItem>
                          {UFS.map((uf) => (
                            <SelectItem key={uf} value={uf}>
                              {uf}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Label htmlFor="legalSituation">Situação legal (fonte)</Label>
                      <Badge variant={prov.legalSituation === "senatran" ? "default" : "secondary"} className="text-[10px] px-1.5">
                        {prov.legalSituation === "senatran" ? "SENATRAN" : "Manual"}
                      </Badge>
                    </div>
                    <Select
                      value={legalSituation}
                      onValueChange={(v) => {
                        setLegalSituation(v as VehicleLegalSituation);
                        markManual("legalSituation");
                      }}
                    >
                      <SelectTrigger id="legalSituation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEGAL.map((x) => (
                          <SelectItem key={x.value} value={x.value}>
                            {x.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Label htmlFor="cautelar">Consulta cautelar</Label>
                      <Badge variant={prov.cautelar === "senatran" ? "default" : "secondary"} className="text-[10px] px-1.5">
                        {prov.cautelar === "senatran" ? "SENATRAN" : "Manual"}
                      </Badge>
                    </div>
                    <Select
                      value={cautelar}
                      onValueChange={(v) => {
                        setCautelar(v as VehicleCautelar);
                        markManual("cautelar");
                      }}
                    >
                      <SelectTrigger id="cautelar">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CAUTELAR_OPTS.map((x) => (
                          <SelectItem key={x.value} value={x.value}>
                            {x.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Label htmlFor="listingTitle">Título do anúncio</Label>
                      <Badge variant={prov.listingTitle === "senatran" ? "default" : "secondary"} className="text-[10px] px-1.5">
                        {prov.listingTitle === "senatran" ? "SENATRAN" : "Manual"}
                      </Badge>
                    </div>
                    <Input
                      id="listingTitle"
                      value={listingTitle}
                      onChange={(e) => {
                        setListingTitle(e.target.value);
                        markManual("listingTitle");
                      }}
                      placeholder="Default: modelo"
                    />
                  </div>

                  <div className="rounded-lg border border-[#E5E7EB] p-3">
                    <label htmlFor="showInStorefront" className="flex items-start gap-2 cursor-pointer">
                      <input
                        id="showInStorefront"
                        type="checkbox"
                        checked={showInStorefront}
                        onChange={(e) => setShowInStorefront(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-[#374151]">
                        Exibir na vitrine
                        <span className="block text-xs text-[#6B7280]">
                          Quando a loja estiver no modo &ldquo;veículos selecionados&rdquo;, só os marcados
                          aqui (e disponíveis) aparecem no site público.
                        </span>
                      </span>
                    </label>
                  </div>

                  <div>
                    <Label htmlFor="observations">Observações</Label>
                    <Textarea
                      id="observations"
                      value={observations}
                      onChange={(e) => setObs(e.target.value)}
                      placeholder="Informações adicionais sobre o veículo..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section aria-labelledby="fv-sec-compra" className={step === 2 ? "scroll-mt-3" : "hidden"}>
              <h2
                id="fv-sec-compra"
                className="mb-4 border-b border-border/80 pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Compra (opcional)
              </h2>
              <div className="mx-auto max-w-3xl space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchaseEntryDate">Data de entrada</Label>
                    <DatePickerField
                      id="purchaseEntryDate"
                      value={purchaseEntryDate}
                      onChange={setPurchaseEntryDate}
                      placeholder="Selecione a data"
                    />
                  </div>
                  <TimePickerField
                    id="purchaseEntryTime"
                    value={purchaseEntryTime}
                    onChange={setPurchaseEntryTime}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-start">
                  <div className="md:col-span-2">
                    <Label htmlFor="purchaseSupplierId">Fornecedor / intermediador</Label>
                    <Select
                      value={purchaseSupplierId || "__empty__"}
                      onValueChange={(v) => setPurchaseSupplierId(v === "__empty__" ? "" : v)}
                    >
                      <SelectTrigger id="purchaseSupplierId">
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__empty__">-</SelectItem>
                        {Array.isArray(suppliers)
                          ? suppliers.map((s) => {
                              const a2 = (s as Supplier).attributes;
                              const name = a2?.company_name || "Fornecedor";
                              const key = String(s.documentId ?? s.id);
                              return (
                                <SelectItem key={key} value={String(s.id)}>
                                  {name}
                                </SelectItem>
                              );
                            })
                          : null}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Se já estiver cadastrado, selecione o nome. Se não, crie um novo.
                    </p>
                  </div>
                  <div className="md:pt-[22px]">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 whitespace-nowrap"
                      onClick={() => setSupplierDialogOpen(true)}
                      disabled={createSupplierMutation.isPending}
                    >
                      Novo fornecedor
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchasePaymentMethod">Forma de pagamento (texto)</Label>
                    <Input
                      id="purchasePaymentMethod"
                      value={purchasePaymentMethod}
                      onChange={(e) => setPurchasePaymentMethod(e.target.value)}
                      placeholder="Ex: à vista / parcelado / cheque / boleto"
                    />
                  </div>
                  <div>
                    <Label htmlFor="purchasePaymentNotes">Detalhes do pagamento (opcional)</Label>
                    <Input
                      id="purchasePaymentNotes"
                      value={purchasePaymentNotes}
                      onChange={(e) => setPurchasePaymentNotes(e.target.value)}
                      placeholder="Ex: 3x de 10.000, 1º venc. 10/05"
                    />
                  </div>
                </div>

                {purchaseSuggestsParcelado ? (
                  <div className="rounded-xl border border-dashed border-green-300 bg-green-50/50 p-4 space-y-4">
                    <p className="text-sm font-medium text-gray-700">Plano parcelado (A Pagar)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="purchaseInstallments">N.º de parcelas</Label>
                        <Input
                          id="purchaseInstallments"
                          type="number"
                          min={1}
                          max={120}
                          value={purchaseInstallments}
                          onChange={(e) => setPurchaseInstallments(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="purchaseInstallmentAmount">Valor da parcela (R$)</Label>
                        <MaskedInput
                          id="purchaseInstallmentAmount"
                          mask="currency"
                          value={purchaseInstallmentAmount}
                          onChange={(e) => setPurchaseInstallmentAmount(e.target.value)}
                          placeholder="0,00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="purchaseInstallmentFirstDue">1.º vencimento</Label>
                        <DatePickerField
                          id="purchaseInstallmentFirstDue"
                          value={purchaseInstallmentFirstDue}
                          onChange={setPurchaseInstallmentFirstDue}
                          placeholder="Selecione a data"
                        />
                      </div>
                      <div>
                        <Label htmlFor="purchaseInstallmentInterval">Intervalo (meses)</Label>
                        <Input
                          id="purchaseInstallmentInterval"
                          type="number"
                          min={1}
                          max={12}
                          value={purchaseInstallmentInterval}
                          onChange={(e) => setPurchaseInstallmentInterval(e.target.value)}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ao confirmar a compra no detalhe do veículo, serão geradas contas a pagar no Financeiro.
                    </p>
                  </div>
                ) : null}
              </div>
            </section>

            <section aria-labelledby="fv-sec-preco" className={step === 3 ? "scroll-mt-3" : "hidden"}>
              <h2
                id="fv-sec-preco"
                className="mb-4 border-b border-border/80 pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Precificação
              </h2>
              <div className="mx-auto max-w-2xl space-y-5">
                <div>
                  <Label htmlFor="purchasePrice">Valor de Compra (R$)</Label>
                  <MaskedInput id="purchasePrice" mask="currency" value={purchasePrice} onChange={(e) => setPurchase(e.target.value)} placeholder="Ex: 105.000,00" />
                  <p className="text-xs text-gray-400 mt-1">Campo privado, não exposto no site/app público</p>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="fipePrice">Tabela FIPE (R$)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      disabled={fipeLoading}
                      onClick={() => void handleBuscarFipe()}
                    >
                      {fipeLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3 mr-1" />}
                      Buscar FIPE
                    </Button>
                  </div>
                  <MaskedInput id="fipePrice" mask="integer_currency" value={fipePrice} onChange={(e) => setFipe(e.target.value)} placeholder="Valor inteiro (ex.: 85.000)" />
                  <p className="text-xs text-gray-400 mt-1">Consulta automática pela tabela FIPE (referência).</p>
                  {lastFipeMeta?.label ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Última consulta ({lastFipeMeta.provider ?? "FIPE"}): {lastFipeMeta.label}
                    </p>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="maintCost">Custos estimados de manutenção (R$)</Label>
                  <MaskedInput id="maintCost" mask="currency" value={maintCost} onChange={(e) => setMaintCost(e.target.value)} placeholder="Ex: 2.500,00" />
                </div>
                <div>
                  <Label htmlFor="sellingPrice">Preço de Venda Sugerido (R$)</Label>
                  <MaskedInput id="sellingPrice" mask="currency" value={sellingPrice} onChange={(e) => setSelling(e.target.value)} placeholder="Preço final ao cliente" />
                </div>
                <div>
                  <Label htmlFor="minimumSellingPrice">Preço de venda mínimo (R$)</Label>
                  <MaskedInput
                    id="minimumSellingPrice"
                    mask="currency"
                    value={minimumSellingPrice}
                    onChange={(e) => setMinimumSellingPrice(e.target.value)}
                    placeholder="Opcional — referência interna"
                  />
                  <p className="text-xs text-gray-400 mt-1">Informativo neste ciclo; não bloqueia a venda abaixo deste valor.</p>
                </div>

                {purchase > 0 && selling > 0 && (
                  <div className="bg-[#F0FDF4] border-2 border-[#86EFAC] rounded-lg p-5 space-y-3">
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Resumo Financeiro Estimado</p>
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Custo total (compra + manutenção)</span>
                      <span className="font-semibold">
                        {(purchase + maint).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Preço de venda</span>
                      <span className="font-semibold">
                        {selling.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-green-700 border-t border-green-200 pt-3">
                      <span>Lucro estimado</span>
                      <span className="text-lg">
                        {lucro.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })} ({margem}%)
                      </span>
                    </div>
                    <ProfitVsFipeBlock
                      className="border-t border-green-200 pt-3"
                      lucro={lucro}
                      precoVenda={selling}
                      valorFipe={fipeNum > 0 ? fipeNum : undefined}
                    />
                  </div>
                )}
              </div>
            </section>

            <section aria-labelledby="fv-sec-fotos" className={step === 4 ? "scroll-mt-3" : "hidden"}>
              <h2
                id="fv-sec-fotos"
                className="mb-4 border-b border-border/80 pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Fotos
              </h2>
              <div className="mx-auto max-w-3xl space-y-8">
                {brand.trim() && model.trim() && (
                  <div className="rounded-xl border border-green-100 bg-green-50/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-sm text-gray-700">
                      Buscar 1 foto no Unsplash para{" "}
                      <strong>
                        {[brand, model, version].filter(Boolean).join(" ")}
                      </strong>
                      .
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0 border-green-200 hover:bg-green-50"
                      disabled={isImportingCatalog || isUploading}
                      onClick={() => void handleImportSuggestedPhotos()}
                    >
                      {isImportingCatalog ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      Buscar foto no Unsplash
                    </Button>
                  </div>
                )}

                <div>
                  <Label className="mb-3 block">Foto Principal</Label>
                  <input
                    ref={mainPhotoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="main-photo-input"
                    onChange={(e) => {
                      setImportedMainUrl(undefined);
                      handleFiles(e.target.files, setMainPhotoPreviews, false);
                    }}
                  />
                  {!displayMainUrl ? (
                    <button
                      type="button"
                      onClick={() => mainPhotoRef.current?.click()}
                      className="w-full border-2 border-dashed border-[#E5E7EB] rounded-xl p-10 text-center hover:border-green-300 hover:bg-green-50/30 transition-all"
                    >
                      <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">Clique para selecionar a foto principal</p>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative w-48 h-32 rounded-xl overflow-hidden border border-gray-200">
                        <img src={displayMainUrl} className="w-full h-full object-cover" alt="Principal" />
                        <button
                          type="button"
                          onClick={() => {
                            if (mainPhotoPreviews.length > 0) {
                              removePhoto(setMainPhotoPreviews, 0);
                            } else if (importedMainUrl) {
                              setImportedMainUrl(undefined);
                            }
                          }}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      {existingMainUrl && !importedMainUrl && mainPhotoPreviews.length === 0 && (
                        <p className="text-xs text-muted-foreground">Foto actual — selecione outra ficheiro para substituir.</p>
                      )}
                      {importedMainUrl && mainPhotoPreviews.length === 0 && (
                        <p className="text-xs text-muted-foreground">Importada do Unsplash — guarde o cadastro para persistir.</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="mb-3 block">Galeria de Fotos</Label>
                  <input
                    ref={galleryRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    id="gallery-input"
                    onChange={(e) => handleFiles(e.target.files, setGalleryPreviews, true)}
                  />
                  <div className="grid grid-cols-4 gap-3">
                    {visibleExistingGalleryUrls.map((url, i) => (
                      <div key={`ex-${url}`} className="relative aspect-video rounded-xl overflow-hidden border border-gray-200">
                        <img src={url} className="w-full h-full object-cover" alt={`Galeria guardada ${i + 1}`} />
                        <button
                          type="button"
                          onClick={() => setRemovedExistingGalleryUrls((prev) => [...prev, url])}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {importedGalleryUrls.map((url, i) => (
                      <div key={`imp-${url}`} className="relative aspect-video rounded-xl overflow-hidden border border-green-200">
                        <img src={url} className="w-full h-full object-cover" alt={`Importada ${i + 1}`} />
                        <button
                          type="button"
                          onClick={() => setImportedGalleryUrls((prev) => prev.filter((u) => u !== url))}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {galleryPreviews.map((p, i) => (
                      <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-gray-200">
                        <img src={p.previewUrl} className="w-full h-full object-cover" alt={`Galeria ${i}`} />
                        <button
                          type="button"
                          onClick={() => removePhoto(setGalleryPreviews, i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {gallerySlotCount < 20 && (
                      <button
                        type="button"
                        onClick={() => galleryRef.current?.click()}
                        className="aspect-video rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-green-300 hover:text-green-500 transition-all"
                      >
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-xs">Adicionar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section aria-labelledby="fv-sec-docs" className={step === 5 ? "scroll-mt-3" : "hidden"}>
              <h2
                id="fv-sec-docs"
                className="mb-4 border-b border-border/80 pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Documentos
              </h2>
              <div className="mx-auto max-w-3xl">
                <Label className="mb-3 block">Anexos e Documentos</Label>
                <input
                  ref={attachmentRef}
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  multiple
                  className="hidden"
                  id="attachment-input"
                  onChange={(e) => handleFiles(e.target.files, setAttachmentPreviews, true)}
                />
                <button
                  type="button"
                  onClick={() => attachmentRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#E5E7EB] rounded-xl p-8 text-center hover:border-green-300 hover:bg-green-50/30 transition-all mb-4"
                >
                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Clique para anexar documentos</p>
                </button>

                {attachmentPreviews.length > 0 && (
                  <div className="space-y-2">
                    {attachmentPreviews.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <span className="text-sm text-gray-700 truncate">{p.file.name}</span>
                        <button type="button" onClick={() => removePhoto(setAttachmentPreviews, i)} className="text-gray-400 hover:text-red-500 ml-3 shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
          </div>

          <AlertDialog open={reconsultOpen} onOpenChange={setReconsultOpen}>
            <AlertDialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar re-consulta SENATRAN</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3 text-sm text-foreground">
                    <p className="text-muted-foreground">
                      Campos que você alterou manualmente serão preservados; os demais serão atualizados com a resposta
                      atual.
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      {(Object.keys(FIELD_LABELS) as FieldKey[]).map((key) => (
                        <li key={key}>
                          <span className="font-medium">{FIELD_LABELS[key]}:</span>{" "}
                          {prov[key] === "manual" ? (
                            <span className="text-amber-800">preservado (editado manualmente)</span>
                          ) : (
                            <span className="text-emerald-800">será atualizado</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  type="button"
                  className="bg-[#22C55E] hover:bg-[#16A34A]"
                  onClick={(e) => {
                    e.preventDefault();
                    confirmReconsult();
                  }}
                >
                  Aplicar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] pt-6">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancelar
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={step === 1 || isSubmitting}
                onClick={() => setStep((Math.max(1, step - 1) as typeof step))}
              >
                Voltar
              </Button>
              {step < FORM_STEPS.length ? (
                <Button
                  type="button"
                  className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
                  onClick={() => setStep((Math.min(FORM_STEPS.length, step + 1) as typeof step))}
                  disabled={isSubmitting}
                >
                  Avançar
                </Button>
              ) : (
                <Button
                  id="form-veiculo-submit"
                  type="submit"
                  className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
                  disabled={isSubmitting || !brand.trim() || !model.trim() || !plate.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isUploading ? "Enviando fotos..." : "Salvando..."}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isEditing ? "Salvar Alterações" : "Cadastrar Veículo"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </form>

      <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo fornecedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="new-supplier-name">Nome *</Label>
              <Input
                id="new-supplier-name"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                placeholder="Ex: João da Silva / Loja X"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSupplierDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
              disabled={!newSupplierName.trim() || createSupplierMutation.isPending}
              onClick={async () => {
                const name = newSupplierName.trim();
                if (!name) return;
                const created = await createSupplierMutation.mutateAsync({ companyName: name });
                setPurchaseSupplierId(String(created.id));
                setNewSupplierName("");
                setSupplierDialogOpen(false);
              }}
            >
              Criar e vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
