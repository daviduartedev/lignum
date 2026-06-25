# Feature: Centro de alertas (inbox unificado)

## Objetivo

Um único lugar de leitura para **tudo o que exige atenção** do utilizador da revenda: notificações in-app, veículos em destaque por tempo parado (mesma regra que o [Painel](../dashboard/readme.md)), compromissos com `remindAt`, e demais alertas gerados conforme [ERP Setting](../erp-setting/readme.md). A experiência inclui **popup pós-login** (sempre que o gate de sessão estiver activo — ver [Auth](../auth/readme.md)), **drawer do sininho** no cabeçalho (não bloqueante; ver [UX — modais](../../ux/modais.md)), e **pré-aviso configurável** antes da hora do compromisso.

## Fontes de itens (inventário)

Cada fonte deve aparecer na resposta agregada do inbox **ou** estar explicitamente listada como «não emitida nesta versão» com ticket de continuidade na manutenção do repositório.

| Origem | Descrição | Persistência |
|--------|-------------|--------------|
| Notificações in-app | `UserNotification` com `read=false` | Linha em `user_notifications` |
| Estoque — atenção operacional (lista no inbox) | Mesmo conjunto e ordenação que `pontosAtencaoListaCompleta` / topo de `pontosAtencao[]` em `GET /api/dashboard/summary` | Calculado; reconhecimento/snooze em tabela de preferências (ver abaixo) |
| Compromisso | Notificações com `remindAt` futuro ou na janela de pré-aviso | `remind_at` |
| Giro / promessas financeiras / documentos | Regras e limites em `ErpSetting` | Giro: dias parado em [Giro / Marketing](../giro-marketing/readme.md). Promessas e vencimentos: [Financeiro](../financeiro/readme.md) e antecedência `financeEventNotifyDaysBefore` / `alertPromDaysBefore` conforme emissor; itens virtuais ou `UserNotification` idempotentes. |

## API agregada (recomendada)

- **`GET /api/inbox/summary`** (nome pode ser ajustado na implementação, desde que a documentação aqui e em `tasks.md` do ciclo fiquem coerentes): resposta única com:
  - contagens por **secção** (`notificationsUnread`, `stockAttentionOpen`, `upcomingCommitments`, …);
  - **`totalActionable`**: soma usada no **badge do sininho** (definição estável documentada na resposta);
  - **pré-visualizações** (primeiros N itens por secção, N configurável no servidor / admin);
  - **`preEventPopupMinutes`**: inteiro efectivo (espelha `ErpSetting` validado, default **30**);
  - **`showDashboardAttentionStripe`**: preferência do utilizador autenticado (default **true**).
- **Performance:** um pedido por abertura de popup/drawer na mesma vista; reutilizar cache de cliente (ex.: React Query) partilhado entre `PostLoginNotificacoesGate`, sininho e, quando possível, dados já obtidos para o painel **sem** segundo fetch redundante na mesma montagem.

## UI — princípios

- **Secções fixas** com títulos em PT-BR; estado vazio **ilustrado** (sem tom de erro) quando uma secção não tem itens.
- **Popup pós-login:** mantém semântica de **`alertdialog`** e telemetria existente, estendida se necessário.
- **Drawer do sininho:** abre à **direita**; foco, ESC e clique fora conforme [UX](../../ux/modais.md).
- **Sidebar:** o contador de não lidas em «Notificações» continua a referir-se **apenas** a `UserNotification` não lidas; o sininho usa `totalActionable`.

## Preferências

- **«Mostrar tarja de atenção no painel»:** persistida por utilizador; quando desligada, a **faixa** do pior caso no [Painel](../dashboard/readme.md) não é renderizada; KPIs e card de **atenção operacional** **mantêm-se**.

## Dispensar e snooze (estoque)

- **Dispensar:** o item deixa de contar para `totalActionable` para esse utilizador até as regras do produto o reapresentarem (ex.: alteração de dias parado ou expiração de TTL documentada na implementação).
- **Adiar (snooze):** o item oculta-se até instante `until` guardado por utilizador + veículo (ou chave equivalente).

## Pré-popup de compromisso

- Não bloqueante após o utilizador já ter contexto da página (não empilhar dois `alertdialog`); usar padrão documentado em [UX — modais](../../ux/modais.md) (ex.: toast rico ou diálogo não modal).
- Disparo quando `remindAt - now ≤ preEventPopupMinutes` e o item ainda não foi «acusado» na sessão ou persistência mínima definida na implementação.

## Telemetria

- Reutilizar / estender `src/lib/postLoginNotificacoesTelemetry.ts` ou módulo dedicado com eventos estáveis: exibição/fecho do drawer, pré-popup de compromisso, dispensar/snooze em stock.

## Fora de âmbito

- Digest de e-mail (`alertEmailDigestEnabled`) permanece desligado ao nível de produto actual salvo ciclo dedicado.
- Personalização visual por utilizador (temas) para o inbox.
