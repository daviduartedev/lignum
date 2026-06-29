# Feature: ERP Setting (Singleton)

Configurações globais da **empresa emitente** (fábrica AlaCruz/Lignum): dados cadastrais, alertas operacionais e parâmetros de notificação. Single-tenant — **`id = 1`**.

> Campos históricos de vitrine/multitenant (`site_*`, subdomínio, plataforma) foram removidos no cycle **0623** (ADR-0006). Specs de [storefront](../storefront/readme.md) e [platform-onboarding](../platform-onboarding/readme.md) permanecem como referência histórica.

## Modelo

`ErpSetting` — singleton lógico com `id = 1`. Campos-chave agrupados:

- **Empresa (emitente)**: `companyName`, `companyTaxId`, `companyStateReg`, `companyAddress`,
  `companyCity`, `companyState`, `companyZip`, `companyPhone`, `companyEmail`.
- **Alertas**: `alertGiroEnabled`, `alertGiroWarnDays`, `alertGiroCritDays`,
  `alertPromEnabled`, `alertPromDaysBefore`, `alertDocsEnabled`,
  `alertEmailDigestEnabled` (digest de e-mail desativado neste ciclo).
- **Eventos financeiros (vencimentos, parcelas, contas a pagar):** `financeEventNotifyDaysBefore` (inteiro **0–30**, default **1**) — número de **dias de calendário** antes de `dueDate` (ou do instante alvo) para desencadear avisos no ecossistema de notificações/sininho, alinhado a [Financeiro](../financeiro/readme.md) e [User notifications](../user-notifications/readme.md). O valor **0** significa "no próprio dia" (ou política explícita na implementação, documentada no handler). *Distinto* de `alertPromDaysBefore` (legado/avanço para promessas no inbox) até a UI unificar num único controle; quando unificado, a spec do ERP deve apontar o campo efectivo.
- **Centro de alertas / compromissos**: `inboxPreEventPopupMinutes` (inteiro **1–1440**, default **30**) — minutos antes de `remindAt` para mostrar o **pré-aviso** não permanente alinhado ao [Centro de alertas](../inbox-centro-alertas/readme.md). Os toggles de alertas acima **devem** controlar, em conjunto com a implementação, se os respectivos avisos **entram** no inbox quando os emissores existirem.

**Consumo futuro:** dados da empresa em PDF de orçamentos/contratos e emissão fiscal (cycles 0713+).

## Endpoints

- `GET /api/erp-setting` — `withRole(staffRoles)`; upsert implícito se `id=1` não existir.
- `PUT /api/erp-setting` — **`withRole(["admin"])`**.

## UI

- `/configuracoes` — formulário em abas (`ConfiguracoesHub`); apenas admins acessam (middleware).

## Defaults

Definidos em `src/lib/erpSettingDefaults.ts` e aplicados no upsert inicial.
