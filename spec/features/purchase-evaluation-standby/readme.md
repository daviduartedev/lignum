# Feature: Avaliação de compra e standby (“não compra”)

## Objetivo

Separar claramente a **avaliação técnica** (estado do veículo) da **avaliação de compra** (decisão comercial de comprar ou não o veículo ao cliente), e dar visibilidade aos casos em que a loja **não compra**, com motivo registado.

## Comportamento

- **Avaliação técnica** e **avaliação de compra** são **fluxos e listagens distintos** na área de avaliações.
- Uma avaliação de compra está **ligada a um veículo**.
- **Cliente opcional**: pode existir avaliação de compra sem cliente cadastrado (quando o lead não foi formalizado).
- Um veículo em avaliação de compra **não entra automaticamente** no Estoque ativo.
- Quando o operador marcar o resultado como **comprado**, o veículo deve ser promovido para o **Estoque ativo** (por padrão, `VehicleStatus = disponivel`) e passar a aparecer em `/estoque`.
- Quando o resultado é **não comprado**:
  - o registo de **motivo** fica **opcional** (não deve bloquear o fluxo);
  - o veículo **sai do estoque ativo** e aparece numa **lista dedicada** (standby / não compra).
- O estado do veículo para esse caso é representado pelo modelo de dados acordado (ex.: `VehicleStatus` específico ou regra de negócio equivalente documentada no código).
- **Menu lateral:** o produto pode omitir um item dedicado “Standby compra” na navegação global; a funcionalidade continua acessível por URL/bookmarks quando existir.

## Permissões

- Alinhado ao restante ERP: papéis `staff` para criar/editar; detalhes em `withRole` nas rotas.

## Fora de âmbito

- Negociação de compra com integração a financeiras externas.
