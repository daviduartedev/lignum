# Feature: Painel (dashboard da revenda)

## Objetivo

O painel responde, em poucos segundos, a: **quanto capital está parado em stock disponível**, **qual o lucro realizado do mês em R$**, **quantas vendas no mês** e **quais veículos disponíveis exigem prioridade de giro** (stock **disponível** há muito tempo sem “movimentação” no sentido v1: dias parado desde referência documentada em **Dias parado** abaixo). O **popup pós-login** (centro de alertas unificado) está descrito em [Auth](../auth/readme.md) e [Centro de alertas](../inbox-centro-alertas/readme.md); o resumo numérico deste painel continua a vir de `GET /api/dashboard/summary`.

## Rotas e UI

- Rota principal do resumo: **`/`** (componente de painel atual: `Painel`).

## KPIs (definições canónicas)

Todas as contagens de **stock** para estes KPIs consideram apenas veículos com `VehicleStatus` = **`disponivel`**.

| KPI | Definição |
|-----|-----------|
| **Valor em estoque** | Soma de `purchasePrice` (custo de aquisição) dos veículos **disponíveis**. |
| **Lucro do mês (R$)** | Soma, por venda no **mês civil corrente** (fuso **America/São_Paulo**), de `finalPrice − purchasePrice − COALESCE(estimatedMaintenanceCost, 0)` do veículo vendido. Vendas sem receita/custo válidos são ignoradas. Campo JSON: `lucroMesReais`. |
| **Vendas mês** | Número de vendas com `saleDate` (ou data canónica da venda) dentro do mês civil corrente em **America/São_Paulo**. |
| **Margem média** (campo API legado) | **Margem bruta sobre receita** do mês (`margemMesPct`) — mantido na API por compatibilidade; **não** exibido na grelha de KPIs do painel. |

**Removidos da grelha de KPIs (ciclo 0522):** cards **“Dias parado (média)”** e **“Atenção operacional”**. A média de dias parado permanece no rodapé do quadro de prioridade; a contagem de pontos de atenção continua disponível na API (`pontosAtencaoCount`) e no quadro abaixo.

**Estilo dos KPI cards:** cada card usa ícone, tarja superior (`border-t-4`) e fundo sutil com **paleta temática distinta** (ex.: emerald, sky, teal, violet) — evitar grelha monocromática.

### Veículos parados com prioridade de giro (quadro principal)

- **Localização:** secção em cartão de largura total **abaixo** da grelha de KPIs no `Painel`, com título explícito na UI.
- **Conteúdo:** tabela (ou equivalente acessível) com os veículos de `pontosAtencaoListaCompleta`, ordenação por dias **desc.**; colunas mínimas sugeridas: nome de exibição, placa, dias parado (badge com cor por faixa), atalho para ficha do veículo.
- **Cores na coluna dias parado:** ≤ **60** dias → `bg-emerald-50 text-emerald-700`; **> 60** dias → `bg-red-50 text-red-700` (helper `diasParadoVisual`).
- **Estilo da secção:** borda superior vibrante (`border-t-4`, ex. `border-emerald-500`) **sem** background colorido pesado na secção inteira.
- **Pré-visualização:** mostrar as primeiras **8** linhas na página; se existirem mais, botão **Lista completa (N)** abre **diálogo** scrollável com todos os itens.
- **Atalhos:** **Filtrar no estoque** mantém deep link com `diasMin` alinhado ao limiar.
- **Estado vazio:** mensagem **positiva** (sem tom de erro) quando não há veículos acima do limiar.

## Blocos complementares (resumo comercial)

### Marcas mais vendidas

- **Métrica:** contagem de **`Sale`** no período, agrupadas pela **marca** do veículo vendido (`Vehicle.brand`), comparação **case-insensitive** após `trim`; empates → desempate **alfabético** pela marca normalizada.
- **Quantidade no ranking:** top **5** marcas.
- **Período (configurável só no servidor):** variável de ambiente **`DASHBOARD_TOP_BRANDS_MONTHS`**
  - inteiro entre **1** e **36**;
  - se ausente, inválido ou fora do intervalo: usar **12** (últimos 12 meses civis contínuos até “hoje” do cálculo, no fuso **America/São_Paulo**).
- **Estado vazio:** quando não houver vendas no período, mensagem **neutra** (sem tom de erro).

### Resumo de vendas por mês

- **Formato:** resumo **tabular ou em lista**, **sem** exigência de gráfico interactivo ou biblioteca de charts neste âmbito.
- **Conteúdo:** para cada um dos últimos **`DASHBOARD_VENDAS_RESUMO_MONTHS`** meses civis em **America/São_Paulo**, exibir **número de vendas** naquele mês (mesma noção de “venda no mês” que [Vendas — mês civil](../../domain/vendas.md)).
- **Configuração (servidor):** **`DASHBOARD_VENDAS_RESUMO_MONTHS`**
  - inteiro entre **1** e **24**;
  - se ausente, inválido ou fora do intervalo: usar **6**.

