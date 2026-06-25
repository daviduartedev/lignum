# Domínio: Vendas — definições partilhadas

## Mês civil corrente (produto)

- Para métricas “do mês” no painel e relatórios alinhados a esta spec, o **mês civil corrente** é calculado no fuso horário **`America/São_Paulo`**.
- Uma venda entra no mês quando a data canónica da venda (`saleDate` em `Sale`, mapeada como data-only no Prisma) está entre o primeiro e o último dia desse mês **nessa zona horária**.

## Custo na venda

- **Custo** associado a uma venda = custo de aquisição do veículo vendido (`purchasePrice` do `Vehicle` ligado à venda), obtido pela mesma cadeia de resolução que o painel usa hoje (relação directa ou fallback por id).

## Margem bruta sobre receita (painel)

**Margem média** no card do painel (mês corrente, America/São_Paulo):

1. Considerar todas as vendas `Sale` cuja data caia no mês corrente (ver seção acima).
2. Para cada venda onde existam **receita** e **custo** estritamente positivos:
   - `receita_i` = `finalPrice` convertido para número;
   - `custo_i` = custo de aquisição conforme “Custo na venda”.
3. Se `Σ receita_i = 0`, a margem exibida é **0** (ou “—” na UI, desde que documentado no mesmo sítio).
4. Caso contrário:

\[
\text{margem\_\%} = \frac{\sum_i (\text{receita}_i - \text{custo}_i)}{\sum_i \text{receita}_i} \times 100
\]

Esta quantidade é a **margem bruta sobre receita** agregada do mês (equivalente a média ponderada das margens por receita com peso `receita_i`).

## Vendas canceladas ou revertidas

- O modelo actual de `Sale` **não** possui estado de cancelamento. Enquanto assim for, **todas** as vendas persistidas entram no cálculo do mês.
- Quando existir estado ou soft-delete, esta seção deve ser atualizada: a decisão de produto vigente é **incluir** registos cancelados/revertidos no denominador/numerador **se** ainda existirem como linhas de `Sale`; caso contrário, especificar exclusão explícita.

## Relação com outras métricas

- Indicadores ao nível de veículo (lucro estimado, FIPE) seguem [FIPE e margem](../features/fipe-and-margin/readme.md) onde aplicável; o card do painel usa **sempre** a definição deste documento para a **média do mês**.
- O **resumo de vendas por mês** no painel (lista dos últimos N meses) usa a **mesma** regra de inclusão de `Sale` no mês civil em **America/São_Paulo** que a secção “Mês civil corrente” deste documento; alterações futuras a estados de venda devem actualizar **ambos** os sítios.
