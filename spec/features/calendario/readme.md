# Feature: Calendário operacional

## Objetivo

A rota **`/calendario`** concentra, num **único mês** navegável, eventos de negócio com data (e hora, quando existir) que a equipa precisa enxergar no tempo: vencimentos de **recebíveis** ([Financeiro — A Receber](../financeiro/readme.md)), vencimentos de **A Pagar** quando o modelo `Payable` existir, **ordens de serviço** com prazo, **garantias** a expirar, e **lembretes** explícitos baseados em [Notificações do utilizador](../user-notifications/readme.md) (`remindAt`).

## Regras de conteúdo (negócio)

- **Título acessível** para cada ocorrência; se existir **horário** (ex. `remindAt` com hora), a UI mostra a hora; se a origem for só data (ex. `PromissoryNote.dueDate` a nível de dia), o evento é **só de calendário de dia** sem hora inventada.
- **Recebíveis (promissórias / parcelas):** cada `PromissoryNote` **aberta** gera **um ponto** no calendário no dia de `dueDate`. **Cada parcela = um evento** (N parcelas = N pontos, possivelmente no mesmo mês com dias distintos).
- **Lembretes manuais:** notificações com `remindAt` aparecem no mês/hora correspondente; o link padrão pode ser `/notificacoes` ou o destino fornecido em `link`.
- **Navegação cruzada:** tocar no evento deve levar a um sítio útil: **Financeiro** (recebíveis/pagáveis) em substituição de links antigos só para `/promissorias/...` quando a área for unificada; OS e mantêm rotas atuais.

## Estado pago e alertas

- Quando a parcela ou obrigação passa a **paga** (ou cancelada) no domínio de origem, o evento **deixa** de contar na camada "pendente" e na agregação de [Centro de alertas](../inbox-centro-alertas/readme.md) conforme regras desse módulo; o histórico de negócio continua acessível a partir de Financeiro e listagens de detalhe.

## Não-objetivo

- Duplicar um segundo calendário "financeiro" separado; evoluções de agenda no [Painel](../dashboard/readme.md) mantêm a linha "fora de âmbito" lá descrita, salvo ciclo que unifique proposito.

## Verificação

- Abrir o mês de uma venda promissória concluída: constar o mesmo número de vencimentos abertos que a lista A Receber; alterar a data e confirmar o **rearme** de avisos descrito no [Financeiro](../financeiro/readme.md).
