# Feature: Venda com promissória

## Objetivo

Permitir **venda a prazo** em que a loja acompanha **parcelas** (promissórias) ligadas ao cliente e ao veículo, com UX clara para **vencimento** vs **pagamento efetivo**.

## Comportamento

- A forma de pagamento inclui **promissória** (valor em enum `PaymentMethod` / equivalente).
- O **modal ou passo extra** só aparece quando o utilizador escolhe **venda a prazo / promissória** (não em vendas à vista ou outros meios).
- No assistente:
  - número de parcelas;
  - valor por parcela ou regra equivalente definida na implementação;
  - **data de vencimento da primeira parcela**;
  - intervalo entre vencimentos (ex.: mensal).
- Ao **concluir a venda**, o sistema **cria** os registos de parcelas na API de promissórias, associando **cliente** e **veículo**.
- **Semântica**:
  - **Vencimento** (`due_date`): data limite para pagar **aquela** parcela.
  - **Pagamento** (`payment_date`): quando a parcela foi quitada; preenchimento posterior na gestão de promissórias.
- O formulário de promissória **não** deve duplicar conceitos confusos (ex.: “primeira parcela” como campo redundante face ao número da parcela e ao vencimento).

## Integração

- Pós-venda, o acompanhamento de parcelas existe na área [Financeiro — A Receber](../financeiro/readme.md) (rota de topo **`/financeiro`**, não um item separado "Promissórias" no menu). Links internos e CTAs "ver parcelas" devem levar a essa visão.
- O calendário em **`/calendario`** mostra **cada** `dueDate` de parcela aberta como evento, conforme [Calendário (operacional)](../calendario/readme.md).
- Após venda, o utilizador pode **navegar** para acompanhar parcelas (link com filtro para a lista de A Receber).
