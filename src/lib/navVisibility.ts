import type { Role } from "@prisma/client";

export type NavItem = {
  path: string;
  label: string;
  badge?: string;
  /** Item visível no menu, mas ainda sem rota utilizável. */
  disabled?: boolean;
};

/** Itens principais visíveis por papel (defesa em profundidade; API é autoritativa). */
export function navItemsForRole(role: Role | undefined): NavItem[] {
  // Nav curada: apenas módulos entregues e validados (cycles 0623–0720).
  // Resíduos sem escopo Lignum (Documentos hub, Calendário, Leads). Rotas ainda existem por URL.
  const allMain: NavItem[] = [
    { path: "/", label: "Painel" },
    { path: "/orcamentos", label: "Orçamentos" },
    { path: "/configurador-3d", label: "Configurador 3D", badge: "Em breve" },
    { path: "/carrocerias-usadas", label: "Carrocerias usadas" },
    { path: "/estoque/materiais", label: "Estoque de materiais" },
    { path: "/producao", label: "Produção" },
    { path: "/funcionarios", label: "Funcionários" },
    { path: "/clientes", label: "Clientes e fornecedores" },
    { path: "/financeiro", label: "Controle financeiro", badge: "Em breve", disabled: true },
    { path: "/nota-fiscal", label: "Emissão de nota fiscal (NFS)", badge: "Em breve", disabled: true },
    { path: "/relatorios", label: "Relatórios", badge: "Em breve", disabled: true },
  ];

  const allSecondary: NavItem[] = [
    { path: "/notificacoes", label: "Notificações" },
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
        { path: "/financeiro", label: "Controle financeiro", badge: "Em breve", disabled: true },
        { path: "/nota-fiscal", label: "Emissão de nota fiscal (NFS)", badge: "Em breve", disabled: true },
        { path: "/relatorios", label: "Relatórios", badge: "Em breve", disabled: true },
        { path: "/notificacoes", label: "Notificações" },
      ];
    case "producao":
      return [
        { path: "/", label: "Painel" },
        { path: "/producao", label: "Produção" },
        { path: "/configurador-3d", label: "Configurador 3D", badge: "Em breve" },
        { path: "/funcionarios", label: "Funcionários" },
        { path: "/estoque/materiais", label: "Estoque de materiais" },
        { path: "/carrocerias-usadas", label: "Carrocerias usadas" },
        { path: "/notificacoes", label: "Notificações" },
      ];
    case "read_only":
      return [...allMain, ...allSecondary.filter((i) => i.path !== "/configuracoes")];
    default:
      return [{ path: "/", label: "Painel" }];
  }
}

export function splitNavForSidebar(items: NavItem[]): { main: NavItem[]; secondary: NavItem[] } {
  const secondaryPaths = new Set(["/notificacoes", "/configuracoes"]);
  return {
    main: items.filter((i) => !secondaryPaths.has(i.path)),
    secondary: items.filter((i) => secondaryPaths.has(i.path)),
  };
}
