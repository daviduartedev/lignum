/** Dados estáticos do mock Stitch 01 até KPIs reais (cycle 0727). */
export const PAINEL_KPIS = [
  {
    label: "Faturamento do Mês",
    value: "R$ 482.900",
    trend: "+12.4%",
    trendLabel: "vs. mês anterior",
    trendTone: "success" as const,
    icon: "payments" as const,
  },
  {
    label: "Lucro Estimado",
    value: "R$ 154.200",
    trend: "+8.2%",
    trendLabel: "vs. mês anterior",
    trendTone: "success" as const,
    icon: "wallet" as const,
  },
  {
    label: "Em Produção",
    value: "42 Unid.",
    trend: "4 finalizadas hoje",
    trendTone: "info" as const,
    icon: "factory" as const,
  },
  {
    label: "Orçamentos Pendentes",
    value: "18 ativos",
    trend: "3 vencendo hoje",
    trendTone: "danger" as const,
    icon: "clipboard" as const,
  },
] as const;

export const PAINEL_ALERTS = [
  {
    tone: "danger" as const,
    title: "Estoque Mínimo Atingido",
    body: 'Viga U 4" - Unidade #01 resta apenas 12 metros.',
    action: "Repor agora",
  },
  {
    tone: "warning" as const,
    title: "Contas a Vencer",
    body: "3 títulos vencem amanhã (Total: R$ 12.450).",
    action: "Ver financeiro",
  },
  {
    tone: "info" as const,
    title: "Orçamentos Aguardando",
    body: "Orçamento #8822 (Transportes Silva) aguarda aprovação há 48h.",
    action: "Contatar cliente",
  },
  {
    tone: "neutral" as const,
    title: "Manutenção Preventiva",
    body: "Prensa Hidráulica 02 agendada para 15/06.",
  },
] as const;

export const PAINEL_MOCK_QUOTES = [
  {
    initials: "JS",
    client: "Joaquim Silva Transportes",
    model: "Carroceria Madeira Graneleiro",
    value: "R$ 32.500,00",
    status: "Aprovado",
    statusClass: "bg-green-100 text-green-700",
    date: "10/06/2024",
  },
  {
    initials: "AL",
    client: "Agro Logística Nordeste",
    model: "Carroceria Metálica Baú",
    value: "R$ 58.900,00",
    status: "Em Análise",
    statusClass: "bg-blue-100 text-blue-700",
    date: "09/06/2024",
  },
  {
    initials: "MC",
    client: "Marcos Caminhoneiro ME",
    model: "Reparo Estrutural Madeira",
    value: "R$ 4.200,00",
    status: "Pendente",
    statusClass: "bg-orange-100 text-orange-700",
    date: "08/06/2024",
  },
  {
    initials: "EX",
    client: "Expresso Rápido Ltda",
    model: "Carroceria Carga Seca 7m",
    value: "R$ 27.800,00",
    status: "Recusado",
    statusClass: "bg-red-100 text-red-700",
    date: "07/06/2024",
  },
] as const;

export const FACTORY_IMAGE_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA8zMKMb_oh-FdR53iVfIsOV3gEnBybWNGixM9QNSZJKA1naXcC-infMawfl11OjE2ajNfrSsqmwIF__THA-tKkhCLrkY-pTlIKUXKlqWoHGZ_bf4SGzR8EcjmSCaY5WqjVhqdA9DHuxrKJDzi57w_tC3czDWpkyg79CmUWIEWOIyYFHto5OcP1EEQBWi-awBg2HAmql5qYjxRstkgfFFjlKOkdS8ll583ugDBNo0RGF6ccDgW2-088KqQYR5syo90XBWSvmq4s1fIS";

export const PRODUCTION_BAR_HEIGHTS = [60, 75, 45, 90, 65, 80] as const;
