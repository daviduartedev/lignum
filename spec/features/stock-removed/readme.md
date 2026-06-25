# Feature: Estoque removido e restauração

## Objetivo

Ao “excluir” um veículo do **estoque ativo**, o sistema deve **arquivar** o registo (estado **removido**), **sem apagar** o histórico, e permitir **restauração** controlada.

## Comportamento

- A ação de remoção na UI **não** apaga o registo na base de dados; atualiza para `VehicleStatus.removido` (ou fluxo equivalente).
- Deve existir uma **área ou filtro** para veículos **removidos**.
- **Restaurar**:
  - apenas utilizadores com papel **admin**;
  - o administrador **escolhe o novo estado** do veículo (ex.: disponível, repasse, reservado);
  - se o estado escolhido implicar **venda**, o fluxo deve completar **venda e impactos financeiros** conforme regras existentes (wizard ou redirecionamento para venda após repor disponível).

## Operadores

- Utilizadores com papel `authenticated` (não admin) **não** restauram veículos removidos.

## Mensagens

- Textos de confirmação e erro em **PT-BR**.

## Verificação automatizada

- E2E: `e2e/stock-lifecycle.spec.ts` — fluxo **SEED02** (arquivar, operador sem “Restaurar”, admin restaura como disponível).
