# Especificacoes canonicas (Lignum Gestao)

Este diretorio e o **hub de especificacao** do repositorio: descreve o comportamento desejado do produto de forma estavel, independentemente de PRs ou cycles em `cycles/`.

## Como usar

- Cada area de produto vive em `spec/features/<nome-da-feature>/readme.md`.
- Um cycle em `cycles/` pode introduzir mudancas; o merge so fica alinhado quando `spec/` reflete o estado atual do codigo.
- O fluxo de desenvolvimento e governanca vive em [`development-workflow.md`](development-workflow.md) e [`harness.md`](harness.md).
- Path canonico de cycles: `cycles/Q{quarter}{year}/{MMDD}-<slug>/`.

## Documentacao global de engenharia

| Documento | Caminho | Resumo |
|-----------|---------|--------|
| Fluxo SDD e ciclos | [development-workflow.md](development-workflow.md) | Quando criar request, refine, validar e fechar ciclo; small/medium/large. |
| Development Harness | [harness.md](harness.md) | Definicao, principios, responsabilidades e gates do Harness. |
| Padrões para agentes | [AGENTS.md](../AGENTS.md) | Estilo, testes, estrutura e logging (obrigatório em cycles). |
| ADRs em staging | [adr-staging.md](adr-staging.md) | Decisoes aceites pendentes de promocao a `decisions.md`. |
| Seguranca (hub de ciclo) | [security.md](security.md) | Checklist operacional para ciclos que tocam API, auth ou dados privados. |
| Backend | [backend.md](backend.md) | Route handlers, services, validacao, autorizacao e erros. |
| Banco de dados | [database.md](database.md) | Migrations Prisma, naming, queries, seeds e rollback. |
| Frontend / UX | [frontend.md](frontend.md) | Componentes, estados de UI, acessibilidade e revisao visual. |
| Design system / UI patterns | [design-system.md](design-system.md) | Tokens de spacing e cores semanticas; toasts; badge/alert; politica anti-hex solto. |
| Estilo de codigo | [code-style.md](code-style.md) | ESLint, TypeScript, imports, naming e comentarios. |
| Testes | [testing.md](testing.md) | Gates de merge, cobertura de seguranca e validacao manual. |

## Indice de features

| Feature | Pasta | Resumo |
|--------|--------|--------|
| Painel (dashboard Lignum) | [features/dashboard](features/dashboard/readme.md) | Stitch 01; KPIs mock; FAB → `/producao` (0720). |
| Orçamentos (paramétrico, PDF, BOM) | [features/quotes](features/quotes/readme.md) | `/orcamentos`; convert → OP (0713 + 0720). |
| Ordens de produção | [features/production-orders](features/production-orders/readme.md) | Kanban `/producao`; baixa BOM (0720). |
| Estoque matérias-primas | [features/materials-stock](features/materials-stock/readme.md) | `/estoque/materiais` (0720). |
| Carrocerias usadas | [features/used-bodies](features/used-bodies/readme.md) | `/carrocerias-usadas` (0720). |
| Funcionários | [features/employees](features/employees/readme.md) | `/funcionarios` (0720). |
| Centro de alertas (inbox) | [features/inbox-centro-alertas](features/inbox-centro-alertas/readme.md) | `materialLowStock`; sem veículos (0720). |
| Calendario (operacional) | [features/calendario](features/calendario/readme.md) | `/calendario`: payables e lembretes. |
| Financeiro (A pagar) | [features/financeiro](features/financeiro/readme.md) | Hub `/financeiro` — payables pós-0720. |
| Clientes e fornecedores | [features/clients](features/clients/readme.md) | Hub `/clientes`; CNPJ; documentos. |
| Fornecedores | [features/suppliers](features/suppliers/readme.md) | Aba em `/clientes`. |
| Consulta cadastral CNPJ | [features/document-lookup](features/document-lookup/readme.md) | Autofill; cache; audit. |
| Ciberseguranca | [features/security](features/security/readme.md) | RBAC, rate limits, audit log. |
| Auth | [features/auth](features/auth/readme.md) | NextAuth; 5 papéis. |
| Audit log | [features/audit](features/audit/readme.md) | Acções sensíveis; admin-only. |
| Code hygiene | [features/code-hygiene](features/code-hygiene/readme.md) | Limpeza interna de baixo risco. |
| Seed de dev e validacao | [features/dev-seed-and-validation](features/dev-seed-and-validation/readme.md) | Seed Lignum + E2E (0720). |

