# Feature: Avaliações (técnica vs compra)

Esta área cobre dois conceitos distintos:

- **Avaliação técnica**: checklist/nota técnica do veículo (histórico por veículo).
- **Avaliação de compra**: decisão comercial de comprar (ou não) um veículo candidato, com fluxo separado do Estoque.

## Modelo

`Evaluation` — `score?`, `observations?`, `technicalNotes?`, `checklistJson?`,
`photoUrls[]`, `vehicleId`.

### Avaliação técnica (formulário guiado + resultado)

Para a avaliação técnica, `checklistJson` é o campo canônico para persistir as respostas do formulário guiado.

Requisitos de comportamento:

- **Sem pré-seleção**: itens do checklist/perguntas **não** podem vir marcados por padrão.
- **Salvar parcialmente**: o operador pode salvar um **rascunho** e retomar depois.
- **Finalizar**: existe uma acção explícita de **finalização**; após finalizada, a UI exibe um **dashboard de resultado por veículo** (na ficha do veículo) com leitura em poucos segundos (destaques e severidade).

Estrutura sugerida (contrato de app, armazenado em `checklistJson`):

- `version`: string (para evoluir sem quebrar históricos)
- `status`: `"draft" | "final"`
- `sections`: lista de grupos (ex.: suspensão, câmbio, motor, elétrica, pneus, lataria, interior, documentação)
  - cada seção contém perguntas e respostas (escala / múltipla escolha / texto), permitindo campos vazios no rascunho.

Obs.: `checklistJson` permanece **Json livre** no banco; a validação/shape é responsabilidade do formulário no cliente e do schema de API quando aplicável.

## Endpoints (`withRole(staffRoles)`)

- `GET /api/evaluations?page&pageSize`
- `POST /api/evaluations`
- `GET /api/evaluations/[id]`
- `PUT /api/evaluations/[id]`
- `DELETE /api/evaluations/[id]`

## UI

### Avaliação de compra (canônico)

- **Lista**: `/avaliacao` (entrada principal do menu lateral: “Avaliação de compra”).
- **Detalhe por veículo**: `/avaliacao/compra/[id]`.
- **Standby / não compra (lista)**: `/avaliacao/standby`.

### Avaliação técnica (fluxo existente)

- A avaliação técnica é acessada a partir da **ficha do veículo** (botão/atalho na UI do veículo) e permanece associada ao veículo.
- A rota existente por veículo continua válida (inclui o histórico e o registro de nova avaliação).

No fluxo guiado:

- “Iniciar avaliação técnica” abre o formulário estruturado.
- O resultado deve ter um dashboard **por veículo** (não agregado da frota) e deve ser legível rapidamente.

## Relacionamentos

- `Vehicle` (Cascade).

## Notas

- `checklistJson` é `Json?` livre — formato é responsabilidade do form no cliente.
- Upload de fotos fica para ciclo futuro; `photoUrls` por ora aceita strings
  preenchidas manualmente.
