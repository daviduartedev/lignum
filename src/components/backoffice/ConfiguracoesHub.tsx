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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Building2, Bell, Users, CreditCard, Check, Loader2, AlertCircle, RefreshCw, FileText } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] mb-1">Configurações</h1>
          <p className="text-sm text-[#6B7280]">Dados da empresa e alertas gravados nas configurações do ERP</p>
        </div>
        {isAdmin ? (
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/configuracoes/usuarios">
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </Link>
          </Button>
        ) : null}
      </div>

      <Card className="p-4 border border-border/80 bg-card">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 shrink-0 text-emerald-700 mt-0.5" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#111827]">Documentação, integração SENATRAN</p>
            <p className="text-xs text-[#6B7280] mt-1">
              Material para compartilhar com o cliente (imprimir do navegador ou «Salvar como PDF»).
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/documentacao/senatran">Abrir documento</Link>
            </Button>
          </div>
        </div>
      </Card>

      {isAdmin ? (
        <Card className="p-4 border border-emerald-100 bg-emerald-50/50">
          <p className="text-sm font-medium text-emerald-900">Custo acumulado, consultas SENATRAN (mês corrente)</p>
          {senatranUsage.isLoading ? (
            <p className="text-sm text-muted-foreground mt-2">Carregando…</p>
          ) : senatranUsage.isError ? (
            <p className="text-sm text-destructive mt-2">Não foi possível carregar o uso.</p>
          ) : (
            <>
              <p className="text-2xl font-semibold text-emerald-950 mt-1 tabular-nums">
                {Number(senatranUsage.data?.monthTotal ?? 0).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
              {senatranUsage.data?.isDemo ? (
                <p className="text-xs text-muted-foreground mt-2">
                  Modo demonstração (provedor mock), custo registrado como zero.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">Provedor: {senatranUsage.data?.provider ?? "-"}</p>
              )}
            </>
          )}
        </Card>
      ) : null}

      {isError && (
        <Alert variant="destructive" className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-700" />
          <AlertTitle className="text-amber-900">Configuração indisponível</AlertTitle>
          <AlertDescription className="text-amber-800 flex flex-col gap-3 items-start">
            <p>
              {(error as Error)?.message ||
                "Não foi possível ler /api/erp-setting. Tente «Salvar alterações» se tiver permissão."}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-6 border border-[#E5E7EB]">
        <Tabs defaultValue="empresa" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="empresa">
              <Building2 className="w-4 h-4 mr-2" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="usuarios">
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="alertas">
              <Bell className="w-4 h-4 mr-2" />
              Alertas
            </TabsTrigger>
            <TabsTrigger value="plano">
              <CreditCard className="w-4 h-4 mr-2" />
              Plano
            </TabsTrigger>
          </TabsList>

          <TabsContent value="empresa">
            <div className="max-w-2xl space-y-6">
              <Card className="p-4 border border-[#E5E7EB] bg-[#F9FAFB]">
                <p className="text-xs text-[#6B7280] mb-1">Sessão atual</p>
                <p className="text-sm font-medium text-[#111827]">{session?.user?.name ?? "-"}</p>
                <p className="text-xs text-[#6B7280] mt-1">{session?.user?.email ?? ""}</p>
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
          </TabsContent>

          <TabsContent value="usuarios">
            <Alert className="mb-4 border-blue-200 bg-blue-50/80">
              <AlertDescription className="text-sm text-blue-900">
                Lista abaixo é <strong>ilustrativa</strong>. A gestão real de usuários é feita no banco de dados
                (administrador).
              </AlertDescription>
            </Alert>
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button type="button" variant="secondary" disabled>
                  Adicionar Usuário
                </Button>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="text-left text-xs font-medium text-[#6B7280] pb-3">Nome</th>
                    <th className="text-left text-xs font-medium text-[#6B7280] pb-3">E-mail</th>
                    <th className="text-left text-xs font-medium text-[#6B7280] pb-3">Perfil</th>
                    <th className="text-left text-xs font-medium text-[#6B7280] pb-3">Status</th>
                    <th className="text-left text-xs font-medium text-[#6B7280] pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { nome: "Administrador", email: "admin@lignum.local", perfil: "Administrador", ativo: true },
                    { nome: "João Vendedor", email: "joao@lignum.local", perfil: "Vendedor", ativo: true },
                    { nome: "Maria Vendas", email: "maria@lignum.local", perfil: "Vendedor", ativo: true },
                    { nome: "Carlos Gerente", email: "carlos@lignum.local", perfil: "Gerente", ativo: false },
                  ].map((usuario, index) => (
                    <tr key={index} className="border-b border-[#E5E7EB] last:border-0">
                      <td className="py-3 text-sm text-[#111827]">{usuario.nome}</td>
                      <td className="py-3 text-sm text-[#6B7280]">{usuario.email}</td>
                      <td className="py-3 text-sm text-[#6B7280]">{usuario.perfil}</td>
                      <td className="py-3">
                        <Badge
                          className={
                            usuario.ativo
                              ? "bg-[#DCFCE7] text-[#15803D] border-0"
                              : "bg-[#F9FAFB] text-[#6B7280] border-0"
                          }
                        >
                          {usuario.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Button variant="ghost" size="sm" type="button" disabled>
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="alertas">
            <div className="max-w-2xl space-y-6">
              <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-lg">
                <div>
                  <div className="text-sm font-medium text-[#111827]">Alertas de Giro</div>
                  <div className="text-xs text-[#6B7280]">Notificar quando veículos ultrapassarem prazo</div>
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

              <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-lg">
                <div>
                  <div className="text-sm font-medium text-[#111827]">Alertas de Promissórias</div>
                  <div className="text-xs text-[#6B7280]">Notificar sobre vencimentos</div>
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

              <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-lg">
                <div>
                  <div className="text-sm font-medium text-[#111827]">Alertas de Documentação</div>
                  <div className="text-xs text-[#6B7280]">Notificar sobre documentos pendentes</div>
                </div>
                <Switch
                  checked={form.alert_docs_enabled}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, alert_docs_enabled: v }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-lg">
                <div>
                  <div className="text-sm font-medium text-[#111827]">Notificações por E-mail</div>
                  <div className="text-xs text-[#6B7280]">Receber resumo diário por e-mail</div>
                </div>
                <Switch
                  checked={form.alert_email_digest_enabled}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, alert_email_digest_enabled: v }))}
                />
              </div>

              <div>
                <Label htmlFor="inbox-pre-min">Minutos antes do compromisso (pré-aviso)</Label>
                <p className="text-xs text-[#6B7280] mb-2">
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
          </TabsContent>

          <TabsContent value="plano">
            <Alert className="mb-4 border-amber-200 bg-amber-50/80">
              <AlertDescription className="text-sm text-amber-950">
                Informação de plano <strong>não</strong> é persistida nestas configurações, apenas referência visual.
              </AlertDescription>
            </Alert>
            <div className="max-w-2xl space-y-6">
              <Card className="p-6 border-2 border-[#22C55E] bg-[#F0FDF4]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#111827]">Plano Premium</h3>
                    <p className="text-sm text-[#6B7280]">Todas as funcionalidades liberadas</p>
                  </div>
                  <Badge className="bg-[#22C55E] text-white border-0 text-lg px-4 py-2">Ativo</Badge>
                </div>

                <div className="space-y-3 mb-6">
                  {["Veículos ilimitados", "Usuários ilimitados", "Site personalizado", "Relatórios avançados", "Suporte prioritário"].map(
                    (t) => (
                      <div key={t} className="flex items-center gap-2 text-sm text-[#111827]">
                        <Check className="w-4 h-4 text-[#22C55E]" />
                        <span>{t}</span>
                      </div>
                    ),
                  )}
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-semibold text-[#111827]">R$ 497</span>
                  <span className="text-sm text-[#6B7280]">/ mês</span>
                </div>

                <div className="text-sm text-[#6B7280]">Próxima renovação: a definir comercialmente</div>
              </Card>

              <div className="flex gap-3">
                <Button type="button" variant="outline" disabled>
                  Alterar Forma de Pagamento
                </Button>
                <Button type="button" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" disabled>
                  Cancelar Plano
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#E5E7EB]">
          <Button type="button" variant="outline" onClick={resetForm} disabled={saveMutation.isPending}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A guardar…
              </>
            ) : (
              "Salvar alterações"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
