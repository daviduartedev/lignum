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

- 5 utilizadores canónicos — ver tabela acima
- 1 linha `ErpSetting` (`id = 1`)
- **Orçamentos / body models** (cycle 0713)
- **Carrocerias usadas:** 3–5 registos com `UsedBodyStatusHistory` (cycle 0720)
- **Materiais:** todos os SKUs de `BOM_CATALOG_SEED` com saldo inicial; `EST-PER` abaixo do mínimo para alertas
- **Funcionários:** 4 exemplos (Roberto, Ana, Carlos, Juliana)
- **OP de exemplo:** orçamento aprovado → convert manual ou via seed → kanban `/producao`

## Massa volumosa (desactivada)

`prisma/seedBulk.ts` **desactivado** após teardown Movix (0720). Não executar em fluxo normal.

## Validação E2E Lignum (0720)

| Spec | Cenário |
|------|---------|
| `e2e/producao-lignum.spec.ts` | convert → start OP → materiais consumidos; RBAC vendedor |
| `e2e/auth-rbac.spec.ts` | login por papel |
| `e2e/smoke.spec.ts` | painel, clientes, leads |

Login produção: `producao@lignum.local` / `Teste@123456`

## Integrações externas nos testes

- **SENATRAN veículo:** removido (0720)
- **Document lookup CNPJ:** mock em dev/testes

## Testes de integração API

- `RUN_DB_TESTS=true npm run test` — requer `DATABASE_URL` e seed aplicado.
- Fixtures inline em `tests/api/routes.test.ts` (`TESTAPI1`, cliente teste) quando seed mínimo.

## Referências

- Migration: `20260623190000_init_lignum_single_tenant`
- Cycle: `cycles/Q3-2026/0623-fundacao-rebrand-core/`
- Cycle cadastros CNPJ: `cycles/Q3-2026/0706-cadastros-clientes-cpf-cnpj/` — smoke `scripts/smoke/document-lookup-smoke.ts`
