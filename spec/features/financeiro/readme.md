# Feature: Financeiro (A Pagar / A Receber)

## Objetivo

Unificar, numa **única área** acessível por **`/financeiro`**, tudo o que a operação trata como **dinheiro a entrar, a sair, parcelas e despesas** registáveis, com o mesmo padrão de **alertas e notificações** do resto do produto (lista `/notificacoes`, **sininho** do inbox, **popup pós-login** quando aplicável) e ligação ao **calendário** existente em **`/calendario`**.

Não se pretende **segundo modelo** de calendário ou agenda paralela: vencimentos e lembretes derivados desta feature alimentam a mesma experiência de calendário e notificações já descritas em [Calendário (operacional)](../calendario/readme.md), [Notificações do utilizador](../user-notifications/readme.md) e [Centro de alertas](../inbox-centro-alertas/readme.md).

> **Alinhamento de paths:** a UI canónica de recebíveis (promissórias) vive **dentro** de Financeiro. Rotas legadas ` /promissorias` (e subcaminhos) **redirecionam** para `/financeiro` com estado/âncora equivalente, para **não quebrar** links antigos.

## Escopo (v1)

- **A Receber:** parcelas e recebíveis modelados hoje em **`PromissoryNote`**, criados automaticamente na conclusão de venda a prazo (promissória) conforme [Venda com promissória](../sale-promissory/readme.md) e [Promissory Notes (modelo)](../promissory-notes/readme.md).
- **A Pagar:** contas a pagar e despesas **digitadas** (com valor e vencimento) e, quando o ciclo de **cadastro de veículo** estiver concluído, entradas originadas da **compra** (forma de pagamento) — **um contrato** com [cadastro-veículo / compra] sem duplicar a lógica de venda de veículo além do gatilho e campos canónicos.
- **Instrumentos fora de recebíveis automáticos:** outras formas de pagamento de venda (ex.: `financiamento`, `cartao`) **não** geram, no v1, linhas em A Receber; o acompanhamento faz-se com **lembretes manuais** (notificação com `remindAt`) e evolução futura conforme [Sales](../sales/readme.md) se surgir origem de dados.
- **Garantias:** a entrada de gestão de garantias continua fora do hub (ex. **`/garantias`**) e **não** é duplicada como módulo dentro de `/financeiro`.
- **Histórico:** operações concluídas (pagas) permanecem **auditáveis** a partir das listas e detalhe (não apagar desnecessariamente; soft-delete ou cancelado apenas onde já exista regra de domínio).

## Roteamento e UI

- **Rota única** da área: `/financeiro`. Apresentação com **A Pagar** e **A Receber** no mesmo sítio (ex.: abas, segmento ou ancoras). **Não** exigir duas rotas de topo (`/financeiro/pagar` e `/financeiro/receber` como requisito).
- **Menu lateral:** item **"Promissórias"** removido. O atalho canónico para recebíveis é **Financeiro → A Receber**.
- **Redirecionamento legado:** `GET /promissorias[...] ` → resposta de redirect para `/financeiro` com indicação de sub-vista (ex. query `view=receber` ou `tab=receber`), a documentar de forma idêntica no código (middleware, `next.config` redirect ou `page` de redirect no App Router).

## Recebíveis (A Receber)

- Fonte: **`PromissoryNote`**.
- Cada registo = **uma parcela** com `dueDate` (vencimento), `amount`, `status`, `clientId`, `vehicleId`.
- Venda a prazo concluída: **N** parcelas persistidas; cada uma alimenta:
  - a lista **A Receber**;
  - o **calendário** (ver regra 1:1 com parcela abaixo);
  - o agendamento de avisos com antecedência (ver Notificações).

**Pagamento futuro com data ("vai pagar amanhã", etc.):** quando o fluxo de venda captar **data** (e **hora** se existir) e **valor** explícito, o produto gera, conforme o caso, **(a)** recebível de parcela única com `dueDate` nessa data e/ou **(b)** lembrete `UserNotification` com `remindAt` alinhado — mantendo título e corpo comprensíveis e **link** para o contexto (veículo, venda, ou financeiro).

