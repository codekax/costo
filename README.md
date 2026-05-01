# costo

App web responsive (PWA) para tracking de gastos multi-proyecto y multi-currency (ARS / USD), con workspaces personales y compartidos.

## Stack

Next.js 15 · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui · TanStack Query · Supabase (Postgres + Auth + Storage + Edge Functions) · next-intl · pnpm

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
2. **Copiar** URL del proyecto y anon key a `.env.local` como `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Copiar** service role key a `SUPABASE_SERVICE_ROLE_KEY`
4. **Aplicar migrations** — abrir SQL Editor en el dashboard y pegar en orden los archivos de `supabase/migrations/`:
   - `0001_init_workspaces_members_invitations.sql`
   - `0002_init_projects_categories_vendors.sql`
   - `0003_init_expenses.sql`
   - `0004_init_recurring_expenses.sql`
   - `0005_init_daily_fx_rates.sql`
   - `0006_seed_categories_function.sql`
   - `0007_immutability_triggers.sql`
   - `0008_storage_attachments.sql`
5. **Seed inicial de FX** — opcional para arrancar antes de que corra el cron:
   ```sql
   insert into daily_fx_rates (date, ars_per_usd_official, source)
   values (current_date, 1050, 'manual-seed');
   ```
6. **Auth providers** — Authentication → Providers → activar Email (default) y opcionalmente Magic Link
7. **Auth URLs** — agregar `http://localhost:3000/**` y `http://localhost:3000/auth/callback` a redirect URLs

## Edge Function (cron diario de FX)

Una vez instalada la Supabase CLI:

```bash
supabase login
supabase link --project-ref <ref>
supabase functions deploy daily-fx-fetch --no-verify-jwt
```

Luego crear un schedule en Dashboard → Edge Functions → daily-fx-fetch → Schedules:
- Cron expression: `0 12 * * *` (12:00 UTC, después de que dolarapi.com actualice)

Mientras tanto se puede invocar manualmente con:

```bash
curl -X POST 'https://<ref>.supabase.co/functions/v1/daily-fx-fetch' \
  -H "Authorization: Bearer <service_role_key>"
```

## Comandos

```bash
pnpm dev           # Next dev server
pnpm build         # Production build
pnpm typecheck     # tsc --noEmit
pnpm lint          # ESLint
pnpm test          # Vitest unit tests
```

## Spec-driven development (spec-kit)

El proyecto usa [GitHub spec-kit](https://github.com/github/spec-kit) — todos los artefactos de planificación están en `specs/`.

```bash
# Skills disponibles via Claude Code:
/speckit-specify   # baseline spec
/speckit-clarify   # de-risk de ambigüedades
/speckit-plan      # plan técnico
/speckit-tasks     # tasks accionables
/speckit-implement # ejecución
```

Constitution v1.0.0 ratificada 2026-05-01 (con un PATCH por `exactOptionalPropertyTypes off`, ver nota en AGENTS.md).
