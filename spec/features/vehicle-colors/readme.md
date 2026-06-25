# Feature: Cores de veículo (padrão revenda)

## Objetivo

Oferecer uma gama de **cores típicas de revenda** no cadastro/edição de veículos, sem perder flexibilidade.

## Comportamento

- O campo de cor é **texto livre** na persistência (`Vehicle.color`).
- Na UI, o utilizador escolhe:
  - uma **sugestão** de uma lista curada e pesquisável (nomes em PT-BR, agrupamento simples), ou
  - **Outro**, seguido de texto livre (trim ao gravar).
- Registos antigos com qualquer string de cor **continuam válidos** e são exibidos tal como gravados.

## Fora de âmbito

- Padronização fonética ou mapa de cores para relatórios externos (pode evoluir em ciclo futuro).

## Referência de implementação

- Componente de formulário de veículo (`FormVeiculo` ou sucessor).
- Lista de sugestões pode viver em um módulo dedicado (ex.: `src/lib/vehicleColors.ts`) para facilitar revisão.
