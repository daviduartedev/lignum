"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Users,
  LogOut,
  ChevronRight,
  Wrench,
  Wallet,
  Shield,
  FolderOpen,
  BarChart3,
  Calendar,
  Settings,
  Inbox,
  UserPlus,
  Calculator,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/components/ui/utils";
import { navItemsForRole, splitNavForSidebar } from "@/lib/navVisibility";

const ICON_BY_PATH: Record<string, ComponentType<{ className?: string }>> = {
  "/": LayoutDashboard,
  "/orcamentos": Calculator,
  "/os": Wrench,
  "/contratos": FileText,
  "/clientes": Users,
  "/financeiro": Wallet,
  "/garantias": Shield,
  "/documentos": FolderOpen,
  "/relatorios": BarChart3,
  "/calendario": Calendar,
  "/notificacoes": Inbox,
  "/leads": UserPlus,
  "/configuracoes": Settings,
};

function userInitials(name: string | null | undefined, email: string | null | undefined): string {
  const s = (name ?? email ?? "?").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return s.slice(0, 2).toUpperCase();
}

function NavLink({
  path,
  label,
  icon: Icon,
  active,
}: {
  path: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={path}
      className={cn(
        "mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
          : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="text-[13px] font-medium">{label}</span>
      {active ? <ChevronRight className="ml-auto h-3 w-3 opacity-70" /> : null}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data } = useSession();
  const user = data?.user;
  const role = user?.role;
  const { main, secondary } = splitNavForSidebar(navItemsForRole(role));

  const handleLogout = () => {
    void signOut({ callbackUrl: "/login" });
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  const renderItem = (item: { path: string; label: string }) => {
    const Icon = ICON_BY_PATH[item.path] ?? LayoutDashboard;
    return <NavLink key={item.path} {...item} icon={Icon} active={isActive(item.path)} />;
  };

  return (
    <aside className="flex w-[220px] shrink-0 flex-col self-stretch bg-sidebar print:hidden min-h-0 min-w-0">
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-3">
        <BrandLogo />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 no-scrollbar">
        {main.map(renderItem)}

        {secondary.length > 0 ? (
          <>
            <p className="px-3 pb-1 pt-4 text-[10px] uppercase tracking-wider text-sidebar-foreground/40">
              Operação
            </p>
            {secondary.map(renderItem)}
          </>
        ) : null}
      </nav>

      <div className="border-t border-sidebar-border bg-sidebar-accent/50 px-4 py-3">
        <p className="mb-4 px-1 text-[10px] leading-relaxed text-sidebar-foreground/50">
          Busca global na barra superior (carrocerias, clientes, OS e contratos).
        </p>

        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-primary text-xs text-sidebar-primary-foreground">
              {userInitials(user?.name, user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-sidebar-foreground">
              {user?.name ?? user?.email ?? "Usuário"}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1 text-[10px] text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
            >
              <LogOut className="h-3 w-3" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
