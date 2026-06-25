# Lignum Gestão

ERP para fábricas de carrocerias de madeira — do orçamento à entrega: orçamento com cálculo
automático e configurador 3D, produção/OS, estoque de matérias-primas e de carrocerias usadas,
financeiro com lucro por orçamento, emissão de NF-e/NFS-e e relatórios.

Construído como **template a partir de um ERP de revenda** (legado), reaproveitando
infraestrutura (auth, settings, financeiro, notificações, PDF, relatórios) e adaptando o domínio.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Prisma 6 + PostgreSQL · NextAuth v5
(credentials + bcrypt) · Tailwind 4 + Radix/shadcn · TanStack Query · Zod · Upstash (rate limit)
· Vercel Blob (uploads) · `@react-pdf/renderer` (PDF) · Vitest + Playwright. Single-tenant.

## Identidade

Azul Royal `#0234C9` · Azul Claro `#046CEB` · Preto `#000000` · Branco `#FFFFFF`.
Tematização 100% por tokens em `src/styles/theme.css` — trocar as variáveis re-tematiza o app.

## Como rodar

```bash
npm install
cp .env.example .env   # Windows: copy .env.example .env
# Edite .env: DATABASE_URL (Neon/Postgres) e AUTH_SECRET (openssl rand -base64 32)
npx prisma migrate dev
npm run db:seed
npm run dev
```

**Login dev:** `admin@lignum.local` / `Teste@123456`

## Documentação

- Especificação canônica: pasta `spec/` (arquitetura, API, segurança, features).
- Configuração local: copie `.env.example` para `.env` (nunca commitar `.env`).
