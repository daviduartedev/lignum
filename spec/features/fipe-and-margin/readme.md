# Feature: FIPE automático e lucro × FIPE

## Objetivo

Enriquecer o cadastro e a análise comercial com **valor de referência FIPE** obtido por **API**, e mostrar a **relação entre lucro estimado** (fórmula já existente no sistema) e esse referencial **em todos os ecrãs onde já há cálculo de lucro ou margem**.

## Comportamento

- **Consulta automática**: ação na UI (ex.: “Buscar FIPE”) que chama a **rota interna** `GET /api/fipe/quote`.
- **Por placa:** provedor **AutoCRLV** — `GET https://autocrlv.com.br/api/fipe.php?placa=…` (JSON com `veiculo` e `fipe[]`; sem chave; server-side). Quando há várias versões FIPE, usa o **maior valor** da lista. Resposta interna inclui `provider: "autocrlv"`.
- **Sem placa (marca/modelo/ano):** fallback **Parallelum** (API pública). Resposta interna inclui `provider: "parallelum"`.
- **Com placa informada:** não há fallback Parallelum — erro do provedor é exposto ao utilizador staff.
- **Página dedicada:** **`/fipe`** (menu lateral **FIPE**) — consulta FIPE independente do hub Giro/Marketing (`/giro`).
- **Override manual**: o utilizador pode ajustar o valor gravado no veículo após a sugestão.
- **Cache e limites**: cache 5 min e rate limit 1,5 s entre chamadas no servidor (`/api/fipe/quote`).
- **Variáveis opcionais** (`.env.example`): `FIPE_AUTOCRLV_BASE_URL`, `FIPE_AUTOCRLV_PATH`, `FIPE_AUTOCRLV_TIMEOUT_MS`.

## Comparação de lucro

- Onde o sistema exibe **lucro estimado** ou **margem** (formulário e detalhe do veículo, venda, giro, relatórios relevantes), deve aparecer uma **indicação consistente** vs valor FIPE quando este estiver preenchido.
- **Mercado / outras lojas**: fora de âmbito no ciclo que consolidou esta spec.

## Fora de âmbito

- Substituir a fórmula interna de lucro estimado sem decisão de produto explícita.

## Verificação automatizada

- E2E: `e2e/fipe.spec.ts` — mock da rota interna `/api/fipe/quote` no formulário de edição (veículo **SEED02**).
