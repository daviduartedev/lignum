# spec/decisions.md — Architecture Decision Log

> Append-only. Each entry is immutable. To reverse a decision, add a new
> entry that supersedes the old one; never delete history.

---

## ADR-0001 — Adoção do SDD Harness e portabilidade dos comandos

- **Status:** Accepted
- **Cycle:** infra (portabilidade do harness para o repo)
- **Data:** 2026-06-15

**Contexto.** Os comandos do harness (`/refine-request`, `/execute-stage`, `/validate-cycle`, `/close-stage`, `/verify-cycle`, `/update-spec`, `/close-cycle`, etc.) eram referenciados pelos cycles mas não existiam como arquivos no repositório — só `create-cycle` e `scope-cycle` estavam presentes.

**Decisão.** Portar o conjunto completo de comandos para `.cursor/commands/`, instalar `spec/development-workflow.md` e `spec/harness.md` como verdade canônica do fluxo, e criar este log de decisões.

**Consequências.** O fluxo SDD passa a ser executável tanto no Cursor quanto em outros runners que leiam `.cursor/commands/`. Gates e checkpoints humanos valem para qualquer runner.

---

## ADR-0002 — Estratégia multitenant: row-level `tenantId`

- **Status:** Superseded by ADR-0006 (2026-06-23)
- **Cycle:** `cycles/Q22026/0614-multitenant-fundacao/`
- **Data:** 2026-06-15

**Contexto.** O sistema é hoje single-tenant (nenhum model tem `tenantId`; `ErpSetting` é linha única). O produto será multitenant (lojas isoladas + papéis internos), modelo Shopify (plataforma vende lojas; cada loja com seu subdomínio). Hospedagem alvo: Vercel + Neon.

**Decisão.** Isolamento **row-level** com `tenantId` em banco único, por ser a única opção viável na Vercel sem reprovisionar infra por cliente. Banco-por-tenant e schema-por-tenant ficam descartados. O humano delegou a escolha técnica desde que valide o multitenant.

**Consequências.** Exige guard central de isolamento (Prisma `$extends`) e testes anti-IDOR cross-tenant. RLS no Postgres/Neon fica como **follow-up recomendado** (ADR futuro), não implementado neste cycle.

---

## ADR-0003 — Modelo de identidade: dois níveis (plataforma vs loja)

- **Status:** Superseded by ADR-0006 (2026-06-23)
- **Cycle:** `cycles/Q22026/0614-multitenant-fundacao/`
- **Data:** 2026-06-15

**Contexto.** A palavra "admin" hoje significa "dono da loja". O produto precisa de um nível **acima**: o dono da plataforma (você), que cria e gerencia lojas (modelo Shopify).

**Decisão.**
- **Nível plataforma:** nova role `super_admin` no `enum Role`, com bypass de tenant auditado. Cria/lista lojas.
- **Nível loja:** roles existentes (`admin` = dono da loja, `sales`, `finance`, `read_only`) — inalteradas em significado.
- **`User` pertence a 1 tenant** (`tenantId`). Multi-loja (um operador em N lojas) fica fora deste cycle.
- Criação de loja é feita pelo super-admin (tela mínima: listar + criar loja com nome, subdomínio e usuário-dono). **Sem auto-cadastro público** neste cycle.

**Consequências.** `super_admin` precisa de caminho auditado que cruza tenants; todo o resto é estritamente escopado. Onboarding self-service e troca de tenant ativo ficam para cycles futuros.

---

## ADR-0004 — Subdomínio do tenant: `Tenant.slug` gerado na publicação do site

- **Status:** Superseded by ADR-0006 (2026-06-23)
- **Cycle:** `cycles/Q22026/0614-multitenant-fundacao/`
- **Data:** 2026-06-15

**Contexto.** Cada loja terá um subdomínio (ex.: `lojadefulano.movix.com.br`, modelo Shopify). O humano esclareceu que o link é **gerado quando o dono finaliza a customização do site** (página `/site`), não na criação da loja.

