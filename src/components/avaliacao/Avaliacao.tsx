"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Upload, Star, Save, Loader2, AlertCircle, ClipboardList } from "lucide-react";
import { useVehicle } from "@/hooks/useVehicles";
import { useEvaluationsByVehiclePage, useCreateEvaluation } from "@/hooks/useEvaluations";
import { Pagination } from "@/components/ui/pagination";
import { ListingStatCell } from "@/components/ui/ListingStatCell";
import { uploadFiles } from "@/services/internal/vehicleCrud";
import { strapiEntityId } from "@/lib/strapiEntity";
import { vehicleDisplayName, type Evaluation, type Vehicle } from "@/types";
import { toast } from "@/lib/toast";

type Pontos = Record<string, boolean>;

const PONTOS_INICIAIS: Pontos = {
  pintura: false,
  motor: false,
  cambio: false,
  suspensao: false,
  freios: false,
  pneus: false,
  eletrica: false,
  interior: false,
  documentacao: false,
  historico: false,
};

type Props = {
  /** Quando definido (rota dinâmica), avaliação fica associada a este veículo. */
  routeId?: string;
};

export function Avaliacao({ routeId: routeIdProp }: Props) {
  const router = useRouter();
  const params = useParams();
  const id = routeIdProp ?? (typeof params?.id === "string" ? params.id : undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: vehicle, isLoading: loadingVehicle, isError: errorVehicle } = useVehicle(id);
  const vehicleNumericId = vehicle?.id;
  const [evalPage, setEvalPage] = useState(1);
  const { data: evalPageData, isLoading: loadingEvaluations } = useEvaluationsByVehiclePage(vehicleNumericId, evalPage);
  const evaluationsPayload = evalPageData?.items;
  const evalMeta = evalPageData?.meta;

  useEffect(() => {
    setEvalPage(1);
  }, [vehicleNumericId]);

  const [pontos, setPontos] = useState<Pontos>(PONTOS_INICIAIS);
  const [observations, setObservations] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const createMutation = useCreateEvaluation();
  const isSubmitting = createMutation.isPending;

  const evaluations = useMemo(() => {
    return Array.isArray(evaluationsPayload) ? evaluationsPayload : [];
  }, [evaluationsPayload]);

  const latestDraft = useMemo(() => {
    for (const raw of evaluations) {
      const item = raw as Evaluation | Record<string, unknown>;
      const a =
        (item as Evaluation).attributes ||
        (item as { attributes?: Record<string, unknown> }).attributes ||
        (item as Record<string, unknown>);
      const cj = a.checklist_json;
      if (cj && typeof cj === "object" && (cj as { status?: string }).status === "draft") {
        return cj as unknown;
      }
      // compat: draft antigo pode estar em `checklistJson` no nó plano
      if (cj && typeof cj === "object" && (cj as { status?: string }).status === "draft") return cj as unknown;
    }
    return null;
  }, [evaluations]);

  useEffect(() => {
    if (!latestDraft) return;
    if (typeof latestDraft !== "object" || latestDraft === null) return;
    const pontosDraft = (latestDraft as { pontos?: unknown }).pontos;
    if (pontosDraft && typeof pontosDraft === "object") {
      setPontos((prev) => ({ ...prev, ...(pontosDraft as Record<string, boolean>) }));
    }
    const obs = (latestDraft as { observations?: unknown }).observations;
    if (typeof obs === "string") setObservations(obs);
  }, [latestDraft]);

  useEffect(() => {
    if (!evalMeta) return;
    if (evalPage > evalMeta.totalPages) setEvalPage(Math.max(1, evalMeta.totalPages));
  }, [evalMeta, evalPage]);

  const evaluationHistoryRows = useMemo(() => {
    return evaluations
      .map((raw, index) => {
        const item = raw as Evaluation | Record<string, unknown>;
        const a =
          (item as Evaluation).attributes ||
          (item as { attributes?: Record<string, unknown> }).attributes ||
          (item as Record<string, unknown>);
        const score = typeof a.score === "number" ? a.score : Number(a.score) || 0;
        const notes = String(a.technical_notes || a.observations || "").trim();
        const created = String(a.createdAt || "");
        const nPhotos = Array.isArray(a.photo_urls) ? a.photo_urls.length : 0;
        const preview = notes.length > 140 ? `${notes.slice(0, 140)}…` : notes;
        const stableId = (item as Evaluation).documentId ?? (item as Evaluation).id;
        return {
          key: stableId != null ? String(stableId) : `eval-${index}-${created}`,
          score,
          preview: preview || "-",
          nPhotos,
          created,
          sort: created ? new Date(created).getTime() : 0,
        };
      })
      .sort((x, y) => y.sort - x.sort);
  }, [evaluations]);

  const totalChecks = Object.values(pontos).filter(Boolean).length;
  const keysLen = Object.keys(pontos).length;
  const score = keysLen ? (totalChecks / keysLen) * 10 : 0;

  const custoEstimado =
    (!pontos.pneus ? 2800 : 0) + (!pontos.pintura ? 3500 : 0) + 350;

  const displayTitle = useMemo(() => {
    if (!vehicle) return "";
    return vehicleDisplayName(vehicle);
  }, [vehicle]);

  const onPickPhotos = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const next = Array.from(files).slice(0, 12);
    setPhotoFiles(next);
    setPhotoPreviews((prev) => {
      prev.forEach(URL.revokeObjectURL);
      return next.map((f) => URL.createObjectURL(f));
    });
  }, []);

  const handleSave = async (mode: "draft" | "final") => {
    if (!id || !vehicle) return;

    let photoUrls: string[] = [];
    if (photoFiles.length > 0) {
      try {
        photoUrls = await uploadFiles(photoFiles);
      } catch {
        toast.error("Falha ao enviar as fotos. Tente arquivos menores ou outro formato.");
        return;
      }
    }

    const payload: Record<string, unknown> = {
      score: Math.round(score * 10) / 10,
      technicalNotes: observations.trim() || undefined,
      checklistJson: {
        version: "1",
        status: mode,
        pontos,
        observations: observations.trim() || undefined,
      },
      vehicleId: vehicle.id,
      ...(photoUrls.length ? { photoUrls } : {}),
    };

    await createMutation.mutateAsync(payload);
    const vidRel = strapiEntityId(vehicle as Vehicle) || id;
    router.push(`/veiculo/${vidRel}`);
  };

  if (!id) {
    return (
      <div className="space-y-6 max-w-lg">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Card className="p-6 border border-border/80 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <ClipboardList className="w-8 h-8 text-emerald-600" aria-hidden />
            <h1 className="text-xl font-semibold text-foreground">Avaliação técnica</h1>
          </div>
          <ol className="text-sm text-muted-foreground mb-4 list-decimal list-inside space-y-2">
            <li>
              Abra <strong>Estoque</strong> no menu lateral.
            </li>
            <li>Clique num veículo para abrir a ficha.</li>
            <li>
              Use o botão <strong>Avaliação</strong> na ficha, a URL ficará{" "}
              <code className="text-xs bg-muted px-1 rounded">/avaliacao/&lt;id&gt;</code>.
            </li>
          </ol>
          <p className="text-xs text-muted-foreground mb-4">
            O item de menu &quot;Avaliação&quot; sem veículo selecionado mostra esta ajuda; o registro na API só ocorre
            com veículo associado.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/estoque">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Ir para o estoque</Button>
            </Link>
            <Link href="/avaliacao/standby">
              <Button variant="outline" type="button">
                Lista standby (não compra)
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            A <strong>avaliação de compra</strong> agora é acessada pelo <strong>menu lateral</strong> (ou pela URL{" "}
            <code className="text-xs bg-muted px-1 rounded">/avaliacao/compra/&lt;id&gt;</code>).
          </p>
        </Card>
      </div>
    );
  }

  if (loadingVehicle) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-10 h-10 mb-4 animate-spin text-emerald-600" aria-hidden />
        <p className="text-sm font-medium text-foreground">Carregando dados do veículo…</p>
      </div>
    );
  }

  if (errorVehicle || !vehicle) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Veículo não encontrado</AlertTitle>
          <AlertDescription className="text-red-700">
            Não foi possível carregar este veículo. Verifique o link ou volte ao estoque.
          </AlertDescription>
        </Alert>
        <Link href="/estoque">
          <Button variant="outline">Estoque</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} disabled={isSubmitting}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] mb-1">Avaliação técnica</h1>
          <p className="text-sm text-[#6B7280]">{displayTitle}</p>
          {!loadingEvaluations && evaluations.length > 0 && (
            <p className="text-xs text-[#9CA3AF] mt-1">{evaluations.length} registro(s) no histórico, ver tabela abaixo.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 border border-[#E5E7EB]">
          <h2 className="text-lg font-semibold text-[#111827] mb-6">Checklist técnico</h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-[#111827]">Mecânica</h3>
                {(["motor", "cambio", "suspensao", "freios"] as const).map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Checkbox
                      id={item}
                      checked={pontos[item]}
                      onCheckedChange={(checked) => setPontos({ ...pontos, [item]: checked === true })}
                    />
                    <Label htmlFor={item} className="cursor-pointer capitalize">
                      {item}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-[#111827]">Estética</h3>
                {(["pintura", "pneus", "interior"] as const).map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Checkbox
                      id={item}
                      checked={pontos[item]}
                      onCheckedChange={(checked) => setPontos({ ...pontos, [item]: checked === true })}
                    />
                    <Label htmlFor={item} className="cursor-pointer capitalize">
                      {item}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="space-y-4 sm:col-span-2">
                <h3 className="text-sm font-medium text-[#111827]">Documentação</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["eletrica", "documentacao", "historico"] as const).map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <Checkbox
                        id={item}
                        checked={pontos[item]}
                        onCheckedChange={(checked) => setPontos({ ...pontos, [item]: checked === true })}
                      />
                      <Label htmlFor={item} className="cursor-pointer capitalize">
                        {item === "eletrica" ? "Elétrica" : item}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="obs-av">Observações da avaliação</Label>
              <Textarea
                id="obs-av"
                placeholder="Detalhe os pontos de atenção encontrados..."
                rows={4}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </div>

            <div>
              <Label>Custos estimados de manutenção</Label>
              <div className="space-y-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Troca de pneus (se aplicável)</span>
                  <span className="text-[#111827] font-medium">R$ {!pontos.pneus ? "2.800" : "0"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Pintura / detalhamento (se aplicável)</span>
                  <span className="text-[#111827] font-medium">R$ {!pontos.pintura ? "3.500" : "0"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Limpeza detalhada</span>
                  <span className="text-[#111827] font-medium">R$ 350</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-[#E5E7EB]">
                  <span className="text-[#111827] font-medium">Total estimado</span>
                  <span className="text-[#111827] font-semibold">R$ {custoEstimado.toLocaleString("pt-BR")}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 border border-[#E5E7EB]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-16 h-16 bg-[#F0FDF4] rounded-lg flex items-center justify-center">
                <Star className="w-8 h-8 text-[#22C55E]" />
              </div>
              <div>
                <div className="text-3xl font-semibold text-[#111827]">{score.toFixed(1)}</div>
                <div className="text-sm text-[#6B7280]">Pontuação global</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[#6B7280]">Itens aprovados</span>
                <span className="text-sm font-medium text-[#111827]">
                  {totalChecks}/{keysLen}
                </span>
              </div>
              <div className="w-full bg-[#E5E7EB] rounded-full h-2">
                <div
                  className="bg-[#22C55E] h-2 rounded-full transition-all"
                  style={{ width: `${keysLen ? (totalChecks / keysLen) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
              <div className="text-xs text-[#6B7280] mb-2">Estado</div>
              <Badge
                className={
                  score >= 8
                    ? "bg-[#DCFCE7] text-[#15803D] border-0"
                    : score >= 6
                      ? "bg-[#FEF3C7] text-[#B45309] border-0"
                      : "bg-[#FEE2E2] text-[#B91C1C] border-0"
                }
              >
                {score >= 8 ? "Excelente" : score >= 6 ? "Bom" : "Requer atenção"}
              </Badge>
            </div>
          </Card>

          <Card className="p-6 border border-[#E5E7EB]">
            <h3 className="text-sm font-medium text-[#111827] mb-4">Fotos da avaliação</h3>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={onPickPhotos}
            />
            <button
              type="button"
              className="w-full border-2 border-dashed border-[#E5E7EB] rounded-lg p-6 text-center hover:bg-gray-50 transition-colors"
              onClick={() => fileRef.current?.click()}
              disabled={isSubmitting}
            >
              <Upload className="w-8 h-8 text-[#6B7280] mx-auto mb-2" />
              <p className="text-xs text-[#6B7280]">
                {photoFiles.length ? `${photoFiles.length} arquivo(s) selecionado(s)` : "Toque para adicionar fotos"}
              </p>
            </button>
            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                {photoPreviews.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt="" className="h-20 w-full object-cover rounded-md border" />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card className="p-6 border border-[#E5E7EB]">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Histórico de avaliações deste veículo</h2>
        {loadingEvaluations ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" aria-hidden />
            Carregando histórico…
          </div>
        ) : evaluationHistoryRows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Ainda não há avaliações gravadas para este veículo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left text-xs font-medium text-[#6B7280] pb-3">Data</th>
                  <th className="text-left text-xs font-medium text-[#6B7280] pb-3 w-[90px]">Score</th>
                  <th className="text-left text-xs font-medium text-[#6B7280] pb-3">Observações / notas</th>
                  <th className="text-right text-xs font-medium text-[#6B7280] pb-3 w-[80px]">Fotos</th>
                </tr>
              </thead>
              <tbody>
                {evaluationHistoryRows.map((row) => (
                  <tr key={row.key} className="border-b border-[#E5E7EB] last:border-0">
                    <td className="py-3 align-middle">
                      <ListingStatCell hideLabel
                        label="Data"
                        value={
                          row.created
                            ? new Date(row.created).toLocaleString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"
                        }
                        valueClassName="font-normal whitespace-nowrap"
                      />
                    </td>
                    <td className="py-3 align-middle">
                      <ListingStatCell hideLabel
                        label="Score"
                        value={Number.isFinite(row.score) ? row.score.toFixed(1) : "-"}
                      />
                    </td>
                    <td className="py-3 max-w-[420px] whitespace-normal text-[#6B7280]">{row.preview}</td>
                    <td className="py-3 align-middle">
                      <ListingStatCell hideLabel label="Fotos" value={row.nPhotos} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {evalMeta && evaluationHistoryRows.length > 0 ? (
          <Pagination
            page={evalMeta.page}
            totalPages={evalMeta.totalPages}
            total={evalMeta.total}
            pageSize={evalMeta.pageSize}
            onPageChange={setEvalPage}
            className="mt-4"
          />
        ) : null}
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          variant="outline"
          onClick={() => void handleSave("draft")}
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar rascunho
        </Button>
        <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white" onClick={() => void handleSave("final")} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Star className="w-4 h-4 mr-2" />}
          Finalizar avaliação
        </Button>
      </div>
    </div>
  );
}
