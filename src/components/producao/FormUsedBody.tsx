"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import type { UsedBodyCondition, UsedBodyStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StitchPageHeader, StitchSectionCard } from "@/components/ui/stitch";
import { useCreateUsedBody, useUpdateUsedBody, useUsedBody } from "@/hooks/useUsedBodies";
import { useSuppliers } from "@/hooks/useSuppliers";
import {
  USED_BODY_CONDITION_LABELS,
  USED_BODY_STATUS_LABELS,
} from "@/lib/usedBodyLabels";
import { uploadStaffFiles } from "@/services/internal/staffUpload";
import { ArrowLeft, ImageIcon, Loader2, Save, Upload } from "lucide-react";

export type UsedBodyFormValues = {
  title: string;
  lengthM: string;
  widthM: string;
  heightM: string;
  condition: UsedBodyCondition;
  entryValue: string;
  saleValue: string;
  status: UsedBodyStatus;
  observations: string;
  supplierId: string;
  mainPhotoUrl: string;
};

export const EMPTY_USED_BODY_FORM: UsedBodyFormValues = {
  title: "",
  lengthM: "",
  widthM: "",
  heightM: "",
  condition: "bom",
  entryValue: "",
  saleValue: "",
  status: "disponivel",
  observations: "",
  supplierId: "",
  mainPhotoUrl: "",
};

