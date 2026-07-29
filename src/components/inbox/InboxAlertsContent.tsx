"use client";

import Link from "next/link";
import { CheckCircle2, LayoutDashboard, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InboxSummaryPayload } from "@/lib/inbox/buildInboxSummary";
import { NotificationLink } from "@/components/NotificationLink";

type Props = {
  data: InboxSummaryPayload;
};

export function InboxAlertsContent({ data }: Props) {
  const empty = data.totalActionable === 0;

  return (
    <div className="space-y-6 text-left">
      {empty ? (
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/90 to-background px-6 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-primary">
            <CheckCircle2 className="h-9 w-9" aria-hidden />
          </div>
          <p className="mt-4 text-base font-semibold text-foreground">Tudo em dia</p>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Não há notificações não lidas nem alertas de estoque de materiais neste momento.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-6">
            <Link href="/notificacoes">Abrir centro de notificações</Link>
          </Button>
        </div>
      ) : null}

      <section aria-labelledby="inbox-sec-notif">
        <h3 id="inbox-sec-notif" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Notificações
        </h3>
        {data.notificationsUnread === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Sem notificações não lidas.</p>
        ) : (
          <ul className="list-none space-y-2 m-0 p-0">
            {data.notificationPreviews.map((n) => (
              <li key={n.id} className="rounded-lg border border-border/80 px-3 py-3 bg-muted">
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                {n.body ? (
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground mt-1">{n.body}</p>
                ) : null}
                <div className="flex flex-wrap gap-x-2 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                  {n.remindAt ? (
                    <span className="font-medium text-primary">
                      Compromisso: {new Date(n.remindAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  ) : null}
                  {n.link ? (
                    <NotificationLink href={n.link} className="text-[#15803d] font-medium hover:underline">
                      Abrir link
                    </NotificationLink>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="inbox-sec-materials">
        <h3 id="inbox-sec-materials" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Estoque de materiais (abaixo do mínimo)
        </h3>
        {data.materialLowStock.openCount === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Nenhum material abaixo do estoque mínimo.</p>
        ) : (
          <ul className="list-none space-y-2 m-0 p-0">
            {data.materialLowStock.items.map((row) => (
              <li
                key={row.materialId}
                className="rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-3"
              >
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 shrink-0 text-amber-800 mt-0.5" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-amber-950">{row.name}</p>
                    <p className="text-xs text-amber-900/90 mt-1">
                      SKU <strong>{row.sku}</strong> — saldo {row.currentStock} (mín. {row.minStock})
                    </p>
                    <Link href={row.href} className="text-xs font-medium text-primary hover:underline mt-2 inline-block">
                      Ver material
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="inbox-sec-virtual">
        <h3 id="inbox-sec-virtual" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Outros alertas
        </h3>
        {data.virtualAlerts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Sem alertas adicionais nas configurações atuais.</p>
        ) : (
          <ul className="list-none space-y-2 m-0 p-0">
            {data.virtualAlerts.map((v) => (
              <li key={v.kind} className="rounded-lg border border-border/80 px-3 py-3 bg-muted">
                <div className="flex items-start gap-2">
                  <LayoutDashboard className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{v.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{v.body}</p>
                    <Link href={v.href} className="text-xs font-medium text-primary hover:underline mt-2 inline-block">
                      Abrir seção
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
        <Package className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Total pendente no sininho: <span className="font-semibold text-foreground">{data.totalActionable}</span>
      </p>
    </div>
  );
}
