"use client";

import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  AppWindow,
  Users,
  LogOut,
  Wallet,
  FolderOpen,
  BarChart3,
  Calendar,
  Settings,
  Bell,
  UserPlus,
  Calculator,
  Truck,
  Package,
  Cog,
  BriefcaseBusiness,
  Circle,
  Search,
  Box,
  FileText,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/components/ui/utils";
import { navItemsForRole, splitNavForSidebar, type NavItem } from "@/lib/navVisibility";

const ICON_BY_PATH: Record<string, ComponentType<{ className?: string }>> = {
  "/": AppWindow,
  "/orcamentos": Calculator,
  "/configurador-3d": Box,
  "/carrocerias-usadas": Truck,
  "/estoque/materiais": Package,
  "/producao": Cog,
  "/funcionarios": BriefcaseBusiness,
  "/clientes": Users,
  "/financeiro": Wallet,
  "/nota-fiscal": FileText,
  "/documentos": FolderOpen,
  "/relatorios": BarChart3,
  "/calendario": Calendar,
  "/notificacoes": Bell,
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
  badge,
  disabled,
}: {
  path: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  active: boolean;
  badge?: string;
  disabled?: boolean;
}) {
  const className = cn(
    "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-colors",
    disabled
      ? "cursor-default text-sidebar-foreground/45"
      : active
        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[var(--shadow-card)]"
        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
  );

  const content = (
    <>
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="flex-1 truncate text-[15px] font-medium tracking-tight">{label}</span>
      {badge ? (
        <span className="shrink-0 rounded-full bg-sidebar-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sidebar-foreground/60">
          {badge}
        </span>
      ) : null}
    </>
  );

  if (disabled) {
    return (
      <span className={className} aria-disabled="true">
        {content}
      </span>
    );
  }

  return (
    <Link href={path} className={className} aria-current={active ? "page" : undefined}>
      {content}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data } = useSession();
  const user = data?.user;
  const role = user?.role;
  const [query, setQuery] = useState("");

  const { main, secondary } = useMemo(() => {
    const all = navItemsForRole(role);
    const q = query.trim().toLowerCase();
    const filtered = q ? all.filter((i) => i.label.toLowerCase().includes(q)) : all;
    return splitNavForSidebar(filtered);
  }, [role, query]);

  const handleLogout = () => {
    void signOut({ callbackUrl: "/login" });
  };

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const renderItem = (item: NavItem) => {
    const Icon = ICON_BY_PATH[item.path] ?? Circle;
    return (
      <NavLink
        key={item.path}
        {...item}
        icon={Icon}
        active={!item.disabled && isActive(item.path)}
      />
    );
  };

  return (
    <aside className="flex w-[256px] shrink-0 flex-col self-stretch bg-sidebar print:hidden min-h-0 min-w-0">
      <div className="flex h-[68px] items-center px-5">
        <BrandLogo variant="dark" markClassName="h-9 w-9" wordClassName="text-xl" />
      </div>

      <div className="px-4 pb-2">
        <div className="flex items-center gap-2.5 rounded-xl bg-sidebar-accent/70 px-3.5 py-2.5 focus-within:bg-sidebar-accent">
          <Search className="h-[18px] w-[18px] shrink-0 text-sidebar-foreground/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar no menu"
            aria-label="Buscar no menu"
            className="w-full bg-transparent text-[14px] text-sidebar-foreground placeholder:text-sidebar-foreground/45 outline-none"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 no-scrollbar">
        <div className="flex flex-col gap-1">{main.map(renderItem)}</div>

        {secondary.length > 0 ? (
          <>
            <p className="px-3.5 pb-1.5 pt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/40">
              Operação
            </p>
            <div className="flex flex-col gap-1">{secondary.map(renderItem)}</div>
          </>
        ) : null}

        {main.length === 0 && secondary.length === 0 ? (
          <p className="px-3.5 py-3 text-[13px] text-sidebar-foreground/45">Nenhum item encontrado.</p>
        ) : null}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-sidebar-accent/60">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-sidebar-primary text-[13px] font-medium text-sidebar-primary-foreground">
              {userInitials(user?.name, user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-medium text-sidebar-foreground">
              {user?.name ?? "Usuário"}
            </div>
            <div className="truncate text-[12px] text-sidebar-foreground/55">
              {user?.email ?? ""}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sair"
            className="shrink-0 rounded-lg p-1.5 text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
