# Feature: Estoque (lista e filtros)

Ver modelo de veículo em [Vehicles](../vehicles/readme.md). Esta página complementa a lista técnica com regras de **navegação** e **filtros** usados pelo painel.

## Cadastro de veículo

A criação e edição de veículos (rotas `/veiculo/novo` e `/veiculo/[id]/editar`) seguem a spec de [Vehicles](../vehicles/readme.md), incluindo o fluxo de **consulta SENATRAN** (pré-preenchimento por placa, fallback manual e re-consulta na edição). A lista em `/estoque` não duplica essas regras.

## Lista em `/estoque`

Na listagem tabular (ex.: `VehicleDataTable`), por linha:

- **Ver detalhes** → `/veiculo/<routeId>`.
- **Vender** (quando o estado for **`disponivel`** ou **`reservado`**) → `/venda/<routeId>` (identificador de rota do veículo), reutilizando o fluxo de venda já existente.

**Colunas:** a listagem **não** inclui coluna **Score** (removida — não havia dados na API de listagem).

**Thumbnail do veículo:** coluna com miniatura via `VehicleThumbnail` — `mainPhotoUrl` quando presente; senão fallback Unsplash por marca/modelo/versão (`GET /api/vehicles/unsplash-photo`); se indisponível ou URL quebrada (`onError`), ícone `Car` neutro. Consistente com detalhe e vitrine.

**Tabs por status:** tab **ativa** com fundo sólido e cor temática do status; tabs inactivas discretas mas legíveis. Proporção: **menor altura** e **maior largura horizontal** (`py` reduzido, `px`/`min-width` aumentados). Contadores por tab: **label acima**, valor numérico **centralizado** abaixo do label.

**Busca e filtro de marca:** campo «Buscar veículo ou placa» e selector «Todas» (marcas) com **borda, contraste e espaçamento** visíveis face ao fundo da página; hierarquia clara em relação às tabs.

**Responsividade:** layout funcional em viewports **1024px** e **1280px** — tabs e filtros empilham ou quebram linha sem overflow horizontal indesejado; tabela utilizável com scroll horizontal apenas na tabela quando necessário.

## Menu lateral — Consulta FIPE

- Item **"FIPE"** na secção Operação aponta para **`/fipe`** (página **Consulta FIPE** dedicada, componente `FipeConsulta`).
- **Giro/Marketing** permanece em **`/giro`** — não confundir com a consulta FIPE.

## Rotas

- **`/estoque`** — gestão de stock (tabs por estado).

## Status do veículo

Os separadores seguem `VehicleStatus` no Prisma:

| Status | Significado resumido na UI |
|--------|----------------------------|
| `disponivel` | À venda, no stock principal (tab **Estoque**). |
| `reservado` | Reservado para cliente. |
| `repasse` | Repasse. |
| `vendido` | Já vendido. |
| `standby_nao_compra` | Standby / não compra. |
| `removido` | Removido do stock ativo (soft delete / removidos). |

Os KPIs “Valor em estoque”, “Dias parado em estoque” e **atenção operacional** do [Painel](../dashboard/readme.md) usam **apenas** `disponivel`.

## Labels (badges) coloridas por status (UI)

Para facilitar o scaneio visual da listagem e manter consistência em todo o ERP, sempre que `VehicleStatus` for exibido na UI ele deve usar **a mesma semântica de cor** (não apenas em `/estoque`).

Paleta sugerida (acessível, baseada em estados semânticos):

| `VehicleStatus` | Intenção | Cores (bg / text) — referência Tailwind |
|---|---|---|
| `disponivel` | Em estoque (ativo) | `bg-emerald-200 text-emerald-900` |
| `reservado` | Reservado | `bg-amber-200 text-amber-900` |
| `vendido` | Vendido | `bg-sky-200 text-sky-900` |
| `removido` | Removido | `bg-red-200 text-red-900` |
| `standby_nao_compra` | Standby / não compra | `bg-orange-200 text-orange-900` |

Notas:

- A implementação deve centralizar o mapeamento (helper/mapper) para evitar divergências entre telas.
- Quando houver tema escuro, garantir contraste equivalente (mesma intenção, ajustando tons).

## Filtro por dias parado (deep link)

Para alinhar o link **Ver todos** do painel ao comportamento atual (lista carregada no cliente com tabs):

- Query **`diasMin`**: inteiro ≥ 1. Quando presente **e** a tab ativa for **`estoque`**, a lista de disponíveis restringe-se a veículos cujo **dias parado** (mesma regra que o painel — `vehicleDaysInStock`) seja **≥** ao valor inteiro de `diasMin`. Em outras abas, o contador “Em estoque” na barra reflete todos os disponíveis após busca/marca; o filtro por dias aplica-se apenas à vista da aba **Em estoque**.
- Query **`tab`**: opcional; valores alinhados aos identificadores internos da página (ex.: `estoque` para a tab de disponíveis). Se omitido com `diasMin`, o padrão é **`estoque`** para corresponder aos pontos de atenção.

**Exemplo canônico**

```http
GET /estoque?tab=estoque&diasMin=60
```

## Verificação

- E2E ou teste manual: abrir o link desde o painel com `diasMin` igual ao limiar configurado no servidor e confirmar que os veículos listados são coerentes com o card/popup.
