# costo — Agent Instructions

> Project instructions for all AI agents (Claude Code, Codex, Cursor, etc.).
> This file is law. All implementation must adhere to these rules.
> Any deviation requires explicit approval.

## Project

Web responsive PWA for personal and shared (couple/family) expense tracking across multiple projects (renovation, general, etc.) and currencies (ARS / USD).
Markets: LATAM (ES) + global (EN).
Enterprise-level stack. Server-first. RLS-first. Production-ready.

Reference documents in this repo:
- `.specify/memory/constitution.md` — project principles (NON-NEGOTIABLE)
- `.specify/templates/*` — spec-kit templates
- `specs/` — feature specifications

---

## Project Skills

Before implementing any task, read the relevant skills in `./.claude/skills/`.
This is automatic — no need for the user to ask.

Auto-load rules:

  Spec-driven workflow                      -> speckit-* skills (specify/clarify/plan/tasks/implement/analyze/checklist)
  Tailwind, shadcn/ui, design tokens        -> tailwind-design-system
  React, Next.js 15, RSC, Server Actions    -> vercel-react-best-practices
  React composition, architecture           -> vercel-composition-patterns
  Frontend design, production UI            -> frontend-design
  Any visual component                      -> ui-ux-pro-max
  Web a11y, design quality                  -> web-design-guidelines
  Modern web APIs (dialog, popover,         -> modern-web-guidance (CLI: npx modern-web-guidance search/retrieve)
    anchor positioning, container queries,
    view transitions, CWV — LCP/INP, etc.)
  Postgres queries, schema, RLS             -> supabase-postgres-best-practices
  Zod validation at boundaries              -> zod
  Auth flows                                -> better-auth-best-practices (reference only — we use Supabase Auth)
  Hard bugs, perf regressions               -> diagnose
  TDD                                       -> tdd
  Design / domain stress-testing            -> grill-me / grill-with-docs

How to read: Read `./.claude/skills/<skill-name>/SKILL.md`
Multiple skills can apply — read all relevant ones before starting.

---

## Core Principles

1. Never lose context — remember structure, decisions, and conventions across the session
2. Do not re-read files already inspected during the current session unless the user explicitly asks; minimize tool calls and prefer working from existing context
3. Plan before code — for multi-file, architectural, schema, RLS, or behavior-changing tasks, show a short plan first and wait for confirmation before large edits
4. Production-minded — all code must be deployable, not prototype quality
5. Document important decisions — non-obvious logic, architecture notes, API shapes; avoid low-signal commentary
6. Server-first on web — RSC + Server Actions are defaults; client-side only when interactivity demands it
7. RLS-first — every domain table has policies before any client touches it
8. Type-safe always — TypeScript strict, Zod for runtime validation, no `any`
9. pnpm always — never suggest npm or yarn

---

## Mandatory Thinking Process

For **every problem or task**, follow this explicit process:

```
UNDERSTAND   → Read problem context, project structure,
                constitution at .specify/memory/constitution.md,
                relevant feature spec under specs/,
                and applicable skills from ./.claude/skills/

DECOMPOSE    → Break into concrete, scoped subproblems

RESOLVE      → Address each subproblem with explicit confidence (0.0–1.0)

VERIFY       → Check: logic, types, exhaustiveness, edge cases,
                RLS coverage, FX snapshot integrity, project conventions

SYNTHESIZE   → Combine solutions using weighted confidence

REFLECT      → If confidence < 0.8: identify weaknesses, retry
```

---

## Stack (NON-NEGOTIABLE)

```
next@15                          # App Router + RSC + Server Actions
react@19
typescript (strict)
tailwindcss@4                    # Semantic tokens via CSS vars
shadcn/ui                        # Component primitives
@tanstack/react-query@5          # Server cache + optimistic updates
zustand                          # Client UI state only
react-hook-form + @hookform/resolvers
zod                              # Runtime validation (boundaries)
@supabase/ssr + @supabase/supabase-js
                                 # Auth + Postgres + Storage + Edge Functions
next-intl                        # i18n (es / en)
next-pwa                         # Manifest + service worker
xlsx (sheetjs)                   # Excel import/export
@tremor/react + recharts         # Financial charts
date-fns + date-fns-tz           # Dates / timezones (America/Argentina/Buenos_Aires)
lucide-react                     # Icons
@react-pdf/renderer              # v1.1: PDF reports
sonner                           # Toasts
@vercel/analytics                # Analytics (production)
@sentry/nextjs                   # Crash analytics (production)
```

