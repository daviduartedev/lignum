# Findings externos e reteste

Este documento define como a aplicacao trata achados de scanners externos, incluindo TrueHacking. Ele complementa `spec/security/headers.md` e `spec/features/security/readme.md`.

## Principios

- Corrigir no repositorio tudo que for controlavel pela aplicacao.
- Separar claramente app, borda/plataforma, falso positivo e risco aceito.
- Nenhum finding externo deve ser ignorado: todo achado precisa de classificacao, evidencia e decisao.
- O objetivo de reteste e reduzir findings reais e deixar justificativas objetivas para qualquer finding remanescente.

## Classificacao canonica

| Status | Uso |
|--------|-----|
| `corrigido-no-app` | O comportamento foi ajustado no codigo deste repositorio e pode ser validado por teste ou comando. |
| `dependencia-plataforma` | A correcao depende de CDN, DNS, TLS, WAF, provedor de hospedagem ou configuracao fora da app. |
| `falso-positivo` | O achado nao e reproduzivel ou conflita com evidencia tecnica objetiva. |
| `risco-aceito` | O risco e conhecido, tem impacto documentado e foi aceito temporariamente por responsavel de produto/infra. |
| `pendente-triagem` | Ainda falta evidencia para tomar decisao. Nao e estado final aceitavel para merge. |

## TrueHacking - movixgestao.com.br

| Finding | Severidade scanner | Tratamento canonico esperado |
|---------|--------------------|------------------------------|
| `Login Missing Security Headers` | medio | Corrigir no app. `/login`, paginas publicas, redirects, erros e APIs auth devem refletir `spec/security/headers.md` sempre que a resposta for controlada pela aplicacao. |
| `TLS_misses_extension_23 on movixgestao.com.br:443` | medio | Triar com evidencia independente. Provavel dependencia de plataforma se envolver terminacao TLS, CDN ou provedor. |
| `No WAF Detected on https://movixgestao.com.br/` | medio | Tratar como defesa em profundidade. Recomendar WAF/firewall/bot protection em producao e preview; permitir aceite temporario com controles compensatorios. |
| `Nikto: Unable to connect to movixgestao.com.br:443` | baixo | Triar disponibilidade/TLS/borda. Classificar como falha real, bloqueio deliberado de scanner, timeout intermitente ou ruido sem impacto ao usuario. |

## Estado atual - cycle 0517 TrueHacking follow-up

| Finding | Status | Evidencia / decisao |
|---------|--------|---------------------|
| `Login Missing Security Headers` | `corrigido-no-app` | Headers obrigatorios verificados em `/login`, `/`, redirects e APIs auth. O codigo centraliza a politica em `src/lib/securityHeaders.ts`, aplica em `next.config.ts`, respostas JSON e middleware. |
| `TLS_misses_extension_23 on movixgestao.com.br:443` | `dependencia-plataforma` | Conexao TCP 443 e TLS validas; handshake observado com `TLSv1.3`, ALPN `h2`, cipher `TLS_AES_128_GCM_SHA256` e certificado Let's Encrypt valido. Extensoes TLS especificas sao controladas pela terminacao TLS da Vercel/plataforma, nao pela app Next.js. |
| `No WAF Detected on https://movixgestao.com.br/` | `risco-aceito` temporario | Nao ha evidencia no repositorio de WAF dedicado configurado. Vercel aparece como plataforma de borda na resposta HTTP. Recomendado habilitar WAF/firewall/bot protection em producao e preview; ate la, controles compensatorios ficam documentados abaixo. |
| `Nikto: Unable to connect to movixgestao.com.br:443` | `falso-positivo` provavel | Nesta coleta, TCP 443, HTTPS `/login`, `/`, `/api/auth/session` e `/api/auth/signin` responderam. Se o TrueHacking repetir o finding, tratar como comportamento de scanner/borda ou timeout intermitente e pedir evidencia bruta do scanner. |

O relatorio operacional deste cycle fica em `cycles/Q22026/0517-truehacking-findings-followup/retest-evidence.md`.

## Evidencias minimas de reteste

- Ambiente verificado: producao e, quando existir, preview publico.
- Rotas verificadas: `/login`, `/`, APIs de auth, redirects de rota protegida e erro 404.
- Evidencia de headers em respostas HTTP.
- Resultado ou resumo do novo scan TrueHacking.
- Matriz final com status de cada finding.
- Dono e prazo para qualquer item `dependencia-plataforma` ou `risco-aceito`.

## WAF e controles compensatorios

WAF/firewall/bot protection e recomendacao canonica para producao e preview. A politica completa fica em `spec/security/edge-protection.md`. Quando ainda nao existir camada dedicada, o aceite temporario deve citar os controles compensatorios ativos:

- rate limit por rota sensivel;
- CORS restritivo;
- validacao estrita de input;
- autenticacao e autorizacao;
- headers defensivos;
- upload bloqueado por backend;
- erros genericos em producao;
- logging com redacao de dados sensiveis.

## Criterio de fechamento

Um cycle de findings externos so fica fechado quando cada achado original esta em um dos estados finais: `corrigido-no-app`, `dependencia-plataforma`, `falso-positivo` ou `risco-aceito`.

## Proximo passo P1

O proximo cycle de postura de seguranca deve priorizar:

- encerramento formal dos findings remanescentes no TrueHacking;
- decisao operacional de WAF/firewall/bot protection;
- pentest manual de IDOR, RBAC e tenant isolation;
- observabilidade minima para sinais de abuso e resposta a incidente.

## Terceiro scan - orientacao operacional

Se o TrueHacking continuar reportando `Login Missing Security Headers` sem apontar um endpoint diferente, o status recomendado e `falso-positivo` ou `resolved/stale`. A evidencia manual de producao confirma `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options` e `Strict-Transport-Security` em `/login`, `/`, `/api/auth/signin` e `/api/auth/session`.

`No WAF Detected` deve permanecer como finding valido ate a habilitacao de WAF/bot protection ou aceite formal de risco. `TLS_misses_extension_23` permanece dependencia de plataforma enquanto a terminacao TLS for gerenciada pela Vercel/CDN. `Nikto: Unable to connect` requer evidencia bruta do scanner para ser tratado como vulnerabilidade real, pois probes HTTP normais estao respondendo.
