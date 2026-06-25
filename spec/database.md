# Padroes de banco de dados

Politica para migrations, queries e seeds com Prisma. Deriva do fluxo atual do projeto.

## Migrations

- Usar o fluxo oficial: `npm run prisma:migrate` (`prisma migrate dev`).
- Commitar a pasta de migration gerada em `prisma/migrations/`.
- Naming: timestamp + slug descritivo (padrao Prisma), ex.: `20260517170000_user_session_revocation`.
- Evitar SQL manual solto fora de migrations versionadas.
- Migrations de dados complexas: documentar README na pasta da migration quando necessario (ver exemplos existentes).

## Schema

- Schema canonico em `prisma/schema.prisma`.
- Após alteracao: `prisma generate` (roda no postinstall e build).

## Naming convention

- Tabelas: snake_case no banco, modelos PascalCase no Prisma (convencao Prisma).
- Colunas: camelCase no Prisma, mapeadas conforme schema existente.
- Foreign keys: definir relacoes explicitas quando aplicavel.
- Indices: adicionar apenas com justificativa (filtros frequentes, FKs, unicidade).

## Multi-tenant e escopo

- **Estado actual (0623):** **single-tenant** — sem `tenant_id`; uma fábrica por instalação.
- Migration inicial Lignum: `20260623190000_init_lignum_single_tenant`.
- Escopo por **role** (`withRole`) e **`ownerUserId`** onde aplicável.

## Queries

- Preferir `$transaction` para operacoes atomicas (count + list, multi-write).
- Evitar N+1: usar `include`/`select` conscientemente ou batch queries.
- Paginar listagens grandes; limitar `?all=1` (ja rate-limited no app).
- Nunca expor queries raw sem parametrizacao.

## Seeds e dados de teste

- Seed oficial: `npm run db:seed` (`prisma db seed` → `prisma/seed.ts`).
- Seeds idempotentes quando possivel (ver [`features/dev-seed-and-validation/readme.md`](features/dev-seed-and-validation/readme.md)).
- Reset local: `npm run db:reset` (destrutivo — apenas dev).
- Dump: `npm run db:dump` quando necessario.

## Rollback e mitigacao

- Rollback de migration em dev: restaurar backup ou `db:reset` + re-seed.
- Producao: migration forward-only; plano de mitigacao documentado no cycle se migration for de risco.
- Mudancas de schema exigem validacao (`typecheck`, `test`, smoke manual) e revisao no cycle.

## Checklist para cycles com migration

- [ ] Migration versionada e commitada.
- [ ] Schema compativel com codigo existente.
- [ ] Seed atualizado se necessario.
- [ ] Sem breaking change nao documentado no plan/spec-delta.
- [ ] Indices justificados.
- [ ] Queries novas escopadas corretamente.

## Referencias

- Seguranca e autorizacao: [`security/authorization-matrix.md`](security/authorization-matrix.md)
- Backend: [`backend.md`](backend.md)
- Seed de dev: [`features/dev-seed-and-validation/readme.md`](features/dev-seed-and-validation/readme.md)
