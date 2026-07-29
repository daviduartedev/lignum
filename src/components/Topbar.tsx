"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { InboxAlertsContent } from "@/components/inbox/InboxAlertsContent";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useInboxSummary } from "@/hooks/useInboxSummary";
import { emitInboxDrawerClosed, emitInboxDrawerOpened } from "@/lib/postLoginNotificacoesTelemetry";

const breadcrumbMap: Record<string, string[]> = {
  "/": ["Painel"],
  "/calendario": ["Calendário"],
  "/documentos": ["Documentos"],
  "/financeiro": ["Controle financeiro"],
  "/nota-fiscal": ["Emissão de nota fiscal (NFS)"],
  "/clientes": ["Clientes e fornecedores", "Lista"],
  "/clientes/novo": ["Clientes e fornecedores", "Novo cadastro"],
  "/notificacoes": ["Notificações"],
  "/relatorios": ["Relatórios"],
  "/configuracoes": ["Configurações"],
  "/orcamentos": ["Orçamentos", "Lista"],
  "/configurador-3d": ["Configurador 3D"],
  "/orcamentos/novo": ["Orçamentos", "Novo orçamento"],
  "/producao": ["Produção", "Kanban"],
  "/funcionarios": ["Funcionários", "Equipe"],
  "/estoque/materiais": ["Estoque", "Materiais"],
  "/carrocerias-usadas": ["Carrocerias usadas", "Catálogo"],
  "/carrocerias-usadas/nova": ["Carrocerias usadas", "Nova"],
  "/leads": ["Leads"],
};

export function Topbar() {
  const pathname = usePathname();
  const { data, status } = useSession();
  const user = data?.user;
  const [inboxOpen, setInboxOpen] = useState(false);
  const inboxQuery = useInboxSummary(status === "authenticated");

  const getBreadcrumb = (): string[] => {
    const p = pathname;

    if (/^\/clientes\/[^/]+\/editar$/.test(p)) return ["Clientes e fornecedores", "Editar cadastro"];
    if (/^\/clientes\/[^/]+$/.test(p) && p !== "/clientes/novo") return ["Clientes e fornecedores", "Prontuário"];

    if (/^\/orcamentos\/[^/]+$/.test(p) && p !== "/orcamentos/novo") {
      return ["Orçamentos", "Detalhe"];
    }

    if (/^\/producao\/[^/]+$/.test(p)) {
      return ["Produção", "Detalhe da OP"];
    }

    if (/^\/carrocerias-usadas\/[^/]+\/editar$/.test(p)) {
      return ["Carrocerias usadas", "Editar"];
    }

    const sorted = Object.entries(breadcrumbMap).sort((a, b) => b[0].length - a[0].length);
    for (const [path, crumbs] of sorted) {
      if (path === "/") {
        if (pathname === "/") return crumbs;
        continue;
      }
      if (pathname === path || pathname.startsWith(`${path}/`)) {
        return crumbs;
      }
    }
    return breadcrumbMap["/"];
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className="h-14 border-b border-border/80 bg-card px-8 flex items-center gap-6 print:hidden shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 text-sm" aria-label="Localização na aplicação">
        {breadcrumb.map((crumb, index) => (
          <div key={`${crumb}-${index}`} className="flex items-center gap-2">
            {index > 0 && <span className="text-muted-foreground">/</span>}
            <span
              className={
                index === breadcrumb.length - 1 ? "text-foreground font-medium" : "text-muted-foreground"
              }
            >
              {crumb}
            </span>
          </div>
        ))}
      </div>

      <div className="flex-1 min-w-[120px]" aria-hidden />

      <div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground">
        {status === "authenticated" ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Abrir centro de alertas"
              disabled={inboxQuery.isLoading}
              onClick={() => {
                void inboxQuery.refetch();
                setInboxOpen(true);
              }}
            >
              {inboxQuery.isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                <Bell className="h-5 w-5" aria-hidden />
              )}
              {inboxQuery.data && inboxQuery.data.totalActionable > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {inboxQuery.data.totalActionable > 99 ? "99+" : inboxQuery.data.totalActionable}
                </span>
              ) : null}
            </Button>
            <Dialog
              open={inboxOpen}
              onOpenChange={(o) => {
                setInboxOpen(o);
                if (o) emitInboxDrawerOpened();
                else emitInboxDrawerClosed();
              }}
            >
              <DialogContent
                showClose
                className="data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right !fixed top-0 right-0 left-auto h-full max-h-[100dvh] w-full max-w-md !translate-x-0 !translate-y-0 gap-0 border-l border-border/80 p-0 shadow-xl sm:rounded-none rounded-none overflow-y-auto duration-200"
              >
                <DialogHeader className="border-b border-border/80 px-5 py-4 text-left">
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                      <Bell className="h-5 w-5" aria-hidden />
                    </span>
                    Centro de alertas
                  </DialogTitle>
                </DialogHeader>
                <div className="px-5 py-4">
                  {inboxQuery.data ? (
                    <InboxAlertsContent data={inboxQuery.data} />
                  ) : (
                    <div className="flex justify-center py-12 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </>
        ) : null}
        <span className="hidden sm:inline max-w-[180px] truncate">{user?.email}</span>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-muted text-[10px]">
            {(user?.name ?? user?.email ?? "?").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
