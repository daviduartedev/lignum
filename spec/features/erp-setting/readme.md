# Feature: ERP Setting (Singleton)


> **Consumo pela vitrine pública (cycle 0615):** os campos `site_*` (`site_active`, `site_show_prices`, `site_vehicles_visible`, cores, contatos, `site_subdomain`) são lidos por tenant pela leitura pública do storefront (`src/lib/storefront/publicRead.ts`), sem sessão. `site_subdomain` espelha `Tenant.slug` (ADR-0004) e é a base da URL pública `<slug>.<NEXT_PUBLIC_BASE_DOMAIN>`.

Configurações globais da empresa (dados da empresa, alertas, site/loja).

## Modelo

`ErpSetting` — singleton lógico com `id = 1`. Campos-chave agrupados:

- **Empresa**: `companyName`, `companyTaxId`, `companyStateReg`, `companyAddress`,
  `companyCity`, `companyState`, `companyZip`, `companyPhone`, `companyEmail`.
- **Alertas**: `alertGiroEnabled`, `alertGiroWarnDays`, `alertGiroCritDays`,
  `alertPromEnabled`, `alertPromDaysBefore`, `alertDocsEnabled`,
  `alertEmailDigestEnabled` (digest de e-mail desativado neste ciclo).
- **Eventos financeiros (vencimentos, parcelas, contas a pagar):** `financeEventNotifyDaysBefore` (inteiro **0–30**, default **1**) — número de **dias de calendário** antes de `dueDate` (ou do instante alvo) para desencadear avisos no ecossistema de notificações/sininho, alinhado a [Financeiro](../financeiro/readme.md) e [User notifications](../user-notifications/readme.md). O valor **0** significa "no próprio dia" (ou política explícita na implementação, documentada no handler). *Distinto* de `alertPromDaysBefore` (legado/avanço para promessas no inbox) até a UI unificar num único controle; quando unificado, a spec do ERP deve apontar o campo efectivo.
- **Centro de alertas / compromissos**: `inboxPreEventPopupMinutes` (inteiro **1–1440**, default **30**) — minutos antes de `remindAt` para mostrar o **pré-aviso** não permanente alinhado ao [Centro de alertas](../inbox-centro-alertas/readme.md). Os toggles de alertas acima **devem** controlar, em conjunto com a implementação, se os respectivos avisos **entram** no inbox quando os emissores existirem.
- **Site/Loja pública**: `siteActive`, `sitePublicUrl`, `siteSubdomain`,
  `siteStoreName`, `sitePhone`, `siteWhatsapp`, `siteAddress`, `siteDescription`,
  `sitePrimaryColor`, `siteSecondaryColor`, `siteVehiclesVisible`,
  `siteShowPrices`, `siteContactForm`, `siteWhatsappWidget`.

**Prévia local da vitrine:** staff autenticado abre [`/loja`](../storefront/readme.md) para ver listagem e ficha com dados reais, sem subdomínio. Comportamento de visibilidade e toggles alinha com os campos acima; detalhe de campos públicos e exclusões em [Vitrine](../storefront/readme.md).

**Criação via plataforma (cycle 0617):** o `super_admin` pode pré-preencher `siteAddress` no onboarding; `siteActive` nasce **`false`**. O dono activa a vitrine e completa dados em `/site`. Ver [Platform onboarding](../platform-onboarding/readme.md).

## Endpoints

- `GET /api/erp-setting` — `withRole(staffRoles)`; upsert implícito se `id=1` não existir.
- `PUT /api/erp-setting` — **`withRole(["admin"])`**.

## UI

- `/configuracoes` — formulário em abas; apenas admins acessam (middleware).

## Defaults

Definidos em `src/lib/erpSettingDefaults.ts` e aplicados no upsert inicial.
