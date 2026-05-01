# Quickstart — costo MVP

**Phase**: 1
**Date**: 2026-05-01

Setup local desde cero hasta primer gasto cargado.

---

## Prerequisitos

- **Node.js** 20+ (`nvm use 20`)
- **pnpm** 9+ (`npm i -g pnpm`)
- **Docker Desktop** corriendo (para Supabase local)
- **Supabase CLI** (`brew install supabase/tap/supabase`)
- Cuentas: Supabase (free tier), Vercel (free tier), Resend (free tier), dolarapi (sin cuenta — público)

---

## 1. Clonar e instalar

```bash
cd ~/Documents/Developer/costo
pnpm install
```

## 2. Variables de entorno

```bash
cp .env.example .env.local
```

Completar `.env.local`:

```bash
# Server-only
SUPABASE_SERVICE_ROLE_KEY=<from supabase dashboard>
DOLARAPI_BASE_URL=https://dolarapi.com/v1
RESEND_API_KEY=<resend dashboard>
APP_URL=http://localhost:3000

# Client (NEXT_PUBLIC_)
NEXT_PUBLIC_SUPABASE_URL=<from supabase dashboard>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase dashboard>
```

Para dev local con Supabase CLI (recomendado):

```bash
supabase start
# Imprimirá URLs y keys del Supabase local. Usá esas en .env.local.
```

## 3. Aplicar migrations

```bash
# Local
supabase db reset   # corre migrations + seed.sql

# Producción
supabase link --project-ref <ref>
supabase db push
```

## 4. Generar types de DB

```bash
pnpm db:types
# Equivale a: supabase gen types typescript --local > src/types/db.ts
```

## 5. Subir template Excel

```bash
# Solo primera vez. Coloca el .xlsx en public/templates/expense-import-template.xlsx
# Las 9 columnas:
# fecha | proyecto | categoria | vendor | descripcion | moneda | monto | fx_rate | nota
```

## 6. Run dev

```bash
pnpm dev
# → http://localhost:3000
```

## 7. Smoke test inicial

1. Abrir `http://localhost:3000` → te redirige a `/login`.
2. Click "Crear cuenta" → email + password.
3. Tras signup, debería verse el dashboard del workspace personal "Mi espacio" vacío.
4. Sidebar muestra el workspace + 8 categorías sembradas.
5. Click "Nuevo gasto" → cargar 1000 ARS, categoría Materiales, sin proyecto (Generales).
6. Volver al dashboard → ver el total "1.000 ARS / 0 USD" y el gasto en "Últimos gastos".
7. Toggle a USD → el campo "tasa de cambio" debe autocompletarse con la cotización del día (vía Edge Function manual trigger en local).

## 8. Trigger manual de Edge Functions (local)

```bash
# FX fetch
supabase functions serve daily-fx-fetch --env-file .env.local
curl -X POST http://localhost:54321/functions/v1/daily-fx-fetch \
  -H "Authorization: Bearer <service_role_key>"

# Send invitation email (requiere Resend dev mode con allowlist)
supabase functions serve send-invitation-email --env-file .env.local
```

---

## Comandos comunes

```bash
pnpm dev               # Next dev server (Turbopack)
pnpm build             # Production build
pnpm start             # Run production build local
pnpm typecheck         # tsc --noEmit
pnpm lint              # ESLint
pnpm test              # Vitest unit + integration
pnpm db:types          # Regenerate types/db.ts
pnpm db:reset          # Reset local Supabase + reseed
pnpm db:diff <name>    # Generate new migration from schema diff
```

---

## Estructura de import paths

```typescript
import { Button } from '@/components/ui/button';      // src/components/ui/button.tsx
import { useExpenses } from '@/hooks/use-expenses';   // src/hooks/use-expenses.ts
import { createExpense } from '@/actions/expenses/create-expense';
import { ExpenseSchema } from '@/lib/schemas/expense';
import type { Expense } from '@/types';
```

Aliases definidos en `tsconfig.json` y mapeados también en `next.config.ts` si fuera necesario.

---

## Validaciones pre-merge (checklist mínimo)

```bash
pnpm typecheck && pnpm lint && pnpm test
```

Plus: smoke test manual en mobile + desktop según `AGENTS.md` Pre-Delivery Checklist.

---

## Deploy a producción

```bash
# Linkear proyecto Vercel (primera vez)
vercel link

# Deploy preview (PR)
vercel

# Deploy production
vercel --prod
```

Variables de entorno en Vercel dashboard — replicar `.env.local` con valores de Supabase production.

Cron jobs de Supabase Edge Functions:

```bash
supabase functions deploy daily-fx-fetch --no-verify-jwt
supabase functions deploy materialize-recurring --no-verify-jwt
supabase functions deploy send-invitation-email
```

Configurar schedules en Supabase Dashboard → Edge Functions → Schedules:
- `daily-fx-fetch` → `0 12 * * *`
- `materialize-recurring` → `0 13 * * *`
