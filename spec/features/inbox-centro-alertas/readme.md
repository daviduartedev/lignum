# Feature: Centro de alertas (inbox unificado)

Cycle `0720` actualizou fontes Lignum; teardown Movix removeu alertas de veículos.

## Objetivo

Um único lugar de leitura para **tudo o que exige atenção**: notificações in-app, materiais abaixo do mínimo, compromissos com `remindAt`, e alertas virtuais conforme [ERP Setting](../erp-setting/readme.md). Inclui popup pós-login, drawer do sininho e pré-aviso de compromissos.

## Fontes de itens (inventário vigente)

| Origem | Descrição | Persistência | Papéis |
|--------|-------------|--------------|--------|
| Notificações in-app | `UserNotification` com `read=false` | `user_notifications` | staff |
| **Materiais abaixo do mínimo** | Materiais com `currentStock < minStock` | Calculado + `UserNotification` idempotente | `admin`, `producao` |
| Compromisso | `remindAt` na janela de pré-aviso | `remind_at` | staff |
| Documentos pendentes | Clientes sem anexo obrigatório | Virtual `documentos` | conforme settings |

### Removido (0720)

- Estoque veículos / dias parado / `UserStockAttentionPreference`
- Giro / promissórias Movix no resumo inbox
- `GET /api/inbox/stock-attention`

## API agregada

**`GET /api/inbox/summary`** retorna:

- `materialLowStock: { openCount, items[] }` — preview até 8; `openCount` = total abaixo do mínimo
- `notificationsUnread`, `upcomingCommitments`, `totalActionable`
- `preEventPopupMinutes`, `showDashboardAttentionStripe`

## UI

- Popup pós-login: `PostLoginNotificacoesGate`
- Drawer sininho: `Topbar` + `InboxAlertsContent`
- Secções fixas PT-BR; estado vazio ilustrado

## Referências

- Materiais: [materials-stock](../materials-stock/readme.md)
- Painel: [dashboard](../dashboard/readme.md)