**Package manager: pnpm — never npm or yarn.**
**TypeScript strict — `any` is forbidden.**

Do not introduce new dependencies without proposing alternatives first.

---

## Layer Architecture

```
Presentation        app/[locale]/**/*.tsx    UI only, no business logic. Max 150 lines.
                                              RSC by default; "use client" only when needed.
     ↓
Components          src/components/           ui/ | domain/ | forms/ | layout/. Max 200 lines.
     ↓
Hooks               src/hooks/                Connect UI to data/services. Client-only. Max 100 lines.
     ↓
Server Actions      src/actions/              Mutations, server-side only. Validate with Zod.
                                              Max 80 lines per action.
     ↓
Services            src/services/             Pure business logic, no React deps,
                                              no Supabase client. Max 150 lines.
     ↓
Queries / Repos     src/lib/db/queries/       Supabase reads. One function = one query.
                                              Max 100 lines.
     ↓
Database            supabase/migrations/      Postgres + RLS — source of truth.
```

**Dependency rule:** downward only. Never circular.
RSC components may import directly from `src/lib/db/queries/` (server context) but never from `src/hooks/`.
Client components may import from `src/hooks/` and call Server Actions but never from `src/lib/db/queries/`.
Violations are blocking — do not deliver without fixing.

---

## Server-First (FUNDAMENTAL RULE)

```typescript
// ✅ CORRECT — initial reads via RSC
// app/[locale]/(app)/dashboard/page.tsx
export default async function DashboardPage() {
  const supabase = await createServerClient();
  const summary = await getWorkspaceSummary(supabase, workspaceId);
  return <Dashboard data={summary} />;
}

// ❌ FORBIDDEN — client fetch on initial load when RSC works
'use client';
useEffect(() => { fetch('/api/summary')... }, []); // NO

// ✅ CORRECT — mutations via Server Actions
'use server';
export async function createExpense(input: unknown) {
  const data = CreateExpenseSchema.parse(input);
  const supabase = await createServerClient();
  return supabase.from('expenses').insert(data).select().single();
}

// ❌ FORBIDDEN — direct Supabase write from UI for sync-critical data
'use client';
await supabase.from('expenses').insert(...); // NO — bypasses Server Action validation
```

**API Routes (`app/api/*`)** = only for webhooks, third-party callbacks, or non-Action endpoints. Mutations belong in Server Actions.
**Edge Functions (`supabase/functions/*`)** = scheduled jobs (FX fetch, recurring materialization) and invitation handlers only.

---

## Database

### Mandatory process for schema changes (4 places, atomic)

1. Create migration in `supabase/migrations/<timestamp>_<name>.sql`
   - Include `CREATE/ALTER TABLE`
   - Include RLS policies (`CREATE POLICY ...`)
   - Include `ALTER PUBLICATION ...` if relevant
2. Regenerate types in `src/types/db.ts` via `pnpm db:types`
3. Update Zod schemas in `src/lib/schemas/`
4. **Show full SQL before executing — never auto-migrate**

### Connection pattern

```typescript
// src/lib/supabase/server.ts — RSC + Server Actions
export async function createServerClient() {
  const cookieStore = await cookies();
  return createServerSupabase({ cookies: () => cookieStore });
}

// src/lib/supabase/client.ts — client components only
export const supabase = createBrowserSupabase();

// src/lib/supabase/admin.ts — Edge Functions only, never imported by app/
export const supabaseAdmin = createClient(URL, SERVICE_ROLE_KEY);
```

### RLS — non-negotiable patterns

- Every table with user data has RLS enabled
- Policies check membership via `workspace_members` for workspace-scoped tables
- Service role usage is restricted to Edge Functions (cron, invitations)
- Test RLS by impersonating a different user before merging

---

## TypeScript Strict

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noImplicitReturns": true,
  "noUncheckedIndexedAccess": true,
  "noFallthroughCasesInSwitch": true
}
```

```typescript
// ❌ FORBIDDEN
function processData(data: any) {}
const expense = data as Expense;

