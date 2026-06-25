# Headers e CORS

Este documento descreve a politica canonica de headers de seguranca, cookies e CORS.

## Ambientes

- **Producao e preview**: aplicar politica completa.
- **Desenvolvimento local**: excecoes tecnicas sao permitidas apenas quando impossivel reproduzir o comportamento sem quebrar o fluxo local, e sempre protegidas por `NODE_ENV !== "production"`.

## Headers obrigatorios

- `Content-Security-Policy`: politica pragmatica compativel com a stack atual; endurecimento progressivo sem quebrar a app.
- `Strict-Transport-Security`: onde HTTPS e aplicavel.
- `X-Frame-Options: DENY` ou `frame-ancestors 'none'`.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy`: politica restritiva adequada ao produto.
- `Permissions-Policy`: desabilitar camera, microfone, geolocalizacao e demais capacidades nao usadas.
- Remocao de `X-Powered-By` e reducao da exposicao de fingerprinting do servidor onde configuravel.

## Superficie de aplicacao

Os headers obrigatorios devem aparecer em toda resposta controlada pela aplicacao em producao e preview, incluindo:

- paginas HTML publicas, especialmente `/login`;
- paginas autenticadas;
- APIs em `src/app/api/**`;
- redirects emitidos pelo middleware;
- respostas de erro previsiveis, como `401`, `403`, `404`, `429` e `500`.

Excecoes so sao aceitas quando a resposta nao e controlada pela app, como terminacao TLS, CDN, proxy, assets estaticos servidos diretamente pela plataforma ou erro gerado antes do request chegar ao Next.js. Toda excecao precisa registrar motivo, impacto e dono operacional.

O header `Server` pode continuar aparecendo quando emitido pela plataforma de hospedagem. O app deve manter `poweredByHeader: false` para nao emitir `X-Powered-By` do Next.js.

## CORS

- Same-origin por padrao.
- Cross-origin apenas por allowlist explicita em `ALLOWED_ORIGINS`.
- Sem wildcard `*`.
- Sem reflexao dinamica do header `Origin`.
- Preflight responde apenas para metodos e headers necessarios.
- Quando `Origin` estiver ausente, chamadas server-to-server e navegacao normal seguem sem headers CORS.

## Cookies

- Cookies de sessao privilegiam `HttpOnly`, `SameSite=Lax` e `Secure` em ambientes HTTPS.
- Em HTTP local, excecoes ficam limitadas ao dev e nao podem vazar para preview/producao.

## Verificacao

- Validar headers em preview e producao por smoke automatizado e checagem manual quando necessario.
- Qualquer excecao por compatibilidade deve ser documentada com motivo e plano de endurecimento.
- Retestes externos, como TrueHacking, devem validar `/login`, `/`, APIs de auth, redirects e erro 404.
