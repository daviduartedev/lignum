"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Plus, Filter, AlertCircle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/ui/PageHeader";
import { VehicleDataTable } from "@/components/ui/VehicleDataTable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useVehicles } from "@/hooks/useVehicles";
import type { Vehicle } from "@/types";
import { vehicleAttrs, vehicleDaysInStock } from "@/types";
import { Pagination } from "@/components/ui/pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { vehicleStatusBadgeClass } from "@/lib/vehicleStatusBadge";
import {
  distinctVehicleColors,
  normalizePlate,
  sortVehiclesByKey,
  type EstoqueSortKey,
} from "@/lib/estoqueFilters";

function getStatus(v: Vehicle) {
  return vehicleAttrs(v).status;
}

const VALID_TABS = new Set([
  "estoque",
  "reservados",
  "vendidos",
  "standby",
  "todos",
  "removidos",
]);

const TAB_TRIGGER_ACTIVE: Record<string, string> = {
  estoque: "data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm",
  reservados: "data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-sm",
  vendidos: "data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:shadow-sm",
  standby: "data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm",
  todos: "data-[state=active]:bg-slate-600 data-[state=active]:text-white data-[state=active]:shadow-sm",
  removidos: "data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-sm",
};

const TAB_TRIGGER_BASE =
  "!inline-flex !flex-col !flex-none !h-auto !items-center !justify-center gap-0.5 text-center rounded-md px-4 py-1.5 min-w-[6.75rem] text-muted-foreground data-[state=inactive]:hover:bg-muted/60";

const FILTER_CONTROL_CLASS =
  "border-2 border-border/90 bg-background shadow-sm text-foreground placeholder:text-muted-foreground/90 ring-1 ring-border/40";

