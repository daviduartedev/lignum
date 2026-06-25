# Feature: Giro / Marketing (stock parado)

## Objetivo

Dar um espaço de trabalho, hoje acessível por **`/giro`**, com rótulo de menu **"Giro/Marketing"**, para a equipa **reagir a veículos disponíveis há demasiado tempo** no stock, com ações de **venda/operacional** (ex.: bater preço, oferecer bônus) **registáveis e auditáveis** — **sem** alteração automática de preço de veículo nesta versão (ciclos futuros podem aprofundar automação e integrações de campanha).

## Regra de "muito tempo parado"

- Alinhar ao domínio existente: **dias parado** calculado como o painel/estoque ([Estoque](../estoque/readme.md), [Painel](../dashboard/readme.md)) — hoje com base em `vehicleDaysInStock` / `createdAt` conforme a implementação.
- **Limiares** administráveis globalmente em [ERP Setting](../erp-setting/readme.md):
  - `alertGiroWarnDays` — primeiro nível de atenção;
  - `alertGiroCritDays` — nível crítico (deve ser **≥** warn ou o produto aplica a ordem documentada no formulário de configurações).
- A lista de Giro apresenta veículos **acima** do limiar "warn" (e destaca "crit" na UI, conforme implementação), coerente com a menção a Giro no [Centro de alertas](../inbox-centro-alertas/readme.md).

**Nota de produto — defaults:** a implementação actual usa warn/crit p.ex. 30/45 no *seed* de ERP; se o negócio desejar 60/90 (como no painel `DASHBOARD_PONTOS_ATENCAO_DIAS_MIN`), ajustar **apenas** de forma consciente e documentar o valor efectivo em [ERP Setting](../erp-setting/readme.md).

## Ações (v1 mínimo)

- Para cada veículo ou ação, campos mínimos sugeridos para ciclos futuros e **auditoria** hoje: tipo de ação (enum: `bater_preco_sugerida`, `bonus`, `outro`); texto curto; responsável; data/hora; opcionalmente **valor** ou nota. **Não** aplicar bônus automático a `sellingPrice` sem ciclo e permissões explícitas.

## Navegação e naming

- **Menu lateral:** label **"Giro/Marketing"**; rota canónica **`/giro`** (redirect opcional de um nome antigo "Marketing" se existir bookmark interno; não obrigatório se nunca houver rota pública "marketing").

## Relacionamento com outras features

- **Estoque** e **Pontos de atenção** do painel: mesma regra de dias parado para consistência; evitar "segundo" cálculo concorrente.
- [Financeiro](../financeiro/readme.md) não duplica a lista de giro; pode linkar ações comerciais para veículo quando fizer sentido.
