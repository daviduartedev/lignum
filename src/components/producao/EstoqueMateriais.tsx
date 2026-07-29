"use client";

import { useDeferredValue, useEffect, useState } from "react";
import type { MaterialCategory } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { StitchKpiCard, StitchPageHeader, StitchSectionCard } from "@/components/ui/stitch";
import {
  useCreateMaterial,
  useCreateStockMovement,
  useAllMaterials,
  useMaterialsPage,
  useMaterialsSummary,
} from "@/hooks/useMaterials";
import { formatBRL } from "@/lib/pdf/format";
import {
  MATERIAL_CATEGORY_LABELS,
  materialCategoryLabel,
  materialStockStatusClass,
  materialStockStatusLabel,
} from "@/lib/materialLabels";
import { cn } from "@/components/ui/utils";
import { AlertTriangle, Loader2, LogIn, LogOut, Package, Plus, Search } from "lucide-react";

type MovementDialog = { type: "entrada" | "saida"; materialId?: number } | null;

export function EstoqueMateriais() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const deferredSearch = useDeferredValue(search.trim());
  const [movementDialog, setMovementDialog] = useState<MovementDialog>(null);
  const [newMaterialOpen, setNewMaterialOpen] = useState(false);

  const { data: summary } = useMaterialsSummary();
  const { data: allMaterials } = useAllMaterials();
  const { data, isLoading, isError, refetch } = useMaterialsPage(page, {
    q: deferredSearch,
    category: category === "all" ? undefined : category,
    pageSize: 50,
  });
  const createMovement = useCreateStockMovement();
  const createMaterial = useCreateMaterial();

  const meta = data?.meta;
  const items = data?.items ?? [];

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, category]);

  return (
    <div className="space-y-6">
      <StitchPageHeader
        title="Estoque de Matérias-Primas"
        description="Gestão e controle de insumos para produção de carrocerias."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setNewMaterialOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo material
            </Button>
            <Button
              variant="outline"
              onClick={() => setMovementDialog({ type: "saida" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Nova saída
            </Button>
            <Button onClick={() => setMovementDialog({ type: "entrada" })}>
              <LogIn className="mr-2 h-4 w-4" />
              Nova entrada
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StitchKpiCard
          label="Total de itens"
          value={String(summary?.total ?? 0)}
          sublabel="SKUs"
          icon={Package}
          tone="accent"
          solid
        />
        <StitchKpiCard
          label="Itens abaixo do mínimo"
          value={String(summary?.belowMinimum ?? 0)}
          icon={AlertTriangle}
          tone="warning"
          solid
        />
        <StitchKpiCard
          label="Valor total em estoque"
          value={formatBRL(summary?.totalStockValue ?? 0)}
          tone="primary"
          solid
        />
      </div>

      <StitchSectionCard
        title="Listagem de materiais"
        noPadding
        headerEnd={
          <div className="flex flex-wrap items-center gap-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {(Object.keys(MATERIAL_CATEGORY_LABELS) as MaterialCategory[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {materialCategoryLabel(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative w-52">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar SKU ou nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {meta ? (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {items.length} / {meta.total}
              </span>
            ) : null}
          </div>
        }
      >
        {isError ? (
          <p className="px-6 py-4 text-sm text-destructive">
            Erro ao carregar materiais.{" "}
            <button type="button" className="underline" onClick={() => void refetch()}>
              Tentar novamente
            </button>
          </p>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pl-6 pr-4 py-3 font-medium">Material</th>
                    <th className="px-4 py-3 font-medium">Unidade</th>
                    <th className="px-4 py-3 text-right font-medium">Saldo</th>
                    <th className="px-4 py-3 text-right font-medium">Mínimo</th>
                    <th className="px-4 py-3 text-right font-medium">Custo médio</th>
                    <th className="px-4 py-3 font-medium">Fornecedor</th>
                    <th className="px-4 py-3 text-center font-medium">Status</th>
                    <th className="pl-4 pr-6 py-3" />
                  </tr>
                </thead>
                <tbody className="tabular-nums divide-y divide-border">
                  {items.map((m) => (
                    <tr
                      key={m.id}
                      className={cn(
                        "transition-colors hover:bg-muted",
                        m.belowMinimum && "bg-red-50/60 hover:bg-red-50/80",
                      )}
                    >
                      <td className="pl-6 pr-4 py-3.5">
                        <p className="font-medium">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.sku}</p>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">{m.unit}</td>
                      <td
                        className={cn(
                          "px-4 py-3.5 text-right font-semibold",
                          m.belowMinimum && "text-red-600",
                        )}
                      >
                        {m.currentStock}
                      </td>
                      <td className="px-4 py-3.5 text-right text-muted-foreground">{m.minStock}</td>
                      <td className="px-4 py-3.5 text-right">{formatBRL(m.avgCost)}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {m.supplier?.companyName ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge className={materialStockStatusClass(m.belowMinimum)}>
                          {materialStockStatusLabel(m.belowMinimum)}
                        </Badge>
                      </td>
                      <td className="pl-4 pr-6 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setMovementDialog({ type: "entrada", materialId: m.id })}
                          >
                            <LogIn className="mr-1 h-3.5 w-3.5" />
                            Entrada
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setMovementDialog({ type: "saida", materialId: m.id })}
                          >
                            <LogOut className="mr-1 h-3.5 w-3.5" />
                            Saída
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta && meta.totalPages > 1 ? (
              <div className="px-6 py-4 border-t border-border flex justify-center">
                <Pagination
                  page={page}
                  totalPages={meta.totalPages}
                  total={meta.total}
                  pageSize={meta.pageSize}
                  onPageChange={setPage}
                />
              </div>
            ) : null}
          </>
        )}
      </StitchSectionCard>

      <StockMovementDialog
        open={!!movementDialog}
        type={movementDialog?.type ?? "entrada"}
        defaultMaterialId={movementDialog?.materialId}
        materials={allMaterials ?? items}
        onClose={() => setMovementDialog(null)}
        onSubmit={async (payload) => {
          await createMovement.mutateAsync(payload);
          setMovementDialog(null);
        }}
        isPending={createMovement.isPending}
      />

      <NewMaterialDialog
        open={newMaterialOpen}
        onClose={() => setNewMaterialOpen(false)}
        onSubmit={async (payload) => {
          await createMaterial.mutateAsync(payload);
          setNewMaterialOpen(false);
        }}
        isPending={createMaterial.isPending}
      />
    </div>
  );
}

function StockMovementDialog({
  open,
  type,
  defaultMaterialId,
  materials,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  type: "entrada" | "saida";
  defaultMaterialId?: number;
  materials: Array<{ id: number; sku: string; name: string }>;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  isPending: boolean;
}) {
  const list = materials;
  const [materialId, setMaterialId] = useState(String(defaultMaterialId ?? ""));
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setMaterialId(defaultMaterialId != null ? String(defaultMaterialId) : "");
      setQuantity("");
      setUnitCost("");
      setNotes("");
    }
  }, [open, defaultMaterialId]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type === "entrada" ? "Nova entrada" : "Nova saída"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label>Material</Label>
            <Select value={materialId || undefined} onValueChange={setMaterialId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o material" />
              </SelectTrigger>
              <SelectContent>
                {list.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.sku} - {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Quantidade</Label>
            <Input inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          {type === "entrada" ? (
            <div>
              <Label>Custo unitário (R$)</Label>
              <Input inputMode="decimal" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
            </div>
          ) : null}
          <div>
            <Label>Observações</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={isPending || !materialId || !quantity}
            onClick={() =>
              void onSubmit({
                materialId: Number(materialId),
                type,
                quantity: Number(quantity.replace(",", ".")),
                unitCost: type === "entrada" && unitCost ? Number(unitCost.replace(",", ".")) : undefined,
                notes: notes || undefined,
              })
            }
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewMaterialDialog({
  open,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  isPending: boolean;
}) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MaterialCategory>("estrutura");
  const [unit, setUnit] = useState("un");
  const [minStock, setMinStock] = useState("0");

  useEffect(() => {
    if (open) {
      setSku("");
      setName("");
      setCategory("estrutura");
      setUnit("un");
      setMinStock("0");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo material</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div>
            <Label>SKU</Label>
            <Input value={sku} onChange={(e) => setSku(e.target.value.toUpperCase())} />
          </div>
          <div className="sm:col-span-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Categoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as MaterialCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(MATERIAL_CATEGORY_LABELS) as MaterialCategory[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {materialCategoryLabel(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Unidade</Label>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
          <div>
            <Label>Estoque mínimo</Label>
            <Input inputMode="decimal" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={isPending || !sku || !name}
            onClick={() =>
              void onSubmit({
                sku,
                name,
                category,
                unit,
                minStock: Number(minStock.replace(",", ".")) || 0,
              })
            }
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Cadastrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
