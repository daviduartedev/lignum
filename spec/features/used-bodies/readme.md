# Carrocerias Usadas (UsedBody)

Cycle `0720-producao-os-estoque` (substitui cadastro de veículos Movix para revenda).

## Domínio

Catálogo de carrocerias seminovas/usadas: medidas, conservação, valores, fotos, histórico de status.

## Models

- `UsedBody` — título, medidas, `condition`, `status`, valores entrada/venda, fotos.
- `UsedBodyStatusHistory` — append-only por mudança de status.

## Enums

- `UsedBodyStatus`: `disponivel` | `reservada` | `vendida` | `em_reforma`
- `UsedBodyCondition`: `excelente` | `bom` | `regular` | `ruim`

## API

| Método | Rota | Auth | Notas |
|--------|------|------|-------|
| GET | `/api/used-bodies` | allStaffRead | Paginação; `q`, `status` |
| POST | `/api/used-bodies` | commercialWrite | Cria com histórico inicial |
| GET/PUT/DELETE | `/api/used-bodies/[id]` | read / write | DELETE admin; status `em_reforma` → productionWrite |
| PUT status `em_reforma` | — | productionWrite | `producao` só campos status/notes |

## UI

- `/carrocerias-usadas` — grid Stitch 12: KPIs, filtros status, cards
- `/carrocerias-usadas/nova`, `/carrocerias-usadas/[id]/editar` — formulário com upload Blob

Componentes: `CarroceriasUsadasLista.tsx`, `FormUsedBody.tsx`.

## Testes

- `tests/authorization.test.ts` — vendedor POST OK; read_only bloqueado
- `e2e/producao-lignum.spec.ts` — vendedor cria carroceria