// ✅ CORRECT
const expense = ExpenseSchema.parse(data);
function isExpense(data: unknown): data is Expense {
  return ExpenseSchema.safeParse(data).success;
}
```

All public functions and Server Actions must have explicit types on parameters and return values.
Always validate external inputs with Zod (request bodies, search params, env vars, file uploads, OCR responses).

> **Note:** `exactOptionalPropertyTypes` is intentionally left **off** (was ON in constitution v1.0.0). Reason: shadcn/ui + Radix primitives pass `undefined` through props as a matter of design, and forcing every spread to be exact creates per-import patching that violates principle VII (anti-overengineering). The remaining strict flags catch all the meaningful nullability bugs.

---

## Code Conventions

### Naming

```
Component files:       PascalCase.tsx
Server Actions files:  camelCase.ts (e.g. createExpense.ts)
Util/hook files:       camelCase.ts
Exported constants:    UPPER_SNAKE_CASE
Route segments:        kebab-case (Next.js convention)

Components:    PascalCase
Hooks:         useCamelCase
Functions:     camelCase
Types:         PascalCase (no `I` prefix)
Constants:     UPPER_SNAKE_CASE
```

### Tailwind Typography

- Never use arbitrary text sizes like `text-[32px]`
- Always prefer semantic text tokens: `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, etc.
- If the existing scale does not fit, adjust the design around the nearest semantic token instead of introducing arbitrary pixel values

### Semantic utility classes

- Prefer semantic utility classes defined via `app/globals.css` whenever they exist
- Use semantic classes such as `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary-foreground` instead of raw palette classes
- Treat `globals.css` as the source of truth for design tokens; add or refine semantic tokens there before reaching for one-off color utilities

### Import order

```typescript
// 1. React / Next.js
import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

// 2. Third-party
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { z } from 'zod';

// 3. Internal absolute (@/)
import { Button } from '@/components/ui/button';
import { useExpenses } from '@/hooks/use-expenses';
import { ExpenseSchema } from '@/lib/schemas/expense';
import type { Expense } from '@/types';

// 4. Relative (same module only)
import { ExpenseRow } from './expense-row';
```

### Mandatory path aliases

```
@/app/*          app/*
@/components/*   src/components/*
@/hooks/*        src/hooks/*
@/actions/*      src/actions/*
@/services/*     src/services/*
@/lib/*          src/lib/*
@/types/*        src/types/*
@/utils/*        src/utils/*
@/i18n/*         src/i18n/*
@/config/*       src/config/*
```

Relative imports (`../../`) are forbidden outside the same module.

---

## Code Patterns

### UI Components

- Use `React.forwardRef` on `ui/` components that wrap native elements or benefit from ref access
- `cva` (class-variance-authority) for variants
- `cn()` (from `@/lib/utils`) for class merging
- `displayName` always defined on forwardRef'd components
- Accessibility: `aria-label`, `aria-describedby`, `role` on all interactive elements
- Icons: `lucide-react` only — consistent stroke width (1.5 default)
- Form inputs: always paired with `<Label>` + `aria-invalid` + descriptive error text

### Data Hooks

- TanStack Query `useQuery` for client-driven reads (after initial RSC hydration)
- `useOptimistic` (React 19) for instant feedback on expense creation
- `useMemo` for expensive derivations (totals, grouping)
- `useCallback` for functions passed as props that trigger renders
- Do not call expensive hooks (e.g. `useWorkspaceSummary`) inside repeated list rows; hoist them to the screen/feature boundary and pass plain values/functions as props
- Explicit return type always

### Server Actions

```typescript
// src/actions/expenses/create-expense.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { CreateExpenseSchema } from '@/lib/schemas/expense';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

type CreateExpenseInput = z.input<typeof CreateExpenseSchema>;
type CreateExpenseResult =
  | { ok: true; expenseId: string }
  | { ok: false; error: string };

export async function createExpense(
  input: CreateExpenseInput,
): Promise<CreateExpenseResult> {
  const parsed = CreateExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'invalid_input' };
  }

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('expenses')
      .insert(parsed.data)
      .select('id')
      .single();

    if (error) throw error;

    revalidatePath('/dashboard');
    return { ok: true, expenseId: data.id };
  } catch (error) {
    logger.error('expenses.createExpense', { error });
    return { ok: false, error: 'unknown' };
  }
}
```

