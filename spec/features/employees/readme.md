# Funcionários (Employee)

Cycle `0720-producao-os-estoque`.

## Domínio

Colaboradores da produção: vínculo opcional a `User`; comissão; produtividade por OPs atribuídas/concluídas.

## Model

- `Employee` — `name`, `roleTitle`, `commissionPct?`, `isActive`, `userId?` (opcional).
- `ProductionOrderEmployee` — N:N com `ProductionOrder`.

## API

| Método | Rota | Auth | Notas |
|--------|------|------|-------|
| GET | `/api/employees` | allStaffRead | Paginação; `q`, `status` |
| POST | `/api/employees` | admin | CRUD mutations admin-only |
| GET/PUT/DELETE | `/api/employees/[id]` | read / admin | |
| GET | `/api/employees/[id]/productivity` | allStaffRead | Contagens + OPs recentes |

Vínculo à OP: `employeeIds[]` em `PUT /api/production-orders/[id]`; bloqueado se OP `concluida`.

## UI

- `/funcionarios` — Stitch 13: lista, drawer produtividade, CRUD admin

Componente: `FuncionariosLista.tsx`.

## Seed

4 funcionários de exemplo (Roberto, Ana, Carlos, Juliana).

## Testes

- `tests/authorization.test.ts` — RBAC employee mutations
