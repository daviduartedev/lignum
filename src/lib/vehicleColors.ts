/** Cores típicas de revenda (PT-BR). Valor gravado = texto exibido. */
export const VEHICLE_COLOR_GROUPS: { label: string; colors: string[] }[] = [
  {
    label: "Neutras e claras",
    colors: [
      "Branco",
      "Branco Pérola",
      "Branco Summit",
      "Prata",
      "Prata Polido",
      "Prata Egito",
      "Cinza",
      "Cinza Grafite",
      "Cinza Londrina",
      "Cinza Metálico",
      "Bege",
      "Champagne",
      "Marfim",
    ],
  },
  {
    label: "Escuras",
    colors: [
      "Preto",
      "Preto Ninja",
      "Preto Ebony",
      "Azul Eclipse",
      "Azul Marinho",
      "Verde British",
      "Verde Floresta",
      "Marrom",
      "Café",
    ],
  },
  {
    label: "Metálicas e vivas",
    colors: [
      "Vermelho",
      "Vermelho Magma",
      "Vermelho Merlot",
      "Azul",
      "Azul Kinetic",
      "Azul Safira",
      "Verde",
      "Verde Limão",
      "Amarelo",
      "Dourado",
      "Laranja",
      "Roxo",
      "Vinho",
      "Rosa",
    ],
  },
];

export const ALL_SUGGESTED_VEHICLE_COLORS: string[] = VEHICLE_COLOR_GROUPS.flatMap((g) => g.colors);

export function filterVehicleColors(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return ALL_SUGGESTED_VEHICLE_COLORS;
  return ALL_SUGGESTED_VEHICLE_COLORS.filter((c) => c.toLowerCase().includes(q));
}
