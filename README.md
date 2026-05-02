# costo

App web responsive (PWA) para tracking de gastos multi-proyecto y multi-currency (ARS / USD), con workspaces personales y compartidos para familia o pareja.

## Features

- **Multi-currency** ARS / USD con FX snapshot inmutable por gasto (cron diario desde dolarapi.com, override manual)
- **Multi-proyecto** + vista "Generales" sin proyecto + archivado
- **Workspaces** personal (auto al signup) + compartidos con invitaciones por email (Resend) + transfer ownership + límite 10 miembros
- **Dashboard** con totales ARS+USD, distribución por categoría (donut), evolución mensual (area dual-axis), top vendors, project progress
- **Búsqueda** full-text + filtros combinables con persistencia en URL (nuqs)
- **Excel import** con preview de errores y bulk insert (5000 rows / 5 MB)
- **CSV export** RFC 4180 respetando filtros activos
- **PWA** instalable iOS / Android / desktop con shell offline (Serwist)
- **i18n** español + inglés con detección por browser y switcher
- **Auth** Supabase magic link + email/password
- **RLS** workspace-scoped desde día 1
- **Mobile-first** responsive

## Stack

Next.js 15 · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui · TanStack Query · Recharts · Supabase (Postgres + Auth + Storage + Edge Functions) · next-intl 4 · Serwist · Resend · React Email · SheetJS · Zod · React Hook Form · nuqs · pnpm

## Documentación

- [`AGENTS.md`](./AGENTS.md) — reglas operativas para agentes (Claude, Codex, etc.)
- [`.specify/memory/constitution.md`](./.specify/memory/constitution.md) — principios del proyecto
- [`specs/001-mvp-core/`](./specs/001-mvp-core/) — spec, plan, data model, contracts, tasks

## Setup local

```bash
pnpm install
cp .env.example .env.local
# completar variables de Supabase + Resend en .env.local
pnpm dev
```

Visitar http://localhost:3000 → redirige a `/es/login`.

## Setup Supabase (manual desde dashboard)

1. **Crear proyecto** en supabase.com
2. **Copiar** URL + anon key + service role key a `.env.local`
3. **Aplicar schema** — abrir SQL Editor y pegar **todo** [`supabase/setup.sql`](./supabase/setup.sql) en una sola corrida (8 migrations + seed FX).
   - Re-aplicar desde cero: correr [`supabase/teardown.sql`](./supabase/teardown.sql) primero.
4. **Auth providers** — Authentication → Providers → activar Email (default).
5. **Auth URLs** — agregar `http://localhost:3000/**` a redirect URLs.

## Resend (emails de invitación)

1. Cuenta en resend.com → API key → `RESEND_API_KEY` en `.env.local`.
2. Verificar dominio (o usar `onboarding@resend.dev` para dev).

## Edge Function (cron diario de FX)

Con Supabase CLI:

```bash
supabase login && supabase link --project-ref <ref>
supabase functions deploy daily-fx-fetch --no-verify-jwt
```

Schedule en Dashboard → Edge Functions → daily-fx-fetch → Schedules:
`0 12 * * *` (12:00 UTC, después del update de dolarapi).

Trigger manual mientras tanto:

```bash
curl -X POST 'https://<ref>.supabase.co/functions/v1/daily-fx-fetch' \
  -H "Authorization: Bearer <service_role_key>"
```

## Comandos

```bash
pnpm dev           # Next dev server (webpack — turbopack temporariamente off)
pnpm build         # Production build
pnpm start         # Production server local
pnpm typecheck     # tsc --noEmit
pnpm lint          # ESLint
pnpm test          # Vitest (FX + Excel + CSV services)
pnpm test:watch    # Vitest watch mode
pnpm tsx scripts/generate-excel-template.ts   # regenerar template Excel
```

## Estructura

```
app/                     Next.js App Router
  [locale]/
    (auth)/              Login / signup / forgot / accept-invitation
    (app)/               Dashboard, expenses, projects, categories, vendors, import, settings
  globals.css            Tailwind v4 + tokens semánticos OKLCH
  manifest.ts            PWA manifest dinámico
  icon.tsx, apple-icon.tsx   Iconos generados con next/og
  sw.ts                  Service worker (Serwist)
src/
  actions/               Server Actions (auth, workspaces, projects, expenses, …)
  components/            ui (shadcn) | domain | forms | charts | layout
  hooks/                 Client hooks (useExpenseFilters)
  i18n/                  next-intl (routing, request config, mensajes es/en)
  lib/
    db/queries/          Supabase reads (server-only)
    schemas/             Zod schemas (single source of truth)
    supabase/            client / server / admin / middleware
    email/               Resend + React Email templates
  services/              Pure logic (fx, excel, csv)
  types/                 db.ts (DB types) + domain.ts
supabase/
  migrations/            SQL versionadas (1-8)
  setup.sql              Bundle único para dashboard
  teardown.sql           Reset destructivo
  functions/             Edge Functions (Deno)
specs/                   Spec-kit artifacts
tests/                   Vitest (services)
```

## Spec-driven development (spec-kit)

El proyecto usa [GitHub spec-kit](https://github.com/github/spec-kit). Todos los artefactos de planificación viven en `specs/001-mvp-core/`.

Skills disponibles via Claude Code:

```
/speckit-specify   # baseline spec
/speckit-clarify   # de-risk de ambigüedades
/speckit-plan      # plan técnico
/speckit-tasks     # tasks accionables
/speckit-implement # ejecución
```

Constitution v1.0.0 ratificada 2026-05-01 (con PATCH por `exactOptionalPropertyTypes off`, ver nota en AGENTS.md).

## Estado

| Phase | Scope | Status |
|---|---|---|
| 1 | Setup (Next + Tailwind + shadcn + Vitest) | ✅ |
| 2 | Foundational (8 migrations + RLS + auth + i18n + app shell) | ✅ |
| 3 | US1 — cargar gasto + total acumulado | ✅ |
| 4 | US2 — multi-currency con FX snapshot | ✅ |
| 5 | US3 — categorías + vendors CRUD | ✅ |
| 6 | US4 — multi-proyecto + Generales + archivado | ✅ |
| 7 | US5 — dashboard analytics con charts | ✅ |
| 8 | US6 — búsqueda + filtros URL persistentes | ✅ |
| 9 | US7 — workspaces compartidos + invitaciones | ✅ |
| 10 | US8 — Excel import | ✅ |
| 11 | US9 — CSV export | ✅ |
| 12 | US10 — PWA + i18n switcher | ✅ |
| 13 | Polish — settings/account, loading/error, Sentry, README | ✅ |