export function Estoque() {
  const searchParams = useSearchParams();
  const { data: veiculos = [], isLoading, isError, refetch } = useVehicles();
  const [search, setSearch] = useState("");
  const [plateFilter, setPlateFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("todas");
  const [sortKey, setSortKey] = useState<EstoqueSortKey>("none");
  const [tab, setTab] = useState("estoque");
  const [diasMinFiltro, setDiasMinFiltro] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = searchParams.get("tab");
    const dm = searchParams.get("diasMin");
    if (t && VALID_TABS.has(t)) {
      setTab(t);
    }
    if (dm != null && dm !== "") {
      const n = Number.parseInt(dm, 10);
      if (Number.isFinite(n) && n >= 1) {
        setDiasMinFiltro(n);
      } else {
        setDiasMinFiltro(null);
      }
    } else {
      setDiasMinFiltro(null);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    if (!veiculos.length) return [];
    const plateNorm = normalizePlate(plateFilter);
    return veiculos.filter((v: Vehicle) => {
      const a = vehicleAttrs(v);
      const brand = a.brand || "";
      const model = a.model || "";
      const plate = a.plate || "";
      const color = a.color?.trim() || "";
      const name = `${brand} ${model} ${a.version ?? ""}`.toLowerCase();
      const matchSearch = !search || name.includes(search.toLowerCase()) || plate.toLowerCase().includes(search.toLowerCase());
      const matchPlate = !plateNorm || normalizePlate(plate).includes(plateNorm);
      const matchColor = colorFilter === "todas" || color.toLowerCase() === colorFilter.toLowerCase();
      return matchSearch && matchPlate && matchColor;
    });
  }, [veiculos, search, plateFilter, colorFilter]);

  const colorOptions = useMemo(() => distinctVehicleColors(veiculos), [veiculos]);

  const disponiveisAll = useMemo(
    () => filtered.filter((v: Vehicle) => getStatus(v) === "disponivel"),
    [filtered],
  );

  const emEstoque = useMemo(() => {
    if (tab === "estoque" && diasMinFiltro != null) {
      return disponiveisAll.filter((v: Vehicle) => vehicleDaysInStock(v) >= diasMinFiltro);
    }
    return disponiveisAll;
  }, [disponiveisAll, tab, diasMinFiltro]);
  const reservados = useMemo(() => filtered.filter((v: Vehicle) => getStatus(v) === "reservado"), [filtered]);
  const vendidos = useMemo(() => filtered.filter((v: Vehicle) => getStatus(v) === "vendido"), [filtered]);
  const standby = useMemo(() => filtered.filter((v: Vehicle) => getStatus(v) === "standby_nao_compra"), [filtered]);
  const removidos = useMemo(() => filtered.filter((v: Vehicle) => getStatus(v) === "removido"), [filtered]);

  const tabList = useMemo(
    () => ({
      estoque: emEstoque,
      reservados,
      vendidos,
      standby,
      todos: filtered,
      removidos,
    }),
    [emEstoque, reservados, vendidos, standby, filtered, removidos],
  );

  const currentList = useMemo(() => {
    const base = tabList[tab as keyof typeof tabList] ?? emEstoque;
    return sortVehiclesByKey(base, sortKey);
  }, [tabList, tab, emEstoque, sortKey]);

  useEffect(() => {
    setPage(1);
  }, [tab, search, plateFilter, colorFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(currentList.length / DEFAULT_PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedList = useMemo(
    () => currentList.slice((page - 1) * DEFAULT_PAGE_SIZE, page * DEFAULT_PAGE_SIZE),
    [currentList, page],
  );

  const actionButton = (
    <Link href="/veiculo/novo">
      <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white">
        <Plus className="w-4 h-4 mr-2" />
        Cadastrar Veículo
      </Button>
    </Link>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Gestão de Estoque" description="Carregando dados..." action={actionButton} />
        <Card className="p-6 border border-border/80 shadow-sm">
          <p className="text-sm text-muted-foreground">Carregando veículos…</p>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Gestão de Estoque" action={actionButton} />
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Erro de conexão</AlertTitle>
          <AlertDescription className="text-red-700 flex flex-col items-start gap-4">
            <p>Não foi possível carregar o estoque. Verifique a sessão e se a API Next está acessível.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      <PageHeader
        title="Gestão de Estoque"
        description="Veículos por status: disponível, reservado, repasse e vendido"
        action={actionButton}
      />

      {tab === "estoque" && diasMinFiltro != null ? (
        <Alert className="border-emerald-200 bg-emerald-50/80">
          <AlertCircle className="h-4 w-4 text-emerald-700" />
          <AlertTitle className="text-emerald-900">Filtro ativo</AlertTitle>
          <AlertDescription className="text-emerald-800">
            Veículos disponíveis com {diasMinFiltro}+ dias no estoque.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="p-4 md:p-6 border border-border/80 border-t-4 border-t-emerald-500 shadow-sm bg-card min-w-0">
        <Tabs value={tab} onValueChange={(v) => setTab(v)} className="w-full">
          <div className="flex flex-col items-stretch justify-between mb-6 gap-3 animate-in fade-in duration-500">
            <TabsList className="bg-muted/40 p-1.5 flex flex-wrap h-auto gap-1.5 w-full min-w-0 justify-start">
              {(
                [
                  { value: "estoque", label: "Em estoque", count: emEstoque.length, badge: vehicleStatusBadgeClass("disponivel") },
                  { value: "reservados", label: "Reservados", count: reservados.length, badge: vehicleStatusBadgeClass("reservado") },
                  { value: "vendidos", label: "Vendidos", count: vendidos.length, badge: vehicleStatusBadgeClass("vendido") },
                  { value: "standby", label: "Standby", count: standby.length, badge: vehicleStatusBadgeClass("standby_nao_compra") },
                  { value: "todos", label: "Todos", count: filtered.length, badge: "bg-slate-100 text-slate-800 border border-slate-200" },
                  { value: "removidos", label: "Removidos", count: removidos.length, badge: vehicleStatusBadgeClass("removido") },
                ] as const
              ).map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className={`group ${TAB_TRIGGER_BASE} ${TAB_TRIGGER_ACTIVE[t.value] ?? ""}`}
                >
                  <span className="block w-full text-center text-xs font-medium leading-tight">{t.label}</span>
                  <span
                    className={`block w-full text-center tabular-nums text-[11px] font-semibold leading-none rounded px-2 py-0.5 border ${t.badge} group-data-[state=active]:bg-white/25 group-data-[state=active]:text-white group-data-[state=active]:border-white/40`}
                  >
                    {t.count}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full min-w-0">
              <Select value={colorFilter} onValueChange={setColorFilter}>
                <SelectTrigger
                  className={`w-full sm:min-w-[11.5rem] sm:w-auto shrink-0 h-9 ${FILTER_CONTROL_CLASS} *:data-[slot=select-value]:line-clamp-none`}
                >
                  <SelectValue placeholder="Cor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as cores</SelectItem>
                  {colorOptions.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as EstoqueSortKey)}>
                <SelectTrigger
                  className={`w-full sm:min-w-[12.5rem] sm:w-auto shrink-0 h-9 ${FILTER_CONTROL_CLASS} *:data-[slot=select-value]:line-clamp-none`}
                >
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ordenação padrão</SelectItem>
                  <SelectItem value="valor_asc">Menor valor</SelectItem>
                  <SelectItem value="valor_desc">Maior valor</SelectItem>
                  <SelectItem value="ano_asc">Menor ano</SelectItem>
                  <SelectItem value="ano_desc">Maior ano</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="estoque-busca"
                placeholder="Buscar veículo..."
                className={`w-full min-w-0 sm:min-w-[12rem] sm:max-w-[14rem] h-9 ${FILTER_CONTROL_CLASS}`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Input
                id="estoque-placa"
                placeholder="Placa"
                className={`w-full min-w-0 sm:min-w-[7.5rem] sm:max-w-[9rem] uppercase h-9 ${FILTER_CONTROL_CLASS}`}
                value={plateFilter}
                onChange={(e) => setPlateFilter(e.target.value)}
              />
              <Button
                variant="outline"
                className={`shrink-0 h-9 ${FILTER_CONTROL_CLASS}`}
                onClick={() => {
                  setSearch("");
                  setPlateFilter("");
                  setColorFilter("todas");
                  setSortKey("none");
                }}
              >
                <Filter className="w-4 h-4 mr-2 text-gray-500" />
                Limpar
              </Button>
            </div>
          </div>

          <TabsContent value="estoque" className="mt-0 min-w-0 space-y-2">
            <VehicleDataTable data={tab === "estoque" ? paginatedList : []} />
            {tab === "estoque" ? (
              <Pagination
                page={page}
                totalPages={totalPages}
                total={currentList.length}
                pageSize={DEFAULT_PAGE_SIZE}
                onPageChange={setPage}
              />
            ) : null}
          </TabsContent>
          <TabsContent value="reservados" className="mt-0 min-w-0 space-y-2">
            <VehicleDataTable data={tab === "reservados" ? paginatedList : []} />
            {tab === "reservados" ? (
              <Pagination
                page={page}
                totalPages={totalPages}
                total={currentList.length}
                pageSize={DEFAULT_PAGE_SIZE}
                onPageChange={setPage}
              />
            ) : null}
          </TabsContent>
          <TabsContent value="vendidos" className="mt-0 min-w-0 space-y-2">
            <VehicleDataTable data={tab === "vendidos" ? paginatedList : []} />
            {tab === "vendidos" ? (
              <Pagination
                page={page}
                totalPages={totalPages}
                total={currentList.length}
                pageSize={DEFAULT_PAGE_SIZE}
                onPageChange={setPage}
              />
            ) : null}
          </TabsContent>
          <TabsContent value="standby" className="mt-0 min-w-0 space-y-2">
            <VehicleDataTable data={tab === "standby" ? paginatedList : []} />
            {tab === "standby" ? (
              <Pagination
                page={page}
                totalPages={totalPages}
                total={currentList.length}
                pageSize={DEFAULT_PAGE_SIZE}
                onPageChange={setPage}
              />
            ) : null}
          </TabsContent>
          <TabsContent value="todos" className="mt-0 min-w-0 space-y-2">
            <VehicleDataTable data={tab === "todos" ? paginatedList : []} />
            {tab === "todos" ? (
              <Pagination
                page={page}
                totalPages={totalPages}
                total={currentList.length}
                pageSize={DEFAULT_PAGE_SIZE}
                onPageChange={setPage}
              />
            ) : null}
          </TabsContent>
          <TabsContent value="removidos" className="mt-0 min-w-0 space-y-2">
            <VehicleDataTable data={tab === "removidos" ? paginatedList : []} />
            {tab === "removidos" ? (
              <Pagination
                page={page}
                totalPages={totalPages}
                total={currentList.length}
                pageSize={DEFAULT_PAGE_SIZE}
                onPageChange={setPage}
              />
            ) : null}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
