# Feature: Seed de desenvolvimento e validação (massa + rotas)

Objetivo: qualquer pessoa da equipa consegue levantar PostgreSQL (Neon ou local), aplicar migrações, correr o seed e validar **back-end**, **sessão** e **fluxos UI** com dados mínimos idempotentes.

## Utilizadores canónicos (desenvolvimento)

| Papel | Email | Senha | Notas |
|--------|--------|--------|--------|
| Admin | `admin@lignum.local` | `Teste@123456` | Seed 0629 |
| Vendedor | `vendedor@lignum.local` | `Teste@123456` | Seed 0629 |
| Financeiro | `financeiro@lignum.local` | `Teste@123456` | Seed 0629 |
| Produção | `producao@lignum.local` | `Teste@123456` | Seed 0629 |
| Somente leitura | `readonly@lignum.local` | `Teste@123456` | Seed 0629 |

Variáveis opcionais: `SEED_PASSWORD` / `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_EMAIL`, `SEED_VENDEDOR_EMAIL`, etc.; e2e: `E2E_ADMIN_EMAIL`, `E2E_PASSWORD`.

## SQL opcional (bootstrap)

`prisma/seed-admin.sql` espelha o admin Lignum. O `npm run db:seed` já cria o mesmo utilizador.

## Seed mínimo (default)

`npm run db:seed` cria (idempotente):

- 5 utilizadores canónicos (`admin`, `vendedor`, `financeiro`, `producao`, `read_only`) — ver tabela acima
- 1 linha `ErpSetting` (`id = 1`) com defaults AlaCruz/Lignum

**Sem** multi-loja, **sem** `super_admin`, **sem** massa BULK no fluxo default.

## Massa volumosa (opcional, manual)

`prisma/seedBulk.ts` permanece no repo para demos de performance, **fora** do `db:seed` default. Executar manualmente: `npx tsx prisma/seedBulk.ts` (requer admin existente).

## Integrações externas nos testes

- **SENATRAN** (`/api/senatran/*`): testes usam **mock** quando aplicável.
- **Document lookup CNPJ** (`/api/document-lookup`): default **`DOCUMENT_LOOKUP_PROVIDER=mock`** em dev/testes; smoke `npm run smoke:document-lookup`.
- **FIPE**: rota removida no cycle 0623; testes FIPE eliminados.

## Testes de integração API

- `RUN_DB_TESTS=true npm run test` — requer `DATABASE_URL` e seed aplicado.
- Fixtures inline em `tests/api/routes.test.ts` (`TESTAPI1`, cliente teste) quando seed mínimo.

## Referências

- Migration: `20260623190000_init_lignum_single_tenant`
- Cycle: `cycles/Q3-2026/0623-fundacao-rebrand-core/`
- Cycle cadastros CNPJ: `cycles/Q3-2026/0706-cadastros-clientes-cpf-cnpj/` — smoke `scripts/smoke/document-lookup-smoke.ts`
