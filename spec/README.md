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
| Painel (dashboard da revenda) | [features/dashboard](features/dashboard/readme.md) | KPIs compactos; quadro de veiculos parados; ranking de marcas; resumo de vendas por mes. |
| Centro de alertas (inbox unificado) | [features/inbox-centro-alertas](features/inbox-centro-alertas/readme.md) | Popup pos-login, drawer do sininho, agregacao `inbox/summary`, snooze e dispensar. |
| Calendario (operacional) | [features/calendario](features/calendario/readme.md) | Rota unica `/calendario`: recebiveis, contas a pagar, OS, garantias e lembretes. |
| Financeiro (A pagar / A receber) | [features/financeiro](features/financeiro/readme.md) | Hub `/financeiro` com recebiveis, despesas e notificacoes. |
| Giro / Marketing | [features/giro-marketing](features/giro-marketing/readme.md) | **Removido da nav (0623)**; rota `/giro` deletada. Spec histórica. |
| Estoque (lista, tabs e deep links) | [features/estoque](features/estoque/readme.md) | Tabs por status; filtro `diasMin`; atalhos de detalhe e venda. |
| Clientes e fornecedores | [features/clients](features/clients/readme.md) | Hub `/clientes`; cadastro e navegacao coerente com fornecedores. |
| Ciberseguranca (transversal) | [features/security](features/security/readme.md) | RBAC Lignum, rate limits, revogacao de sessao, audit log. |
| Auth (login, papéis, utilizadores) | [features/auth](features/auth/readme.md) | NextAuth, 5 papéis, gestão admin, `/configuracoes/usuarios`. |
| Audit log (acções sensíveis) | [features/audit](features/audit/readme.md) | Registo persistido; consulta admin; distinto de SENATRAN. |
| Code hygiene | [features/code-hygiene](features/code-hygiene/readme.md) | Limpeza interna de baixo risco: remover gambiarras, codigo morto, duplicacao obvia e follow-ups de refactor. |
| Cores de veiculo (revenda) | [features/vehicle-colors](features/vehicle-colors/readme.md) | Sugestoes curadas + "Outro"; persistencia em texto. |
| Avaliacao de compra e standby | [features/purchase-evaluation-standby](features/purchase-evaluation-standby/readme.md) | Fluxo separado da avaliacao tecnica; lista dedicada; motivo estruturado. |
| Venda e promissoria | [features/sale-promissory](features/sale-promissory/readme.md) | Pagamento promissorio; modal na venda; parcelas em `promissory_notes`. |
| FIPE automatico e lucro x FIPE | [features/fipe-and-margin](features/fipe-and-margin/readme.md) | **Removido (0623)**; rota `/fipe` deletada. Spec histórica. |
| Estoque removido e restauracao | [features/stock-removed](features/stock-removed/readme.md) | Soft delete; removidos; restauracao so admin. |
| Veiculos (cadastro, API, SENATRAN) | [features/vehicles](features/vehicles/readme.md) | CRUD; consulta oficial por placa; extensao de modelo e validacoes. |
| Vitrine (loja publica / previa) | [features/storefront](features/storefront/readme.md) | **Removida (0623)** — single-tenant; spec historica. |
| Onboarding de lojas (plataforma) | [features/platform-onboarding](features/platform-onboarding/readme.md) | **Removida (0623)** — `super_admin` e plataforma deletados. |
| Seed de dev e validacao | [features/dev-seed-and-validation](features/dev-seed-and-validation/readme.md) | 5 utilizadores canonicos (`*@lignum.local`); seed minimo idempotente; bulk opcional manual. |

## Materiais client-facing

| Documento | Caminho | Resumo |
|-----------|---------|--------|
| Hub client-facing | [client-facing/readme.md](client-facing/readme.md) | Textos para impressao/PDF e alinhamento comercial. |
| SENATRAN, explicacao para o cliente | [client-facing/senatran-integracao-movix.md](client-facing/senatran-integracao-movix.md) | Mock vs producao; SERPRO; precos por portaria; LGPD; limites. |

## Dominio e UX transversal

| Documento | Caminho | Resumo |
|-----------|---------|--------|
| Vendas, margem e mes civil | [domain/vendas.md](domain/vendas.md) | Definicao de margem bruta sobre receita; fuso America/Sao_Paulo. |
| Modais e dialogos bloqueantes | [ux/modais.md](ux/modais.md) | `alertdialog`, foco, backdrop e comportamento mobile. |
| LGPD e minimizacao | [security/lgpd.md](security/lgpd.md) | Minimizacao, redacao de logs, retencao; isolamento por role/usuario. |
| Headers e CORS | [security/headers.md](security/headers.md) | Politica canonica de headers, cookies, allowlist de origens e excecoes por ambiente. |
| Findings externos e reteste | [security/external-scanner-findings.md](security/external-scanner-findings.md) | Classificacao de achados de scanner, TLS, WAF, Nikto, evidencias e aceite de risco. |
| Protecao de borda | [security/edge-protection.md](security/edge-protection.md) | Politica de WAF, firewall, bot protection e controles compensatorios. |
| Pentest manual | [security/manual-pentest.md](security/manual-pentest.md) | Checklist de IDOR, RBAC, rate limit e erros. |
| Observabilidade de seguranca | [security/observability.md](security/observability.md) | Sinais minimos, alertas iniciais e politica de evidencia sem PII/secrets. |
| Dependencias e CVEs | [security/dependencies.md](security/dependencies.md) | Gate de merge, prazo para moderates e processo de excecao. |
| Matriz de autorizacao | [security/authorization-matrix.md](security/authorization-matrix.md) | RBAC Lignum por grupo e rota (cycle 0629). |
| Auditoria SENATRAN (veículo) | [audit/readme.md](audit/readme.md) | Consultas externas; custo; snapshot. |
| Audit log ERP (acções sensíveis) | [features/audit/readme.md](features/audit/readme.md) | Auth, utilizadores, config; admin-only. |

## Testes E2E e seguranca

Os cenarios de fumo e integracao criticos vivem em `e2e/` e sao executados com **Chromium**. Setup admin: `admin@lignum.local` (seed). Smoke RBAC por papel: `e2e/auth-rbac.spec.ts` (cycle 0629). Specs legacy de storefront/plataforma removidos no cycle 0623.

## Idioma

Toda a interface voltada ao utilizador final deste produto: **portugues brasileiro (PT-BR)**.
