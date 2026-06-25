# Protecao de borda

Este documento define a politica canonica para WAF, firewall, bot protection e controles de borda em producao e preview.

## Objetivo

A protecao de borda complementa o hardening da aplicacao. Ela deve reduzir abuso automatizado, payloads comuns e trafego suspeito antes que a requisicao chegue ao Next.js.

## Recomendacao canonica

Producao e preview devem ter WAF/firewall/bot protection dedicado quando a plataforma permitir. A ausencia dessa camada pode ser aceita temporariamente apenas com dono, justificativa, controles compensatorios e data de revisao.

## Plataforma atual

O dominio de producao observado responde pela borda da Vercel. A Vercel disponibiliza WAF em todos os planos, com Custom Rules e rate limiting. Bot Protection Managed Ruleset tambem esta disponivel em todos os planos. OWASP Core Ruleset depende de plano Enterprise.

Configuracoes de dashboard devem comecar em modo `Log`, passar por janela de observacao e so entao evoluir para `Challenge`, `Rate Limit` ou `Deny`.

## Superficies prioritarias

- `/login`
- `/api/auth/*`
- mutacoes em `/api/*`
- listagens amplas, como `?all=1`
- rotas com identificadores de recurso
- upload, mesmo quando desativado

## Regras minimas esperadas

- Bloqueio ou desafio para credential stuffing e brute force.
- Rate limiting de borda para endpoints de auth e mutacoes.
- Deteccao de payloads comuns de SQLi, XSS, path traversal e command injection.
- Bloqueio de user agents claramente maliciosos quando aplicavel.
- Protecao contra bursts anormais por IP, ASN ou pais quando houver abuso confirmado.

## Controles compensatorios atuais

Enquanto WAF dedicado nao estiver habilitado, os controles compensatorios canonicos sao:

- rate limit na aplicacao;
- CORS restritivo;
- validacao de input com allowlist;
- autenticacao e autorizacao por rota;
- tenant isolation;
- headers defensivos;
- upload bloqueado por backend;
- erros genericos em producao;
- logs com redacao de PII/secrets.

## Evidencia e aceite

Todo aceite temporario de ausencia de WAF deve registrar:

- responsavel;
- motivo;
- riscos cobertos e nao cobertos;
- controles compensatorios;
- data de revisao;
- criterio para habilitar WAF.

O runbook operacional deste estado fica em `cycles/Q22026/0517-security-posture-next-steps/waf-operational-runbook.md`.