function parseMoneyInput(v: string): number | undefined {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function formToPayload(values: UsedBodyFormValues, galleryUrls: string[]) {
  const lengthM = parseMoneyInput(values.lengthM);
  const widthM = parseMoneyInput(values.widthM);
  const heightRaw = values.heightM.trim();
  const heightM = heightRaw ? parseMoneyInput(heightRaw) : null;
  const entryValue = parseMoneyInput(values.entryValue);
  const saleRaw = values.saleValue.trim();
  const saleValue = saleRaw ? parseMoneyInput(saleRaw) : null;

  return {
    title: values.title.trim(),
    lengthM,
    widthM,
    heightM,
    condition: values.condition,
    entryValue,
    saleValue,
    status: values.status,
    observations: values.observations.trim() || undefined,
    supplierId: values.supplierId ? Number(values.supplierId) : null,
    mainPhotoUrl: values.mainPhotoUrl.trim() || undefined,
    galleryUrls,
  };
}

export function FormUsedBody() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : undefined;
  const isEditing = !!id;

  const { data: existing, isLoading: loadingExisting } = useUsedBody(isEditing ? id : undefined);
  const { data: suppliers } = useSuppliers();
  const createMutation = useCreateUsedBody();
  const updateMutation = useUpdateUsedBody();

  const [values, setValues] = useState<UsedBodyFormValues>(EMPTY_USED_BODY_FORM);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [mainPhotoFile, setMainPhotoFile] = useState<File | null>(null);
  const [mainPhotoPreview, setMainPhotoPreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const isMutating = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!existing) return;
    setValues({
      title: existing.title,
      lengthM: String(existing.lengthM),
      widthM: String(existing.widthM),
      heightM: existing.heightM != null ? String(existing.heightM) : "",
      condition: existing.condition,
      entryValue: String(existing.entryValue),
      saleValue: existing.saleValue != null ? String(existing.saleValue) : "",
      status: existing.status,
      observations: existing.observations ?? "",
      supplierId: existing.supplierId != null ? String(existing.supplierId) : "",
      mainPhotoUrl: existing.mainPhotoUrl ?? "",
    });
    setGalleryUrls(existing.galleryUrls ?? []);
  }, [existing]);

  useEffect(() => {
    return () => {
      if (mainPhotoPreview?.startsWith("blob:")) URL.revokeObjectURL(mainPhotoPreview);
      galleryPreviews.forEach((u) => {
        if (u.startsWith("blob:")) URL.revokeObjectURL(u);
      });
    };
  }, [mainPhotoPreview, galleryPreviews]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let mainUrl = values.mainPhotoUrl.trim();
    let extraGallery = [...galleryUrls];

    try {
      if (mainPhotoFile) {
        const [uploaded] = await uploadStaffFiles([mainPhotoFile]);
        if (uploaded) mainUrl = uploaded;
      }
      if (galleryFiles.length > 0) {
        const uploaded = await uploadStaffFiles(galleryFiles);
        extraGallery = [...extraGallery, ...uploaded];
      }
    } catch {
      // uploadStaffFiles já mostra toast via apiError no caller se necessário
    }

    const payload = {
      ...formToPayload({ ...values, mainPhotoUrl: mainUrl }, extraGallery),
    };

    if (isEditing && id) {
      await updateMutation.mutateAsync({ routeId: id, data: payload });
      router.push("/carrocerias-usadas");
      return;
    }

    await createMutation.mutateAsync(payload);
    router.push("/carrocerias-usadas");
  }

  if (isEditing && loadingExisting) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando...
      </div>
    );
  }

  const previewUrl = mainPhotoPreview ?? (values.mainPhotoUrl || null);

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      <StitchPageHeader
        title={isEditing ? "Editar carroceria usada" : "Nova carroceria usada"}
        description="Cadastre medidas, estado de conservação, valores e fotos."
        actions={
          <Button type="button" variant="outline" asChild>
            <Link href="/carrocerias-usadas">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <StitchSectionCard title="Identificação">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="title">Título / modelo</Label>
                <Input
                  id="title"
                  required
                  value={values.title}
                  onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
                  placeholder="Ex.: Graneleira Mercedes-Benz"
                />
              </div>
              <div>
                <Label htmlFor="lengthM">Comprimento (m)</Label>
                <Input
                  id="lengthM"
                  required
                  inputMode="decimal"
                  value={values.lengthM}
                  onChange={(e) => setValues((v) => ({ ...v, lengthM: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="widthM">Largura (m)</Label>
                <Input
                  id="widthM"
                  required
                  inputMode="decimal"
                  value={values.widthM}
                  onChange={(e) => setValues((v) => ({ ...v, widthM: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="heightM">Altura (m, opcional)</Label>
                <Input
                  id="heightM"
                  inputMode="decimal"
                  value={values.heightM}
                  onChange={(e) => setValues((v) => ({ ...v, heightM: e.target.value }))}
                />
              </div>
              <div>
                <Label>Estado de conservação</Label>
                <Select
                  value={values.condition}
                  onValueChange={(v) => setValues((prev) => ({ ...prev, condition: v as UsedBodyCondition }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(USED_BODY_CONDITION_LABELS) as UsedBodyCondition[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {USED_BODY_CONDITION_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isEditing ? (
                <div>
                  <Label>Status</Label>
                  <Select
                    value={values.status}
                    onValueChange={(v) => setValues((prev) => ({ ...prev, status: v as UsedBodyStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(USED_BODY_STATUS_LABELS) as UsedBodyStatus[]).map((k) => (
                        <SelectItem key={k} value={k}>
                          {USED_BODY_STATUS_LABELS[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
          </StitchSectionCard>

          <StitchSectionCard title="Valores">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="entryValue">Valor de entrada (R$)</Label>
                <Input
                  id="entryValue"
                  required
                  inputMode="decimal"
                  value={values.entryValue}
                  onChange={(e) => setValues((v) => ({ ...v, entryValue: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="saleValue">Valor de venda (R$)</Label>
                <Input
                  id="saleValue"
                  inputMode="decimal"
                  value={values.saleValue}
                  onChange={(e) => setValues((v) => ({ ...v, saleValue: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Fornecedor (opcional)</Label>
                <Select
                  value={values.supplierId || "none"}
                  onValueChange={(v) =>
                    setValues((prev) => ({ ...prev, supplierId: v === "none" ? "" : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {(suppliers ?? []).map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.attributes.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </StitchSectionCard>

          <StitchSectionCard title="Observações">
            <Textarea
              rows={4}
              value={values.observations}
              onChange={(e) => setValues((v) => ({ ...v, observations: e.target.value }))}
              placeholder="Notas sobre estado, origem ou reformas necessárias."
            />
          </StitchSectionCard>
        </div>

        <div className="space-y-6">
          <StitchSectionCard title="Foto principal">
            <div className="relative mb-4 aspect-video overflow-hidden rounded-lg border bg-muted">
              {previewUrl ? (
                <Image src={previewUrl} alt="Preview" fill className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-10 w-10 opacity-40" />
                </div>
              )}
            </div>
            <Label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted">
                <Upload className="h-4 w-4" />
                Enviar foto
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setMainPhotoFile(file);
                  setMainPhotoPreview(URL.createObjectURL(file));
                }}
              />
            </Label>
          </StitchSectionCard>

          <StitchSectionCard title="Galeria">
            <Label className="mb-2 block cursor-pointer">
              <span className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted">
                <Upload className="h-4 w-4" />
                Adicionar imagens
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length === 0) return;
                  setGalleryFiles((prev) => [...prev, ...files]);
                  setGalleryPreviews((prev) => [
                    ...prev,
                    ...files.map((f) => URL.createObjectURL(f)),
                  ]);
                }}
              />
            </Label>
            {galleryUrls.length > 0 || galleryPreviews.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                {galleryUrls.length + galleryPreviews.length} imagem(ns) na galeria
              </p>
            ) : null}
          </StitchSectionCard>

          <Button type="submit" className="w-full" disabled={isMutating}>
            {isMutating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isEditing ? "Salvar alterações" : "Cadastrar carroceria"}
          </Button>
        </div>
      </div>
    </form>
  );
}