**Removidos (Movix 0720):** `vehicles`, `estoque`, `service-orders`, `giro-marketing`, `fipe-and-margin`, `stock-removed`, `purchase-evaluation-standby`. Ver ADR-0010.

## Materiais client-facing

| Documento | Caminho | Resumo |
|-----------|---------|--------|
| Hub client-facing | [client-facing/readme.md](client-facing/readme.md) | Textos para impressao/PDF e alinhamento comercial. |

> SENATRAN veículo (Movix) arquivado — removido no cycle 0720.

## Dominio e UX transversal

| Documento | Caminho | Resumo |
|-----------|---------|--------|
| Produção Lignum | [domain/producao.md](domain/producao.md) | OP, convert, start, BOM (0720). |
| Estoque materiais | [domain/estoque-materiais.md](domain/estoque-materiais.md) | Custo médio, movimentações, alertas (0720). |
| Carrocerias usadas | [domain/carrocerias-usadas.md](domain/carrocerias-usadas.md) | Status, histórico, RBAC (0720). |
| Vendas, margem e mes civil | [domain/vendas.md](domain/vendas.md) | Definicao de margem; fuso America/Sao_Paulo. |
| Modais e dialogos bloqueantes | [ux/modais.md](ux/modais.md) | `alertdialog`, foco, backdrop e comportamento mobile. |
| LGPD e minimizacao | [security/lgpd.md](security/lgpd.md) | Minimizacao, redacao de logs, retencao; isolamento por role/usuario. |
| Headers e CORS | [security/headers.md](security/headers.md) | Politica canonica de headers, cookies, allowlist de origens e excecoes por ambiente. |
| Findings externos e reteste | [security/external-scanner-findings.md](security/external-scanner-findings.md) | Classificacao de achados de scanner, TLS, WAF, Nikto, evidencias e aceite de risco. |
| Protecao de borda | [security/edge-protection.md](security/edge-protection.md) | Politica de WAF, firewall, bot protection e controles compensatorios. |
| Pentest manual | [security/manual-pentest.md](security/manual-pentest.md) | Checklist de IDOR, RBAC, rate limit e erros. |
| Observabilidade de seguranca | [security/observability.md](security/observability.md) | Sinais minimos, alertas iniciais e politica de evidencia sem PII/secrets. |
| Dependencias e CVEs | [security/dependencies.md](security/dependencies.md) | Gate de merge, prazo para moderates e processo de excecao. |
| Matriz de autorizacao | [security/authorization-matrix.md](security/authorization-matrix.md) | RBAC Lignum por grupo e rota (cycle 0629). |
| Auditoria consultas externas | [audit/readme.md](audit/readme.md) | SENATRAN (veículo) + CNPJ cadastral; custo; snapshot admin-only. |
| Audit log ERP (acções sensíveis) | [features/audit/readme.md](features/audit/readme.md) | Auth, utilizadores, config; admin-only. |

## Testes E2E e seguranca

Os cenarios de fumo e integracao criticos vivem em `e2e/`. Setup admin: `admin@lignum.local`. Smoke RBAC: `e2e/auth-rbac.spec.ts`. Produção Lignum: `e2e/producao-lignum.spec.ts` (0720).

## Idioma

Toda a interface voltada ao utilizador final deste produto: **portugues brasileiro (PT-BR)**.