- Always validate input with Zod before any DB call
- Always return discriminated union `{ ok: true } | { ok: false }` — never throw to the client
- `revalidatePath` / `revalidateTag` after mutations
- Logger context = `<feature>.<action>` (e.g. `expenses.createExpense`)

### Services

- Pure functions — no side effects, no React deps, no Supabase imports
- Add JSDoc for public services when behavior, params, return shape, or edge cases are not obvious
- 100% testable without mocks
- Examples: `convertCurrency()`, `calculateProjectTotal()`, `parseExcelRow()`, `getFxRateForDate()`

### Async / Error handling

```typescript
// ✅ Add try/catch at async boundaries when you need context, logging,
// translation to domain errors, cleanup, or recovery behavior
try {
  const result = await repository.create(data);
  return { ok: true, value: result };
} catch (error) {
  logger.error('feature.action', { error, data });
  return { ok: false, error: 'persistence_failed' };
}

// ❌ FORBIDDEN — silent swallow
try { ... } catch {} // NEVER
```

---

## Logger

Never `console.log` in production code. Use the logger wrapper at `@/lib/logger`:

```typescript
// src/lib/logger.ts
const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  info: (ctx: string, data?: object) => {
    if (isDev) console.info(`[${ctx}]`, data);
  },
  warn: (ctx: string, data?: object) => {
    if (isDev) console.warn(`[${ctx}]`, data);
    else Sentry?.captureMessage(ctx, { level: 'warning', extra: data });
  },
  error: (ctx: string, data?: object) => {
    if (isDev) console.error(`[${ctx}]`, data);
    else Sentry?.captureException(data?.error ?? new Error(ctx), { extra: data });
  },
};
```

Event names are camelCase with feature prefix: `expenses.createExpense`, `auth.signIn`, `fx.dailyFetch`.

---

## i18n

All user-visible strings must be in translation files via `next-intl`.
**Never hardcode strings in components.**

```typescript
// ❌ FORBIDDEN
<h1>Tus gastos</h1>

// ✅ CORRECT
import { useTranslations } from 'next-intl';
const t = useTranslations('expenses');
<h1>{t('list.title')}</h1>
<p>{t('list.totalCount', { count: 42 })}</p>
```

Supported languages: `es` (default) + `en`.
Files in `src/i18n/messages/<lang>.json`.
Locale routing via `app/[locale]/...` with default redirect by `Accept-Language`.

---

## Currency & FX

```typescript
// ✅ CORRECT — snapshot at creation, never recalculate
const fxRate = await getFxRateForDate(paidAt);
const expense = {
  amount: 45000,
  currency: 'ARS',
  fx_rate_used: fxRate,
  amount_ars: currency === 'ARS' ? amount : amount * fxRate,
  amount_usd: currency === 'USD' ? amount : amount / fxRate,
  ...
};

// ❌ FORBIDDEN — runtime conversion in reports
SELECT SUM(amount * (CASE WHEN currency = 'USD' THEN fx_today ELSE 1 END)) ...
```

- Reports always sum `amount_ars` / `amount_usd` directly
- FX rate edits in the form update `fx_rate_used`, `amount_ars`, `amount_usd` for that expense only
- Editing `daily_fx_rates` historical rows is blocked at the DB layer
- All monetary values use `numeric(14, 2)` in Postgres (never `float`)
- Client-side display: `Intl.NumberFormat(locale, { style: 'currency', currency })`

---

## Environment Variables

```bash
# Client — bundled in browser (public)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SENTRY_DSN

# Server-only — Server Actions / Edge Functions only (NEVER NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY
DOLARAPI_BASE_URL                # https://dolarapi.com/v1
RESEND_API_KEY                   # invitation emails
```

**`NEXT_PUBLIC_*` is exposed to the browser — never prefix secrets with `NEXT_PUBLIC_`.**
Validate env at boot with Zod (`src/config/env.ts`).

---

## Routing (Next.js App Router)

```
app/
  [locale]/
    (auth)/                      # public layout (login, signup, accept-invitation)
    (app)/                       # authenticated layout with sidebar
      layout.tsx                 # workspace switcher + nav
      dashboard/page.tsx
      expenses/page.tsx
      expenses/[id]/page.tsx
      projects/page.tsx
      projects/[id]/page.tsx
      categories/page.tsx
      vendors/page.tsx
      import/page.tsx
      settings/
        profile/page.tsx
        workspaces/page.tsx
        workspaces/[id]/members/page.tsx
    layout.tsx                   # locale provider
  api/
    webhooks/                    # third-party callbacks only
  globals.css
```