### Destaque do veículo mais crítico (faixa no painel)

- **Quando:** se existir pelo menos um veículo acima do limiar na mesma resposta agregada **e** a preferência do utilizador [«Mostrar tarja de atenção no painel»](../user-notifications/readme.md) estiver **ligada** (default).
- **Conteúdo:** o **primeiro** item de `pontosAtencaoListaCompleta` (equivalente ao primeiro de `pontosAtencao[]` quando este espelha o topo da lista ordenada por dias **desc.**) — placa, nome de exibição, dias parado e **indicador visual de atenção** (ex.: ícone de alerta da biblioteca de ícones do projecto).
- **Origem de dados:** **idêntica** ao conjunto da **atenção operacional** — **sem** segundo fetch nem regra de limiar distinta.
- **Acessibilidade:** o utilizador deve perceber o aviso **sem** depender só da cor ou do ícone — incluir **texto visível** (“Atenção: …”) ou combinação equivalente documentada na implementação, alinhada a [`../../ux/modais.md`](../../ux/modais.md) onde houver sobreposição de padrões de foco (neste bloco, tipicamente **não** é modal).

## Dias parado (regra v1)

- **Dias parado** de um veículo = função **`vehicleDaysInStock`** em `src/types/index.ts`: dias completos entre `createdAt` do veículo (timestamp de referência) e o instante “agora” do servidor ou do cálculo único na API, **desde que** a spec de implementação garanta o mesmo resultado que o cliente hoje espera para relatórios coerentes.
- Evolução futura (campo dedicado “entrada em stock”) deve atualizar esta seção e o código em conjunto.

## Limiar configurável

- Variável de ambiente (somente servidor): **`DASHBOARD_PONTOS_ATENCAO_DIAS_MIN`**
  - inteiro ≥ **1**;
  - se ausente, inválido ou &lt; 1: usar **60**.
- A API agregada pode devolver `pontosAtencaoDiasMin` na resposta para a UI montar links sem expor regra em `NEXT_PUBLIC_*`.

## API agregada

- **`GET /api/dashboard/summary`**: resposta com `pontosAtencaoDiasMin`, `disponivelCount`, `valorEmEstoque`, `diasParadoMedio`, `margemMesPct`, **`lucroMesReais`**, `vendasMesCount`, `pontosAtencaoCount`, `pontosAtencao[]` (primeiros **5** itens; ordenados por dias **desc.**), **`pontosAtencaoListaCompleta`** (todos os disponíveis acima do limiar, mesma ordenação e forma dos itens), mais:
  - **`topMarcasMonths`** — inteiro efectivo usado no cálculo (espelha env validado);
  - **`topMarcas`** — até 5 pares `{ marca, vendasCount }` ordenados por `vendasCount` desc., desempate alfabético;
  - **`vendasResumoMonths`** — inteiro efectivo (espelha env validado);
  - **`vendasPorMesResumo`** — lista ordenada do mês mais antigo ao mais recente no recorte, cada item `{ ano, mes, vendasCount }` em calendário **America/São_Paulo**.
- **Requisito**: a grelha de KPIs (incluindo **Lucro do mês**), o quadro **Veículos parados com prioridade de giro** (tabela + diálogo «Lista completa» quando aplicável), a **faixa de destaque** do pior caso e os blocos **Marcas** / **Resumo mensal** usam **esta** resposta (ou cache React Query `dashboardSummary`), **sem** pedidos duplicados para a mesma agregação.

## Performance

- As agregações novas devem entrar **no mesmo** handler agregado que já serve o painel, evitando **N+1** por mês ou por marca; definir limites máximos conforme variáveis de ambiente acima.

## Telemetria (contrato)

Eventos do **popup do centro de alertas** pós-login: stubs em `src/lib/postLoginNotificacoesTelemetry.ts` (`emitPopupNotificacoesExibido`, `emitPopupNotificacoesReconhecido`), extensíveis a outras acções do inbox conforme [Centro de alertas](../inbox-centro-alertas/readme.md).

## Fora de âmbito nesta feature

- Configuração do limiar via UI.
- Opt-out global do **popup pós-login** (este permanece com gate por sessão; ver [Auth](../auth/readme.md)); a **tarja** do pior caso no painel é a única preferência opt-out documentada em [Notificações](../user-notifications/readme.md).
- **Próximos agendamentos** ou qualquer widget de agenda no painel (ciclo próprio se existir domínio de agendamentos).
