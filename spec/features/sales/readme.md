# Feature: Sales

Vendas de veículos.

## Modelo

`Sale` — `saleDate`, `finalPrice`, `paymentMethod?`, `financingBank?`, `notes?`,
`vehicleId` (**unique**), `clientId`.

## Endpoints (`withRole(staffRoles)`)

- `GET /api/sales?page&pageSize`
- `POST /api/sales`
- `GET /api/sales/[id]`
- `PUT /api/sales/[id]`
- `DELETE /api/sales/[id]`

## Regras

- `Sale.vehicleId` é **único**. Tentar criar segunda venda para o mesmo veículo →
  `409 CONFLICT` com mensagem "Já existe uma venda registrada para este veículo."
- Ao criar/atualizar venda, a UI atualiza `Vehicle.status` para `vendido` via ação
  explícita (ou em transação Prisma, conforme implementação do handler).

## UI

- Lista/registro: `/venda`.
- Detalhe: `/venda/[id]`.
- **Etapa 2 — forma de pagamento:** opções em `RadioGroup`; cada opção é um `Label` que envolve o `RadioGroupItem` (clique em toda a área do card seleciona). Destaque visual quando selecionado. Campo **Observações do pagamento (opcional)** nunca exibe a string `null` — vazio ou placeholder quando sem valor.
- **Etapa 3 — resumo:** breakdown de entrada, saldo, forma, banco e promissória quando aplicável. Observações por forma gravadas em `Sale.notes` com prefixo `Pagamento:` até existir modelo `SalePayment`. Bloco **Desempenho comercial** (incl. linhas «Custo total do veículo» e «Venda») e tarja de contratos/documentos com **fundos sólidos** visualmente consistentes (sem transparências/gradientes inconsistentes entre sub-cards).

### Pagamentos múltiplos (fora de âmbito v1)

Split de N formas por venda exige modelo `SalePayment` — ver proposta em ciclo `0522-feature-x-large-cycle/spec-delta.md`; **não** implementado.

## Relacionamentos

- `Vehicle` (`onDelete: Cascade` — se o veículo for apagado, a venda cai junto).
- `Client` (`onDelete: Restrict`).
