"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { maskCEP, maskCPFCNPJ, maskPhoneBR } from "@/lib/masks";
import { Label } from "@/components/ui/label";
import { StitchPageHeader, StitchSectionCard } from "@/components/ui/stitch";
import { cn } from "@/components/ui/utils";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Building2, Bell, Users, Loader2, AlertCircle, RefreshCw, FileText, Calculator } from "lucide-react";
import { useErpSettingQuery, useErpSettingSave } from "@/hooks/useErpSettings";
import { ERP_SETTING_DEFAULTS, type ErpSettingFlat } from "@/lib/erpSettingDefaults";
import { fetchSenatranUsage } from "@/services/internal/senatranLookup";

export function ConfiguracoesHub() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const senatranUsage = useQuery({
    queryKey: ["senatran", "usage"],
    queryFn: fetchSenatranUsage,
    enabled: isAdmin,
    staleTime: 60_000,
  });
  const { data, isLoading, isError, error, refetch } = useErpSettingQuery();
  const saveMutation = useErpSettingSave();
  const [form, setForm] = useState<ErpSettingFlat>(() => ({ ...ERP_SETTING_DEFAULTS }));
  const [settingsSection, setSettingsSection] = useState<"empresa" | "alertas" | "orcamentos">("empresa");

  useEffect(() => {
    if (!data) return;
    setForm({
      ...data,
      company_tax_id: data.company_tax_id ? maskCPFCNPJ(String(data.company_tax_id)) : "",
      company_zip: data.company_zip ? maskCEP(String(data.company_zip)) : "",
      company_phone: data.company_phone ? maskPhoneBR(String(data.company_phone)) : "",
    });
  }, [data]);

  const resetForm = useCallback(() => {
    if (data) {
      setForm({
        ...data,
        company_tax_id: data.company_tax_id ? maskCPFCNPJ(String(data.company_tax_id)) : "",
        company_zip: data.company_zip ? maskCEP(String(data.company_zip)) : "",
        company_phone: data.company_phone ? maskPhoneBR(String(data.company_phone)) : "",
      });
    } else setForm({ ...ERP_SETTING_DEFAULTS });
  }, [data]);

  const handleSave = () => {
    saveMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-2">
        <p className="text-sm">Carregando configurações…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px]">
      <StitchPageHeader
        title="Configurações do Sistema"
        description="Gerencie dados da empresa emitente e regras de alertas da fábrica."
        actions={
          isAdmin ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/configuracoes/auditoria">Auditoria</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/configuracoes/usuarios">
                  <Users className="h-4 w-4" />
                  Usuários
                </Link>
              </Button>
            </div>
          ) : null
        }
      />

      <Card className="p-4 border border-border bg-card">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Documentação — integração SENATRAN</p>
            <p className="text-xs text-muted-foreground mt-1">
              Material para compartilhar com o cliente (imprimir ou salvar como PDF).
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/documentacao/senatran">Abrir documento</Link>
            </Button>
          </div>
        </div>
      </Card>

      {isAdmin ? (
        <Card className="p-4 border border-border bg-muted/30">
          <p className="text-sm font-medium text-foreground">Custo acumulado — consultas SENATRAN (mês corrente)</p>
          {senatranUsage.isLoading ? (
            <p className="text-sm text-muted-foreground mt-2">Carregando…</p>
          ) : senatranUsage.isError ? (
            <p className="text-sm text-destructive mt-2">Não foi possível carregar o uso.</p>
          ) : (
            <>
              <p className="text-2xl font-semibold text-foreground mt-1 tabular-nums">
                {Number(senatranUsage.data?.monthTotal ?? 0).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
              {senatranUsage.data?.isDemo ? (
                <p className="text-xs text-muted-foreground mt-2">Modo demonstração (mock), custo zero.</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">Provedor: {senatranUsage.data?.provider ?? "-"}</p>
              )}
            </>
          )}
        </Card>
      ) : null}

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuração indisponível</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 items-start">
            <p>
              {(error as Error)?.message ||
                "Não foi possível ler /api/erp-setting. Tente salvar se tiver permissão."}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <nav className="w-full lg:w-64 shrink-0 space-y-1" aria-label="Secções de configuração">
          <button
            type="button"
            onClick={() => setSettingsSection("empresa")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition-all border",
              settingsSection === "empresa"
                ? "bg-card border-border text-primary shadow-sm"
                : "border-transparent text-muted-foreground hover:bg-muted/50",
            )}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            Dados da Empresa
          </button>
          {isAdmin ? (
            <Link
              href="/configuracoes/usuarios"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-all"
            >
              <Users className="w-4 h-4 shrink-0" />
              Usuários e Permissões
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => setSettingsSection("orcamentos")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition-all border",
              settingsSection === "orcamentos"
                ? "bg-card border-border text-primary shadow-sm"
                : "border-transparent text-muted-foreground hover:bg-muted/50",
            )}
          >
            <Calculator className="w-4 h-4 shrink-0" />
            Parâmetros de Orçamento
          </button>
          <button
            type="button"
            onClick={() => setSettingsSection("alertas")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition-all border",
              settingsSection === "alertas"
                ? "bg-card border-border text-primary shadow-sm"
                : "border-transparent text-muted-foreground hover:bg-muted/50",
            )}
          >
            <Bell className="w-4 h-4 shrink-0" />
            Alertas do Sistema
          </button>
        </nav>

        <div className="flex-1 min-w-0 space-y-6">
          {settingsSection === "empresa" ? (
            <StitchSectionCard title="Informações corporativas">
              <div className="max-w-2xl space-y-6">
                <Card className="p-4 border border-border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Sessão atual</p>
                  <p className="text-sm font-medium text-foreground">{session?.user?.name ?? "-"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{session?.user?.email ?? ""}</p>
                </Card>
              <div>
                <Label htmlFor="co-name">Nome da Empresa</Label>
                <Input
                  id="co-name"
                  value={form.company_name}
                  onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="co-tax">CNPJ</Label>
                  <MaskedInput
                    id="co-tax"
                    mask="cpf_cnpj"
                    value={form.company_tax_id}
                    onChange={(e) => setForm((f) => ({ ...f, company_tax_id: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="co-st">Inscrição Estadual</Label>
                  <Input
                    id="co-st"
                    value={form.company_state_reg}
                    onChange={(e) => setForm((f) => ({ ...f, company_state_reg: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="co-addr">Endereço</Label>
                <Input
                  id="co-addr"
                  value={form.company_address}
                  onChange={(e) => setForm((f) => ({ ...f, company_address: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="co-city">Cidade</Label>
                  <Input
                    id="co-city"
                    value={form.company_city}
                    onChange={(e) => setForm((f) => ({ ...f, company_city: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Estado</Label>
                  <Select value={form.company_state} onValueChange={(v) => setForm((f) => ({ ...f, company_state: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SP">São Paulo</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                      <SelectItem value="MG">Minas Gerais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="co-zip">CEP</Label>
                  <MaskedInput
                    id="co-zip"
                    mask="cep"
                    value={form.company_zip}
                    onChange={(e) => setForm((f) => ({ ...f, company_zip: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="co-ph">Telefone</Label>
                  <MaskedInput
                    id="co-ph"
                    mask="phone"
                    value={form.company_phone}
                    onChange={(e) => setForm((f) => ({ ...f, company_phone: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="co-em">E-mail</Label>
                  <Input
                    id="co-em"
                    type="email"
                    value={form.company_email}
                    onChange={(e) => setForm((f) => ({ ...f, company_email: e.target.value }))}
                  />
                </div>
              </div>
              </div>
            </StitchSectionCard>
          ) : settingsSection === "orcamentos" ? (
            <StitchSectionCard title="Parâmetros de orçamento">
              <div className="max-w-2xl space-y-6">
                <p className="text-sm text-muted-foreground">
                  Margens e taxa horária usadas pelo motor de preço paramétrico dos orçamentos.
                </p>
                <div>
                  <Label htmlFor="qt-margin">Margem sugerida (%)</Label>
                  <Input
                    id="qt-margin"
                    type="number"
                    min={0}
                    max={100}
                    value={form.quote_suggested_margin_percent}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        quote_suggested_margin_percent: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="qt-min-margin">Margem mínima (%)</Label>
                  <Input
                    id="qt-min-margin"
                    type="number"
                    min={0}
                    max={100}
                    value={form.quote_min_margin_percent}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        quote_min_margin_percent: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="qt-labor">Taxa horária mão de obra (R$)</Label>
                  <Input
                    id="qt-labor"
                    type="number"
                    min={0}
                    value={form.quote_labor_hour_rate}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        quote_labor_hour_rate: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                  />
                </div>
              </div>
            </StitchSectionCard>
          ) : (
            <StitchSectionCard title="Alertas do sistema">
              <div className="max-w-2xl space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-foreground">Alertas de Giro</div>
                  <div className="text-xs text-muted-foreground">Notificar quando veículos ultrapassarem prazo</div>
                </div>
                <Switch
                  checked={form.alert_giro_enabled}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, alert_giro_enabled: v }))}
                />
              </div>

              <div>
                <Label htmlFor="al-warn">Dias para Alerta de Atenção</Label>
                <Input
                  id="al-warn"
                  type="number"
                  min={1}
                  value={form.alert_giro_warn_days}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, alert_giro_warn_days: Math.max(1, parseInt(e.target.value, 10) || 30) }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="al-crit">Dias para Alerta Crítico</Label>
                <Input
                  id="al-crit"
                  type="number"
                  min={1}
                  value={form.alert_giro_crit_days}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, alert_giro_crit_days: Math.max(1, parseInt(e.target.value, 10) || 45) }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-foreground">Alertas de Promissórias</div>
                  <div className="text-xs text-muted-foreground">Notificar sobre vencimentos</div>
                </div>
                <Switch
                  checked={form.alert_prom_enabled}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, alert_prom_enabled: v }))}
                />
              </div>

              <div>
                <Label htmlFor="al-prom">Dias de Antecedência para Alerta</Label>
                <Input
                  id="al-prom"
                  type="number"
                  min={1}
                  value={form.alert_prom_days_before}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      alert_prom_days_before: Math.max(1, parseInt(e.target.value, 10) || 7),
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-foreground">Alertas de Documentação</div>
                  <div className="text-xs text-muted-foreground">Notificar sobre documentos pendentes</div>
                </div>
                <Switch
                  checked={form.alert_docs_enabled}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, alert_docs_enabled: v }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-foreground">Notificações por E-mail</div>
                  <div className="text-xs text-muted-foreground">Receber resumo diário por e-mail</div>
                </div>
                <Switch
                  checked={form.alert_email_digest_enabled}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, alert_email_digest_enabled: v }))}
                />
              </div>

              <div>
                <Label htmlFor="inbox-pre-min">Minutos antes do compromisso (pré-aviso)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Janela para o lembrete não bloqueante antes da hora de <span className="font-medium">remindAt</span> nas
                  notificações.
                </p>
                <Input
                  id="inbox-pre-min"
                  type="number"
                  min={1}
                  max={1440}
                  value={form.inbox_pre_event_popup_minutes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      inbox_pre_event_popup_minutes: Math.min(
                        1440,
                        Math.max(1, parseInt(e.target.value, 10) || ERP_SETTING_DEFAULTS.inbox_pre_event_popup_minutes),
                      ),
                    }))
                  }
                />
              </div>
              </div>
            </StitchSectionCard>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={resetForm} disabled={saveMutation.isPending}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  A guardar…
                </>
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
