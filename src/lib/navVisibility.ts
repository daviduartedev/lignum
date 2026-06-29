import type { Role } from "@prisma/client";

export type NavItem = {
  path: string;
  label: string;
};

/** Itens principais visíveis por papel (defesa em profundidade; API é autoritativa). */
export function navItemsForRole(role: Role | undefined): NavItem[] {
  const allMain: NavItem[] = [
    { path: "/", label: "Painel" },
    { path: "/orcamentos", label: "Orçamentos" },
    { path: "/os", label: "OS" },
    { path: "/contratos", label: "Contratos" },
    { path: "/clientes", label: "Clientes e fornecedores" },
    { path: "/financeiro", label: "Financeiro" },
    { path: "/garantias", label: "Garantias" },
  ];

  const allSecondary: NavItem[] = [
    { path: "/documentos", label: "Documentos" },
    { path: "/relatorios", label: "Relatórios" },
    { path: "/calendario", label: "Calendário" },
    { path: "/notificacoes", label: "Notificações" },
    { path: "/leads", label: "Leads" },
    { path: "/configuracoes", label: "Configurações" },
  ];

  switch (role) {
    case "admin":
      return [...allMain, ...allSecondary];
    case "vendedor":
      return [
        ...allMain.filter((i) => i.path !== "/financeiro"),
        ...allSecondary.filter((i) => i.path !== "/configuracoes"),
      ];
    case "financeiro":
      return [
        { path: "/", label: "Painel" },
        { path: "/clientes", label: "Clientes e fornecedores" },
        { path: "/financeiro", label: "Financeiro" },
        { path: "/notificacoes", label: "Notificações" },
        { path: "/relatorios", label: "Relatórios" },
      ];
    case "producao":
      return [
        { path: "/", label: "Painel" },
        { path: "/os", label: "OS" },
        { path: "/documentos", label: "Documentos" },
        { path: "/notificacoes", label: "Notificações" },
      ];
    case "read_only":
      return [...allMain, ...allSecondary.filter((i) => i.path !== "/configuracoes")];
    default:
      return [{ path: "/", label: "Painel" }];
  }
}

export function splitNavForSidebar(items: NavItem[]): { main: NavItem[]; secondary: NavItem[] } {
  const secondaryPaths = new Set([
    "/documentos",
    "/relatorios",
    "/calendario",
    "/notificacoes",
    "/leads",
    "/configuracoes",
  ]);
  return {
    main: items.filter((i) => !secondaryPaths.has(i.path)),
    secondary: items.filter((i) => secondaryPaths.has(i.path)),
  };
}