**Decisão.**
- O subdomínio canônico vive em **`Tenant.slug`** (único, derivado do nome da loja, **editável**).
- O slug é **definido/confirmado no momento da publicação do site** (em `/site`); `ErpSetting.siteSubdomain` passa a espelhar/derivar de `Tenant.slug`.
- O cycle `0615` (site público por subdomínio) **lê de `Tenant.slug`**.
- `Tenant` ganha colunas opcionais de plano (`maxUsers?`, `maxVehicles?`) **sem lógica de cobrança** (billing é cycle futuro).

**Consequências.** A geração efetiva do link e o roteamento por host pertencem ao cycle `0615`; este cycle apenas garante o campo canônico, unicidade e a derivação. Reaproveitar `normalizeStoreSubdomain` para o slug.

---

## ADR-0005 — Hotfix: imports quebrados no FinanceiroHub (fora do ciclo 0614)

- **Status:** Accepted
- **Cycle:** hotfix durante o fechamento de `0614-multitenant-fundacao`
- **Data:** 2026-06-15

**Contexto.** O `npm run build` do ciclo 0614 estava bloqueado por 2 imports **preexistentes** quebrados em `src/components/backoffice/FinanceiroHub.tsx` (`useConfirmPayablePayment` de `@/hooks/usePayables` e `MAX_DECIMAL_14_2` de `@/lib/money`), que nunca existiram. Não tinham relação com o multitenant, mas impediam o build de fechar.

**Decisão.** Com autorização explícita do humano, implementar (não stub) o que faltava:
- `MAX_DECIMAL_14_2 = 999999999999.99` em `src/lib/money.ts` (teto de `Decimal(14,2)`).
- `confirmPayablePayment(id)` em `src/services/internal/payables.ts` (PUT `/api/payables/[id]` → `status: "paga"` + data de hoje).
- `useConfirmPayablePayment()` em `src/hooks/usePayables.ts` (mutation que confirma pagamento e invalida cache).

**Consequências.** Build e typecheck do projeto inteiro = 0 erros. O botão "confirmar pagamento" de contas a pagar passa a funcionar. Trabalho fora do escopo de 0614, registrado aqui para rastreabilidade; não altera a arquitetura multitenant.

---

## ADR-0006 — Single-tenant (1 banco = 1 fábrica)

- **Status:** Accepted
- **Cycle:** `cycles/Q3-2026/0623-fundacao-rebrand-core/`
- **Data:** 2026-06-23
- **Supersedes:** ADR-0002, ADR-0003, ADR-0004

**Contexto.** Lignum Gestão serve uma única fábrica de carrocerias por instalação. Multitenant Movix (row-level `tenantId`, `super_admin`, storefront, plataforma) aumentava superfície de ataque e não reflete o modelo de negócio AlaCruz.

**Decisão.** Single-tenant: sem `Tenant`/`tenantId`/`super_admin`; `prisma` singleton; `ErpSetting` `id=1`; remoção física de storefront, plataforma e cadastro público. Preservar models/APIs de veículo para cycles de domínio (0720+).

**Consequências.** Reintroduzir multitenant exigiria novo ADR. Seed mínimo: admin + ErpSetting. Testes cross-tenant removidos; RBAC + `ownerUserId` mantidos.

---

## ADR-0007 — Separação core vs domínio (documentação)

- **Status:** Accepted
- **Cycle:** `cycles/Q3-2026/0623-fundacao-rebrand-core/`
- **Data:** 2026-06-23

**Contexto.** O repo mistura ERP genérico (auth, financeiro, PDF) com domínio herdado de revenda de veículos. Cycles futuros adaptarão para carrocerias.

**Decisão.** Core: auth, settings, financeiro, notificações, PDF, relatórios, calendário, documentos, leads, SENATRAN base. Domínio: orçamentos, produção, materiais (cycles 0629+). Neste cycle: documentação only; nav oculta itens Movix de revenda.

**Consequências.** Código veículo acessível por URL em dev até cycle 0720. Novos módulos Lignum estendem core em vez de duplicar.
