# Feature: User Notifications

Notificações in-app por usuário.

## Modelo

`UserNotification` — `title`, `body`, `read`, `link?`, `remindAt?`, `ownerUserId`.

## Endpoints (`withRole(staffRoles)`, com scoping)

- `GET /api/user-notifications?page&pageSize&unread` — `authenticated` vê apenas
  `ownerUserId = session.user.id`; `admin` vê todas.
- `POST /api/user-notifications` — `authenticated` pode criar para si (`ownerUserId` omitido ou ignorado); **admin** deve enviar **`ownerUserId`** do destinatário. Campos `title`/`body` sem HTML; `link` validado (URL absoluta; bloqueio de `javascript:`, `data:`, `file:`, etc.).
- `GET /api/user-notifications/[id]` — admin ou dono; caso contrário `404 NOT_FOUND`.
- `PUT /api/user-notifications/[id]` — mesma regra; usado para marcar `read=true`.
- `DELETE /api/user-notifications/[id]` — idem.

## UI

- `/notificacoes` — lista com ação "Marcar como lida"; secção de **definições** com interruptor **«Mostrar tarja de atenção no painel»** (preferência por utilizador, default ligado), persistida no servidor e reflectida no [Painel](../dashboard/readme.md) para a **faixa** do pior caso apenas.
- Em conjunto com [Financeiro](../financeiro/readme.md), a **antecedência** para vencimentos e eventos financeiros (em **dias** calendário) tem **default global 1** em [ERP Setting](../erp-setting/readme.md) (campo `financeEventNotifyDaysBefore` na implementação alvo) e **override opcional por utilizador** nessa secção (ou extensão de `PUT /api/user/inbox-preferences`); *override* substitui o default do ERP quando preenchido.
- Sidebar exibe contador de **não lidas** apenas de `UserNotification` (via `NotificacoesHub` / `NotificationLink`); o **sininho** segue o agregado do [Centro de alertas](../inbox-centro-alertas/readme.md). Eventos financeiros com antecedência entram no **ecossistema** (lista, sininho, popup, conforme o que o inbox agrega) sem duplicar a mesma ocorrência se o agendador correr outra vez.

Administradores ajustam, em [Configurações / ERP Setting](../erp-setting/readme.md), a **antecedência em minutos** para o pré-aviso de compromissos com `remindAt` (default **30** — `inboxPreEventPopupMinutes`), *distinto* do aviso "N dias antes" de vencimentos financeiros.

## Regras

- Retornar `404` (e não `403`) quando o usuário não é dono, para evitar enumeração
  de ids.
- Alterar `remindAt` ou, no domínio financeiro, a data de vencimento de um item, deve **rearmar** o aviso agendado (não deixar notificações "fantasma" de datas antigas) — ver [Financeiro](../financeiro/readme.md).
