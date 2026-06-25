"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, Loader2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useUserNotificationsPage,
  useToggleNotificationRead,
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useNotificationSummary,
} from "@/hooks/useUserNotifications";
import { useSaveUserInboxPreferences, useUserInboxPreferences } from "@/hooks/useUserInboxPreferences";
import { NotificationLink } from "@/components/NotificationLink";
import { Pagination } from "@/components/ui/pagination";

type TabValue = "all" | "unread" | "read";

export function NotificacoesHub() {
  const [tab, setTab] = useState<TabValue>("all");
  const [page, setPage] = useState(1);
  const readFilter: "all" | "true" | "false" = tab === "unread" ? "false" : tab === "read" ? "true" : "all";

  const { data: pageData, isLoading, isError, error, refetch } = useUserNotificationsPage(page, { read: readFilter });
  const { data: summary } = useNotificationSummary();
  const list = pageData?.items ?? [];
  const meta = pageData?.meta;

  useEffect(() => {
    setPage(1);
  }, [tab]);

  useEffect(() => {
    if (!meta) return;
    if (page > meta.totalPages) setPage(Math.max(1, meta.totalPages));
  }, [meta, page]);

  const toggleRead = useToggleNotificationRead();
  const remove = useDeleteNotification();
  const markAll = useMarkAllNotificationsRead();
  const { data: inboxPrefs } = useUserInboxPreferences();
  const saveInboxPrefs = useSaveUserInboxPreferences();

  const unreadCount = summary?.unread ?? 0;
  const showStripe = inboxPrefs?.showDashboardAttentionStripe ?? true;

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-[#111827]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#22C55E]/12 text-[#15803d]">
              <Bell className="h-6 w-6" aria-hidden />
            </span>
            Notificações
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Avisos enviados para a sua conta no sistema. Você pode marcar como lida ou não lida a qualquer momento.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[16rem] sm:max-w-xs">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full justify-center px-5 sm:w-full"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Atualizando…
              </>
            ) : (
              "Atualizar lista"
            )}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-11 w-full justify-center gap-2 px-5 sm:w-full"
            onClick={() => markAll.mutate()}
            disabled={unreadCount === 0 || markAll.isPending}
          >
            {markAll.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <CheckCheck className="h-4 w-4" aria-hidden />
            )}
            Marcar todas como lidas
          </Button>
        </div>
      </div>

      <Card className="border-border/80 p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-foreground">Mostrar tarja de atenção no painel</p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              Controla a faixa âmbar do pior caso no topo do Painel. Os cartões e listagens de pontos de atenção mantêm-se sempre visíveis.
            </p>
          </div>
          <Switch
            checked={showStripe}
            onCheckedChange={(v) => saveInboxPrefs.mutate({ showDashboardAttentionStripe: v })}
            disabled={saveInboxPrefs.isPending || inboxPrefs === undefined}
            aria-label="Mostrar tarja de atenção no painel"
          />
        </div>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="gap-4">
        <TabsList className="flex h-auto min-h-10 w-full flex-wrap gap-1.5 p-1.5 sm:w-fit">
          <TabsTrigger value="all" className="px-4 py-2">
            Todas ({summary?.total ?? "-"})
          </TabsTrigger>
          <TabsTrigger value="unread" className="px-4 py-2">
            Não lidas ({summary?.unread ?? "-"})
          </TabsTrigger>
          <TabsTrigger value="read" className="px-4 py-2">
            Lidas ({summary?.read ?? "-"})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="overflow-hidden border-border/80 shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
            <span className="text-sm">Carregando notificações…</span>
          </div>
        ) : isError ? (
          <div className="space-y-3 p-10 text-center text-sm leading-relaxed text-muted-foreground">
            <p>Não foi possível carregar as notificações. Confirme a sessão e as permissões da API.</p>
            {error instanceof Error && error.message ? (
              <p className="break-words font-mono text-xs text-muted-foreground/90">{error.message}</p>
            ) : null}
          </div>
        ) : list.length === 0 ? (
          <p className="p-10 text-center text-sm leading-relaxed text-muted-foreground">
            {tab === "unread"
              ? "Não há notificações não lidas."
              : tab === "read"
                ? "Você ainda não marcou nenhuma notificação como lida."
                : "Nenhuma notificação ainda. Novos avisos aparecerão aqui quando forem criados no sistema."}
          </p>
        ) : (
          <>
            <ul className="divide-y divide-border/60">
              {list.map((n) => (
                <li key={n.id} className="px-5 py-5 transition-colors hover:bg-muted/30">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className={`text-base font-medium ${n.read ? "text-muted-foreground" : "text-foreground"}`}>
                        {n.title}
                      </p>
                      {n.body ? (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{n.body}</p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {n.createdAt
                          ? new Date(n.createdAt).toLocaleString("pt-BR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : null}
                        {n.remind_at ? (
                          <span className="font-medium text-emerald-800">
                            Calendário:{" "}
                            {new Date(n.remind_at).toLocaleString("pt-BR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        ) : null}
                        {n.link ? (
                          <NotificationLink href={n.link} className="text-[#15803d] font-medium hover:underline">
                            Abrir link
                          </NotificationLink>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                      <div className="flex items-center gap-3">
                        <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
                          {n.read ? "Lida" : "Não lida"}
                        </span>
                        <Switch
                          checked={n.read}
                          onCheckedChange={(checked) => toggleRead.mutate({ id: n.id, read: checked })}
                          disabled={toggleRead.isPending}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => remove.mutate(n.id)}
                        disabled={remove.isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {meta ? (
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                pageSize={meta.pageSize}
                onPageChange={setPage}
                className="px-5"
              />
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}