## Pagáveis (A Pagar)

- Modelo canónico: **`Payable`** (nome implementável: `Payable` / "conta a pagar") com, no mínimo: origem, descrição, **valor**, **vencimento**, **status** (aberto, pago, cancelado, …), e vínculos opcionais a `vehicleId`, `supplierId` ou referência a compra.
- Inclui **despesas manuais** introduzidas em inputs pela equipa, com categorização mínima documentada no mesmo modelo ou em enum simples.
- **Integração compra (dependência):** o ciclo de cadastro de veículo alimenta A Pagar conforme a forma de pagamento; este contrato referencia o payload / evento de negócio **sem** duplicar o assistente de compra noutro sítio.

### A Pagar — UI (hub `/financeiro`)

- **Criação:** formulário com descrição, valor (máscara BRL), vencimento via **`DatePickerField`** (calendário visual em painel dropdown — **não** `<input type="date">` nativo), origem via `Select`.
- **Confirmação de pagamento:** botão inline **"Confirmar pagamento"** na listagem; `AlertDialog` de confirmação; acção `PUT /api/payables/[id]` com `status: "paga"` e `paymentDate` = hoje (fuso local); invalidar cache React Query após sucesso.

## Calendário

- Cada `PromissoryNote` **aberta** com vencimento num dado mês aparece no **día** certo, com título acessível e **valor** quando fizer sentido; **cada parcela = um evento** no mês.
- Vencimentos de **A Pagar** (modelo `Payable`) idem, na mesma superfície.
- Lembretes ad hoc continuam a usar `UserNotification.remindAt` (ver [Calendário (operacional)](../calendario/readme.md)).
- **Parcela paga / conta paga:** o evento deixa de contar para alertas pendentes; o histórico mostra a situação paga, sem reaparecimento indevido.

## Notificações, sininho, popup pós-login

- **Antecedência padrão:** avisar **1 dia útil de calendário** antes do vencimento do evento financeiro (não o mesmo mecanismo que `inboxPreEventPopupMinutes` para compromissos, mas **coerente** na app).
- **Configuração global (empresa):** em [ERP Setting](../erp-setting/readme.md), campo de antecedência de eventos financeiros (dias) com default **1** (ajustável por admin).
- **Override por utilizador:** o utilizador pode fixar outra antecedência; o valor efectivo = **default admin** + **override** conforme a regra de precedência (override substitui default quando preenchido). Persistência: preferência no utilizador ou extensão de `/api/user/inbox-preferences` (a fixar na implementação e reflectida no mesmo sítio de “definições de notificação” da lista `/notificacoes`).
- **Rearme:** alterar `dueDate` ou o instante alvo de um lembrete **invalida** a janela de aviso anterior e **recalcula** o aviso, sem deixar duplicados lógicos.
- **Idempotência:** o mesmo vencimento não deve produzir duas notificações idênticas se o agendador correr duas vezes; usar chave lógica ou registo de envio (definir na implementação) alinhada a [Centro de alertas](../inbox-centro-alertas/readme.md).

## Integração de vendas

- **Não** duplicar a conclusão de venda: reagir ao fluxo canónico em que, para `PaymentMethod.promissoria` e `promissoryPlan`, já se criam `PromissoryNote` em `POST /api/sales` (ou equivalente). Melhorar apenas a **visibilidade** pós-venda (links para **Financeiro → A Receber** e calendário), sem segunda fonte de verdade.
- [CONFIRMAR EM IMPLEMENTAÇÃO] Formulário de "pagamento amanhã" fora de promissória: só lembretes manuais até existir matriz de parcelas noutro enum.

## API (direcção v1, referência)

- Manter `GET/POST/PUT/DELETE` em ` /api/promissory-*` com semântica de A Receber, ou evoluir para ` /api/finance/receivables` com o mesmo corpo, sem quebrar clientes; documentar o alias na implementação.
- `GET/POST/PUT/DELETE` para **A Pagar** (path sugerido: ` /api/payables` ou ` /api/finance/payables`) com filtros de listagem (status, vencimento, origem).
- (Opcional) `GET /api/finance/summary` agregado para o hub.