- Route groups `(auth)` and `(app)` for layout separation
- Loading UI via `loading.tsx` per segment
- Error boundaries via `error.tsx` per segment
- Nested layouts must not duplicate workspace context fetching — use a single context provider in `(app)/layout.tsx`

---

## Forms

```typescript
// ✅ Pattern: RHF + Zod + Server Action
const form = useForm<z.input<typeof CreateExpenseSchema>>({
  resolver: zodResolver(CreateExpenseSchema),
});

async function onSubmit(values: z.output<typeof CreateExpenseSchema>) {
  const result = await createExpense(values);
  if (!result.ok) {
    toast.error(t(`errors.${result.error}`));
    return;
  }
  toast.success(t('expenses.created'));
  router.push('/expenses');
}
```

- Single source of truth schema = Zod schema in `src/lib/schemas/`
- Both client validation (RHF) and server validation (Server Action) reuse it
- Display errors via `<FormMessage>` shadcn pattern, always with `aria-invalid`
- Submit button disabled while pending; show `<Spinner />` inside

---

## AI Behavior Rules

Before implementing anything:

1. Check if a similar pattern already exists in the codebase (`src/components/ui`, existing Server Actions, existing queries)
2. Reuse existing utilities instead of creating new ones
3. Prefer simple solutions over complex abstractions (constitution principle VII)
4. Avoid introducing new dependencies unless strictly necessary
5. Read the relevant feature spec under `specs/` before coding
6. Read the constitution at `.specify/memory/constitution.md` if any decision feels load-bearing

---

## Hard Rules — Never Without Explicit Request

```
git commit / push / merge / rebase
rm -rf on any directory
DB resets (supabase db reset, drop schema)
Adding dependencies without proposing alternatives
Using npm or yarn instead of pnpm
Using `any` in TypeScript
Leaving TODO without documented justification
Auto-running migrations on remote / production
console.log in production code (use logger)
Hardcoded UI strings (use i18n)
Bypassing RLS via service role from client-reachable code
Recalculating historical amount_ars / amount_usd
Cross-workspace data access in any query
```

---

## Pre-Delivery Checklist

Verify before delivering any implementation:

- [ ] Constitution principles respected (especially RLS, FX snapshot, workspace isolation)
- [ ] Explicit types on all public functions / Server Actions?
- [ ] Zero use of `any`?
- [ ] Imports in correct order with absolute `@/` paths?
- [ ] Strings in `next-intl` messages (not hardcoded)?
- [ ] Respects line limits per layer?
- [ ] No circular dependencies between layers?
- [ ] Zod validation at every external boundary (Server Action input, env, Excel rows, URL params)?
- [ ] RLS policies in same migration as new tables/columns?
- [ ] Async boundaries handle errors with logger context — no silent swallow?
- [ ] Server Actions return `{ ok: true } | { ok: false }` instead of throwing to client?
- [ ] `revalidatePath` / `revalidateTag` called after mutations?
- [ ] Mobile + desktop smoke-tested?
- [ ] Relevant skills read and applied?
- [ ] Spec under `specs/` reviewed for the feature being implemented?
- [ ] Spec under `specs/` reviewed for the feature being implemented?

## Active Technologies
- TypeScript 5.6+ (strict mode con `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`) + Next.js 15 (App Router, RSC, Server Actions), React 19, Tailwind v4, shadcn/ui, TanStack Query v5, Zustand, React Hook Form, Zod, @supabase/ssr, next-intl, next-pwa, SheetJS, @tremor/react + recharts, date-fns, lucide-react, sonner (001-mvp-core)
- Supabase Postgres (managed) + Supabase Storage (attachments) + RLS workspace-scoped policies (001-mvp-core)

## Recent Changes
- 001-mvp-core: Added TypeScript 5.6+ (strict mode con `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`) + Next.js 15 (App Router, RSC, Server Actions), React 19, Tailwind v4, shadcn/ui, TanStack Query v5, Zustand, React Hook Form, Zod, @supabase/ssr, next-intl, next-pwa, SheetJS, @tremor/react + recharts, date-fns, lucide-react, sonner
