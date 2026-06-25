> **REMOVIDA no cycle `0623-fundacao-rebrand-core`.** Single-tenant Lignum não expõe vitrine pública nem subdomínio por loja. Este documento permanece como referência histórica do template Movix.

# Feature: Vitrine (loja pública / prévia) — DEPRECATED

Experiência de **e-commerce leve** servida por **subdomínio por tenant** (ex.: `alemaoveiculos.movix.com.br`). Os dados vêm do **tenant resolvido pelo host** (config `ErpSetting` por tenant + veículos do tenant). Implementado no cycle `0615` (SSR público); a prévia autenticada em `/loja` coexiste para o tenant da sessão.

**Onboarding pela plataforma (cycle 0617):** loja criada pelo `super_admin` recebe slug/URL reservados (`<slug>.<NEXT_PUBLIC_BASE_DOMAIN>`), mas a vitrine pública só responde quando **`siteActive=true`** e **`Tenant.active=true`**. Até o dono activar em `/site`, visitantes veem estado inactivo. Ver [Platform onboarding](../platform-onboarding/readme.md).

## Estados do produto

| Estado | Rota / acesso | Objectivo |
|--------|----------------|------------|
| **Público (cycle 0615)** | `<slug>.dominio` → SSR de `(storefront)/loja` | Cliente final **sem sessão**: o middleware resolve o tenant pelo host (`x-movix-tenant`) e a rota lê os dados públicos no servidor (`src/lib/storefront/publicRead.ts`). |
| **Prévia autenticada** | `/loja`, `/loja/[id]` no host do app | Staff vê a vitrine do tenant da sessão; mesmo componente, caminho de dados interno. |

## Regras de visibilidade de veículos

Ler `siteVehiclesVisible` em [`../erp-setting/readme.md`](../erp-setting/readme.md):

- **`disponiveis`** — apenas `VehicleStatus.disponivel`.
- **`todos`** — `disponivel`, `repasse`, `reservado` (excluir `vendido`, `removido`, `standby_nao_compra` da vitrine).
- **`selecionados`** — previsto no painel; **enquanto não existir campo por veículo** no modelo, o produto pode comportar-se como `disponiveis` e indicar limitação na UI de configuração ou na prévia. Ciclo dedicado deve introduzir persistência (ex.: booleano “na vitrine”).

## Dados e API (vitrine pública — cycle 0615)

- **Resolução de tenant:** o middleware (`src/middleware.ts`) extrai o slug do host (`src/lib/tenant/host.ts`), reescreve para `(storefront)/loja` e injeta `x-movix-tenant`. Edge-safe (sem Prisma no middleware).
- **Leitura no servidor:** `getPublicStorefront(slug)` (`src/lib/storefront/publicRead.ts`) resolve `Tenant` por `slug` (client base) e usa **`forTenant(tenantId)`** para ler `ErpSetting` + veículos — **sem sessão**, escopado por tenant. Devolve estado `ok` / `not_found` (slug sem tenant) / `inactive` (`Tenant.active=false` ou `site_active=false`).
- **Render:** páginas SSR (`force-dynamic`) passam `config` + `vehicles` por props aos componentes (sem React Query/`/api` autenticado).
- **Sanitização:** `publicRead` aplica a visibilidade e **remove** campos privados; `selling_price` só é emitido quando `siteShowPrices` (no servidor, não apenas na UI).

### Campos permitidos na vitrine (orientação)

**Permitidos (típico):** `listingTitle` (fallback `model` + `brand`), `mainPhotoUrl`, primeiros itens de `galleryUrls`, `yearManufacture`, `yearModel`, `mileage`, `color`, `fuel`, `transmission`, `version`, `sellingPrice` **se** `siteShowPrices`; `categoryKind` para ícones/filtros futuros.

**Proibidos na vitrine:** `purchasePrice`, `fipePrice`, `estimatedMaintenanceCost`, `observations`, `attachmentUrls`, `renavam`, `chassis`, `buyerId`, `officialExtraFields` (JSON bruto), `senatranFieldProvenance`, qualquer dado pessoal de titular.

## Branding e conteúdo

- Cores: `sitePrimaryColor`, `siteSecondaryColor` (CSS variables no layout da vitrine).
- Copy: `siteStoreName`, `siteDescription`, `siteAddress`, `sitePhone`, `siteWhatsapp`.
- Toggles: `siteContactForm`, `siteWhatsappWidget` — ver [ERP Setting](../erp-setting/readme.md).

## Preços

- Se `siteShowPrices` for falso, **não** renderizar `sellingPrice` (cartão nem ficha).

## Imagens

- `mainPhotoUrl` e primeiros itens de `galleryUrls` quando presentes.
- Sem foto própria: mesmo fallback que o staff — componente `VehicleThumbnail` (`mainPhotoUrl` → Unsplash por título marca/modelo/versão → ícone neutro). **Não** usar Unsplash aleatório por `vehicle.id` (evita modelo incorrecto).
- Upload de média: ver [Vehicles](../vehicles/readme.md) (Vercel Blob quando env activo).

## Contacto e leads (v1)

- **Sem** persistência de formulário neste âmbito.
- Com `siteContactForm`, o formulário deve concluir em acção do utilizador (`mailto:`, `wa.me` com texto pré-preenchido, ou `tel:`), alinhado às políticas de spam/LGPD mínimas do ciclo.

## Autenticação e segurança

- **Host de loja (público):** servido sem sessão — o middleware reescreve para a vitrine antes do ramo de auth; **não** redireciona para `/login`. `x-movix-tenant` é definido só pelo middleware (anti-spoofing).
- **Host do app:** comportamento inalterado — não autenticado vai para `/login`.
- A leitura pública não usa o gate de `/api`; é escopada por `forTenant`. Ver [security](../security/readme.md).

## Blog

- **v1:** secção editorial única (“Sobre a loja”) com `siteDescription`.
- **Futuro:** artigos, categorias, SEO — ciclo separado.

## Rotas reservadas

- `/loja`, `/loja/[id]` — vitrine / prévia.
- `/site` permanece **configuração** (backoffice), não a vitrine.

## Implementação (código)

- Segmento de rotas `src/app/(storefront)/` sem `AppShell`; componentes (por props) em `src/components/storefront/`.
- Roteamento por host: `src/middleware.ts` + `src/lib/tenant/host.ts` (`x-movix-tenant`).
- Leitura pública por tenant: `src/lib/storefront/publicRead.ts`; helper de request: `src/lib/storefront/currentRequestTenant.ts`.
- URL pública efetiva: `src/lib/storefront/publicUrl.ts` (exibida em `/site`).
- Regras de filtro: `src/lib/storefront/visibility.ts`. Fallback de imagem: `src/lib/storefront/images.ts`. Domínio base: `NEXT_PUBLIC_BASE_DOMAIN`.
- Imagens de anúncio: `VehicleThumbnail` + `DetalheVeiculoGallery`; helpers em `src/lib/vehicleImages.ts` e `src/lib/unsplashVehicleImage.ts`.
