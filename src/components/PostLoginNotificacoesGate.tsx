"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { InboxAlertsContent } from "@/components/inbox/InboxAlertsContent";
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
  USER_NOTIFICATIONS_KEY,
  USER_NOTIFICATION_SUMMARY_KEY,
  useMarkAllNotificationsRead,
} from "@/hooks/useUserNotifications";
import { emitPopupNotificacoesExibido, emitPopupNotificacoesReconhecido } from "@/lib/postLoginNotificacoesTelemetry";
import { INBOX_SUMMARY_KEY } from "@/hooks/useInboxSummary";
import { fetchInboxSummary } from "@/services/internal/inbox";
import type { InboxSummaryPayload } from "@/lib/inbox/buildInboxSummary";

/** Após login com credenciais; lido no primeiro render autenticado. */
export const POST_LOGIN_POPUP_SESSION_KEY = "lignum_post_login_popup_gate";

const LEGACY_STOCK_GATE_KEY = "lignum_post_login_stock_gate";

function hasPostLoginGate(): boolean {
  return (
    sessionStorage.getItem(POST_LOGIN_POPUP_SESSION_KEY) === "1" ||
    sessionStorage.getItem(LEGACY_STOCK_GATE_KEY) === "1"
  );
}

function clearPostLoginGate(): void {
  sessionStorage.removeItem(POST_LOGIN_POPUP_SESSION_KEY);
  sessionStorage.removeItem(LEGACY_STOCK_GATE_KEY);
}

export function PostLoginNotificacoesGate() {
  const { status } = useSession();
  const qc = useQueryClient();
  const markAll = useMarkAllNotificationsRead();
  const [open, setOpen] = useState(false);
  const [inbox, setInbox] = useState<InboxSummaryPayload | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (typeof window === "undefined") return;
    if (!hasPostLoginGate()) return;

    let cancelled = false;

    void (async () => {
      try {
        const data = await qc.fetchQuery({
          queryKey: INBOX_SUMMARY_KEY,
          queryFn: fetchInboxSummary,
        });
        if (cancelled) return;

        clearPostLoginGate();
        setInbox(data);
        emitPopupNotificacoesExibido(data.totalActionable);
        setOpen(true);
      } catch {
        if (!cancelled) {
          clearPostLoginGate();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, qc]);

  const closeWith = useCallback((metodo: "ok" | "fechar" | "esc") => {
    emitPopupNotificacoesReconhecido(metodo);
    setOpen(false);
  }, []);

  const onEntendi = () => {
    markAll.mutate(undefined, {
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: INBOX_SUMMARY_KEY });
        void qc.invalidateQueries({ queryKey: USER_NOTIFICATIONS_KEY });
        void qc.invalidateQueries({ queryKey: USER_NOTIFICATION_SUMMARY_KEY });
        closeWith("ok");
      },
    });
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setOpen(false);
      }}
    >
      <AlertDialogContent
        className="max-h-[min(100dvh,42rem)] overflow-y-auto gap-0 p-0 sm:max-w-lg max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:max-h-[100dvh] max-sm:rounded-b-none max-sm:rounded-t-xl max-sm:border-x-0 max-sm:border-b-0"
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          closeWith("esc");
        }}
      >
        <div className="p-6 pb-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-left">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#22C55E]/12 text-[#15803d]">
                <Bell className="h-5 w-5" aria-hidden />
              </span>
              Centro de alertas
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {inbox ? (
                  <>
                    <p className="text-muted-foreground text-sm text-left mb-1">
                      {inbox.totalActionable === 0
                        ? "Não há itens pendentes neste momento."
                        : inbox.totalActionable === 1
                          ? "1 item requer a sua atenção."
                          : `${inbox.totalActionable} itens requerem a sua atenção.`}
                    </p>
                    <div className="max-h-[min(50vh,24rem)] overflow-y-auto pr-1 -mr-1">
                      <InboxAlertsContent data={inbox} showStockActions />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-left">Carregando…</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter className="flex-col gap-2 border-t border-border/80 bg-muted/30 p-4 sm:flex-row sm:justify-between">
          <Link
            href="/notificacoes"
            className="text-sm font-medium text-emerald-700 hover:underline order-2 sm:order-1"
            onClick={() => closeWith("fechar")}
          >
            Ver todas em Notificações
          </Link>
          <div className="flex gap-2 justify-end order-1 sm:order-2">
            <AlertDialogCancel type="button" onClick={() => closeWith("fechar")} disabled={markAll.isPending}>
              Fechar
            </AlertDialogCancel>
            <AlertDialogAction type="button" onClick={onEntendi} disabled={markAll.isPending}>
              {markAll.isPending ? "A guardar…" : "Entendi"}
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
