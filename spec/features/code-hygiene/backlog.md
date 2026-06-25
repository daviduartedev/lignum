# Backlog - Code hygiene

Registre aqui refactors maiores ou limpezas desejaveis que:

- nao sejam pre-requisito para fechar finding critico/alto;
- nao caibam num merge reversivel e de baixo risco;
- exijam alteracao estrutural acima do escopo do cycle atual.

Cada entrada deve trazer:

1. contexto e risco atual;
2. ganho esperado;
3. area afetada;
4. motivo para nao executar no cycle corrente.

## Entradas abertas

1. **Tenant isolation pleno**

Contexto e risco atual: o schema Prisma atual nao possui entidade tenant nem coluna `tenant_id`, entao o hardening so consegue aplicar scoping onde ja existe dono do recurso, como notificacoes por usuario.

Ganho esperado: isolamento verificavel entre revendas/tenants em todas as rotas com dados operacionais.

Area afetada: modelo de dados, migrations, seed, auth/session claims, todas as rotas de dominio e testes Playwright.

Motivo para nao executar no cycle corrente: exigiria mudanca estrutural e regra de dados alem de hardening defensivo de baixo impacto.
