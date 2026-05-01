---
description: "Task list — costo MVP Core"
---

# Tasks: MVP Core — Multi-Project Expense Tracker

**Input**: Design documents from `/specs/001-mvp-core/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: incluidos solo para servicios críticos (FX, Excel, CSV) según research R-13 — no TDD completo, no E2E en MVP.

**Organization**: Tasks agrupadas por user story (US1-US10) para implementación incremental con checkpoints validables.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizable (archivos distintos, sin dependencias en tasks pendientes)
- **[Story]**: US1-US10 según spec.md
- Paths absolutos desde repo root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bootstrapping del proyecto Next.js + Supabase + tooling base

- [ ] T001 Inicializar Next.js 15 en repo root con `pnpm create next-app@latest . --ts --tailwind --app --src-dir=false --import-alias "@/*" --use-pnpm --no-eslint` (luego configurar ESLint manual). Mantener `app/` en root, crear `src/` separado para components/hooks/actions/services/lib/types/i18n/config.
- [ ] T002 Configurar `tsconfig.json` con strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `noFallthroughCasesInSwitch`, y los path aliases `@/components`, `@/hooks`, `@/actions`, `@/services`, `@/lib`, `@/types`, `@/utils`, `@/i18n`, `@/config` apuntando a `src/*`.
- [ ] T003 [P] Instalar dependencias core: `pnpm add @supabase/ssr @supabase/supabase-js @tanstack/react-query zustand react-hook-form @hookform/resolvers zod next-intl date-fns date-fns-tz lucide-react sonner nuqs xlsx @tremor/react recharts class-variance-authority clsx tailwind-merge`.
- [ ] T004 [P] Instalar dev dependencies: `pnpm add -D eslint eslint-config-next typescript-eslint @types/node vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom`.
- [ ] T005 [P] Configurar ESLint en `.eslintrc.json` con `next/core-web-vitals`, `next/typescript`, reglas: `@typescript-eslint/no-explicit-any: error`, `no-relative-import-paths/no-relative-import-paths`, import order.
- [ ] T006 [P] Configurar Prettier en `.prettierrc` (singleQuote, semi, trailingComma all, printWidth 100).
- [ ] T007 [P] Setup Tailwind v4 en `app/globals.css` con `@import "tailwindcss";` + tokens CSS vars semánticos (`--background`, `--foreground`, `--card`, `--primary`, `--muted`, `--border`, `--ring`) en light/dark.
- [ ] T008 [P] Configurar Vitest en `vitest.config.ts` con `jsdom` env + path aliases sincronizados con tsconfig.
- [ ] T009 [P] Crear `package.json` scripts: `dev`, `build`, `start`, `typecheck` (`tsc --noEmit`), `lint`, `test` (`vitest run`), `test:watch`, `db:types` (`supabase gen types typescript --local > src/types/db.ts`), `db:reset`, `db:diff`.
- [ ] T010 Inicializar shadcn/ui con `pnpm dlx shadcn@latest init` (style: new-york, base color: neutral, css vars: yes). Agregar componentes base: `button`, `input`, `label`, `form`, `select`, `textarea`, `dialog`, `sheet`, `dropdown-menu`, `popover`, `card`, `badge`, `separator`, `skeleton`, `tabs`, `toggle`, `tooltip`, `progress`, `avatar`, `command`.
- [ ] T011 [P] Setup Supabase CLI local: `supabase init` en repo root (crea `supabase/config.toml`).
- [ ] T012 [P] Crear `.env.example` con todas las vars de research R-XX y `contracts/schemas.md` `env.ts` (SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY, DOLARAPI_BASE_URL, RESEND_API_KEY, APP_URL).
- [ ] T013 Crear estructura de carpetas vacías según `plan.md`: `src/{components,hooks,actions,services,lib,types,i18n,config,utils}` + `app/[locale]/{(auth),(app)}` + `supabase/{migrations,functions}` + `tests/{unit,integration}` + `public/{icons,templates}`.

**Checkpoint Setup**: `pnpm typecheck && pnpm lint` pasa con repo vacío.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura compartida que TODAS las user stories necesitan: DB schema, RLS, auth, workspace context, i18n, layout base.

**⚠️ CRITICAL**: Ninguna user story puede empezar antes de completar esta fase.

### Database & RLS

- [ ] T014 Crear migration `supabase/migrations/0001_init_workspaces_members_invitations.sql` con `workspaces`, `workspace_members`, `invitations`, helper functions `is_workspace_member` / `is_workspace_owner`, member-limit trigger, RLS policies — todo de `data-model.md` migration 0001.
- [ ] T015 Crear migration `supabase/migrations/0002_init_projects_categories_vendors.sql` con `projects`, `categories`, `vendors` + RLS policies (`*_all` policies via `is_workspace_member`).
- [ ] T016 Crear migration `supabase/migrations/0003_init_expenses.sql` con `expenses` table + indices + GIN search index + `set_updated_at` triggers para expenses/projects/workspaces + RLS.
- [ ] T017 Crear migration `supabase/migrations/0004_init_recurring_expenses.sql` con `recurring_expenses` (scaffolding v1.1) + FK `expenses.recurring_id` + RLS.
- [ ] T018 Crear migration `supabase/migrations/0005_init_daily_fx_rates.sql` con `daily_fx_rates` + `fx_immutable_update` + `fx_immutable_delete` triggers + RLS de read-only para authenticated.
- [ ] T019 Crear migration `supabase/migrations/0006_seed_categories_function.sql` con `seed_workspace_categories(uuid)` + `on_workspace_created` trigger + `on_user_created` trigger (auto-crea workspace personal en signup).
- [ ] T020 Crear migration `supabase/migrations/0007_immutability_triggers.sql` con `validate_expense_amounts` trigger (chequea coherencia amount_ars/amount_usd con amount + currency + fx_rate_used, tolerancia ±0.02).
- [ ] T021 Crear migration `supabase/migrations/0008_storage_attachments.sql` con bucket `expense-attachments` (10 MB, allowed mimes) + 3 storage policies (`select`/`insert`/`delete`) usando `is_workspace_member` sobre `(storage.foldername(name))[1]`.
- [ ] T022 Correr `supabase db reset` localmente y verificar que todas las migrations aplican sin errores. Generar types con `pnpm db:types` → `src/types/db.ts`.

### Env & Logger

- [ ] T023 [P] Crear `src/config/env.ts` con `ServerEnvSchema` Zod y export `env = ServerEnvSchema.parse(process.env)` exactamente como en `contracts/schemas.md`.
- [ ] T024 [P] Crear `src/lib/logger.ts` con wrapper `info` / `warn` / `error` según AGENTS.md (camelCase event names con feature prefix).
- [ ] T025 [P] Crear `src/lib/utils.ts` con `cn(...inputs)` (clsx + tailwind-merge), `formatCurrency`, `formatDate`, `parseDate`.

### Supabase clients

- [ ] T026 Crear `src/lib/supabase/server.ts` con `createServerClient()` usando `@supabase/ssr` para RSC + Server Actions, leyendo cookies con `next/headers`.
- [ ] T027 [P] Crear `src/lib/supabase/client.ts` con `createBrowserClient()` para client components.
- [ ] T028 [P] Crear `src/lib/supabase/admin.ts` con `supabaseAdmin` usando `SERVICE_ROLE_KEY` — solo importable desde Edge Functions, NO desde `app/` ni `src/actions/`.
- [ ] T029 Crear `src/lib/supabase/middleware.ts` con `updateSession(request)` que refresca cookies de Supabase Auth (basado en doc oficial @supabase/ssr).

### Middleware (auth + i18n)

- [ ] T030 Crear `src/middleware.ts` que combina `next-intl` middleware + `updateSession` de Supabase. Matcher excluye `_next`, `api`, archivos estáticos. Redirige a `/login` si no autenticado y la ruta requiere auth.

### i18n

- [ ] T031 [P] Crear `src/i18n/routing.ts` con `defineRouting` de next-intl: locales `['es', 'en']`, defaultLocale `'es'`, `localePrefix: 'always'`.
- [ ] T032 [P] Crear `src/i18n/config.ts` con `getRequestConfig` que carga `messages/{locale}.json`.
- [ ] T033 [P] Crear `src/i18n/messages/es.json` con namespaces base: `common`, `auth`, `nav`, `errors`. Mínimo viable para layout (login/logout/dashboard/expenses/projects/categories/vendors/import/settings).
- [ ] T034 [P] Crear `src/i18n/messages/en.json` con las mismas keys traducidas a inglés.
- [ ] T035 [P] Configurar `next.config.ts` con `createNextIntlPlugin('./src/i18n/config.ts')` y exportar config con `images.remotePatterns` para Supabase Storage.

### Zod schemas (todos)

- [ ] T036 [P] Crear `src/lib/schemas/workspace.ts` con `WorkspaceKindSchema`, `WorkspaceRoleSchema`, `CreateWorkspaceSchema`, `UpdateWorkspaceSchema`, `DeleteWorkspaceSchema` exactamente como `contracts/schemas.md`.
- [ ] T037 [P] Crear `src/lib/schemas/invitation.ts` con `SendInvitationSchema`, `AcceptInvitationSchema`.
- [ ] T038 [P] Crear `src/lib/schemas/project.ts` con `ProjectTypeSchema`, `CreateProjectSchema`, `UpdateProjectSchema`, `ArchiveProjectSchema`.
- [ ] T039 [P] Crear `src/lib/schemas/category.ts` con `CreateCategorySchema`.
- [ ] T040 [P] Crear `src/lib/schemas/vendor.ts` con `CreateVendorSchema`.
- [ ] T041 [P] Crear `src/lib/schemas/expense.ts` con `CurrencySchema`, `CreateExpenseSchema`, `UpdateExpenseSchema`, `ExpenseFiltersSchema`.
- [ ] T042 [P] Crear `src/lib/schemas/excel-row.ts` con `ExcelRowSchema`.
- [ ] T043 [P] Crear `src/lib/schemas/filters.ts` con `UrlFiltersSchema`.
- [ ] T044 [P] Crear `src/types/domain.ts` que reexporta `z.infer<typeof X>` de cada schema como tipos de dominio (`Workspace`, `Project`, `Expense`, etc.).

### Helper de ActionResult

- [ ] T045 Crear `src/actions/_shared.ts` con tipo `ActionResult<T>`, `ActionErrorCode` enum, helper `actionError(code, details?)`, helper `actionOk(data)` según `contracts/server-actions.md`.

### Auth flows base

- [ ] T046 Crear Server Actions de auth en `src/actions/auth/` (`sign-up.ts`, `sign-in.ts`, `sign-in-with-magic-link.ts`, `sign-out.ts`, `request-password-reset.ts`) — `delete-account.ts` se hace en US7.
- [ ] T047 [P] Crear `app/[locale]/(auth)/login/page.tsx` con `LoginForm` (RHF + zodResolver) que llama `signIn` o `signInWithMagicLink`. Toggle entre password / magic link.
- [ ] T048 [P] Crear `app/[locale]/(auth)/signup/page.tsx` con `SignupForm` que llama `signUp`. Aclarar que el workspace personal se crea automáticamente.
- [ ] T049 [P] Crear `app/[locale]/(auth)/forgot-password/page.tsx`.
- [ ] T050 [P] Crear `app/[locale]/(auth)/layout.tsx` simple (centered card, logo opcional, sin sidebar).
- [ ] T051 Crear `app/[locale]/auth/callback/route.ts` (handler GET) que intercambia el code por sesión y redirige a `/dashboard` (basado en pattern oficial @supabase/ssr).

### App shell + workspace context

- [ ] T052 Crear `src/lib/db/queries/workspaces.ts` con `getCurrentUserWorkspaces(supabase)` y `getWorkspaceById(supabase, id)`.
- [ ] T053 Crear `app/[locale]/(app)/layout.tsx` (RSC) que: lee sesión, lee workspaces del user, si no hay activo redirige al primero (cookie `active_workspace_id`), pasa el workspaceId activo al `<AppShell>` client component.
- [ ] T054 [P] Crear `src/components/layout/sidebar.tsx` con nav items (Dashboard, Gastos, Proyectos, Categorías, Vendors, Importar, Settings) usando `usePathname` para active state.
- [ ] T055 [P] Crear `src/components/layout/workspace-switcher.tsx` con dropdown que lista workspaces del user y cookie `active_workspace_id` al elegir.
- [ ] T056 [P] Crear `src/components/layout/header.tsx` con search trigger (vacío en MVP foundational, se llena en US6), language switcher, user menu.
- [ ] T057 Crear `app/[locale]/layout.tsx` con `NextIntlClientProvider`, `ThemeProvider` (light/dark via next-themes), `<Toaster />` (sonner), TanStack QueryClientProvider.

### PWA manifest stub

- [ ] T058 [P] Crear `app/manifest.ts` (Next 15 dynamic manifest) con name "costo", short_name "costo", display "standalone", theme_color, background_color, icons placeholder en `public/icons/`.

**Checkpoint Foundational**: `pnpm dev` levanta, signup crea user + workspace personal automáticamente (verificable en SQL), login redirige a `/dashboard` (vacío todavía).

---

## Phase 3: User Story 1 — Cargar gasto y ver total acumulado (P1) 🎯 MVP CORE

**Goal**: Un usuario nuevo puede registrarse, crear un proyecto, cargar un gasto en ARS o USD básico, y ver el total acumulado del proyecto reflejado al instante. Es el reemplazo directo del Excel.

**Independent Test**: Signup → crear proyecto "Expansión casa" → cargar gasto 45.000 ARS → ver "45.000 ARS" en total del proyecto, sin refresh, en menos de 2 minutos desde mobile.

### FX rate snapshot service

- [ ] T059 [US1] Crear `src/services/fx/snapshot-fx.ts` con función `computeAmounts({ amount, currency, fxRate })` que devuelve `{ amountArs, amountUsd }` con redondeo a 2 decimales. Pure function.
- [ ] T060 [P] [US1] Crear `tests/unit/services/fx.test.ts` con casos: ARS 1000 + fx 1050 → ARS 1000 / USD 0.95; USD 200 + fx 1050 → ARS 210000 / USD 200; rounding edge cases.
- [ ] T061 [US1] Crear `src/lib/db/queries/daily-fx-rates.ts` con `getFxRateForDate(supabase, date)` que devuelve `{ rate: number; available: boolean }`.

### Projects CRUD (mínimo)

- [ ] T062 [P] [US1] Crear Server Actions `src/actions/projects/create-project.ts` con validación `CreateProjectSchema` y `revalidatePath('/projects')` post-success.
- [ ] T063 [P] [US1] Crear Server Action `src/actions/projects/update-project.ts` con etag check (`WHERE id = ? AND updated_at = etag`) → si no afecta filas → `{ ok: false, error: 'stale' }`.
- [ ] T064 [P] [US1] Crear `src/lib/db/queries/projects.ts` con `getProjects(supabase, workspaceId, { archived })`, `getProjectById(supabase, id)`, `getProjectTotals(supabase, projectId)` (returns `{ ars, usd }` via SUM).
- [ ] T065 [US1] Crear `src/components/forms/project-form.tsx` (client) con RHF + Zod, inputs: name, type, description, startDate, endDate, budgetArs, budgetUsd. Submit llama Server Action y router.push.
- [ ] T066 [US1] Crear `app/[locale]/(app)/projects/page.tsx` (RSC) que lista proyectos activos del workspace activo con sus totales.
- [ ] T067 [US1] Crear `app/[locale]/(app)/projects/new/page.tsx` con `<ProjectForm />`.
- [ ] T068 [US1] Crear `app/[locale]/(app)/projects/[id]/page.tsx` (RSC) con header del proyecto + total ARS/USD + lista de gastos del proyecto (placeholder hasta tasks de expenses).

### Expenses CRUD (single-currency mínimo, multi-currency completo en US2)

- [ ] T069 [US1] Crear Server Action `src/actions/expenses/create-expense.ts`: valida con `CreateExpenseSchema`, calcula `amountArs/amountUsd` vía `computeAmounts()`, INSERT, `revalidateTag('workspace:${workspaceId}:expenses')`.
- [ ] T070 [P] [US1] Crear Server Action `src/actions/expenses/update-expense.ts` con etag check.
- [ ] T071 [P] [US1] Crear Server Action `src/actions/expenses/delete-expense.ts`.
- [ ] T072 [P] [US1] Crear `src/lib/db/queries/expenses.ts` con `getExpenses(supabase, workspaceId, filters?)`, `getExpenseById(supabase, id)`, `getProjectTotalsByCurrency(supabase, projectId)`.
- [ ] T073 [US1] Crear `src/components/forms/expense-form.tsx` (client) con RHF + Zod, inputs: amount, currency (toggle ARS/USD), fxRateUsed (auto-fill desde getFxRateForDate, editable), paidAt (date picker), category (Select), vendor (Combobox con autocomplete creable), project (Select con opción "Generales"), description (Input), notes (Textarea). FX equivalent en vivo.
- [ ] T074 [US1] Crear `src/components/domain/expense-row.tsx` con monto + currency + descripción + fecha + project badge + category dot.
- [ ] T075 [US1] Crear `app/[locale]/(app)/expenses/new/page.tsx` con `<ExpenseForm />`.
- [ ] T076 [US1] Crear `app/[locale]/(app)/expenses/page.tsx` (RSC) con lista paginada de expenses + total ARS/USD agregado en el header.
- [ ] T077 [US1] Crear `app/[locale]/(app)/expenses/[id]/page.tsx` con detalle editable + delete con confirmación.
- [ ] T078 [US1] Crear `src/hooks/use-optimistic-expense.ts` con `useOptimistic` (React 19) que muestra fila pendiente apenas se submite el form, hasta que `revalidateTag` confirme.

### Dashboard mínimo (P1 cut)

- [ ] T079 [US1] Crear `src/lib/db/queries/dashboard.ts` con `getWorkspaceTotals(supabase, workspaceId)` (returns `{ totalArs, totalUsd }`) y `getRecentExpenses(supabase, workspaceId, limit=10)`.
- [ ] T080 [US1] Crear `app/[locale]/(app)/dashboard/page.tsx` (RSC) con cards: total ARS, total USD, últimos 10 gastos, lista de proyectos con sus totales (sin charts ni distribución, eso es US5).

**Checkpoint US1**: Usuario puede signup, crear proyecto, cargar gasto en ARS o USD, ver total reflejado en dashboard y vista de proyecto. SC-001, SC-002, SC-004 verificables.

---

## Phase 4: User Story 2 — Multi-currency con FX snapshot inmutable (P1)

**Goal**: Auto-fill de FX del día desde dolarapi, editable por gasto, snapshot inmutable preservado, totales ARS+USD desglosados en proyecto y dashboard.

**Independent Test**: Cargar gasto USD 200 (ve fx auto-completado 1050 → equivalente ARS 210.000), editarlo a fx 1200 (recalcula), guardarlo. Cambiar la cotización de hoy a otra → el gasto histórico mantiene fx=1200, amounts intactos.

### Edge Function FX fetch

- [ ] T081 [P] [US2] Crear `supabase/functions/daily-fx-fetch/index.ts` que fetch `${DOLARAPI_BASE_URL}/dolares/oficial`, parsea `venta`, UPSERT en `daily_fx_rates`. Retry 3x con backoff (1s, 5s, 30s). Log a console (Supabase functions logs). Idempotente.
- [ ] T082 [US2] Configurar schedule del cron en Supabase Dashboard: `daily-fx-fetch` → `0 12 * * *` (UTC). Documentar en `quickstart.md` el comando.

### FX UX en form

- [ ] T083 [US2] En `expense-form.tsx` agregar lógica: cuando user toggle a USD, fetch `getFxRateForDate(today)` server action → autocompletar `fxRateUsed`. Si no disponible, mostrar warning y `disabled` el submit hasta que el user ingrese tasa manual.
- [ ] T084 [US2] Mostrar en vivo el equivalente en la otra moneda al lado del monto ("≈ 210.000 ARS" mientras tipea USD 200 con fx 1050).
- [ ] T085 [US2] En `expense-row.tsx` y detalle, mostrar `monto + currency` primario y equivalente en chip secundario.

### Project + Dashboard totals con ambas monedas

- [ ] T086 [US2] Actualizar `getProjectTotalsByCurrency` para devolver `{ ars: number, usd: number }` (sum directo de columnas denormalizadas).
- [ ] T087 [US2] En `app/[locale]/(app)/projects/[id]/page.tsx` mostrar dos columnas de total y dos barras vs `budget_ars` / `budget_usd` (si hay budget en esa moneda).
- [ ] T088 [US2] En dashboard mostrar ambos totales del workspace siempre — incluso cuando son 0.

### Validación de inmutabilidad

- [ ] T089 [P] [US2] Test integration en `tests/integration/actions/expenses-immutability.test.ts`: crear gasto con fx 1050 → editar `daily_fx_rates` de la fecha (manualmente con admin) → recargar gasto → verificar que `fx_rate_used`, `amount_ars`, `amount_usd` permanecen iguales.

**Checkpoint US2**: Carga de gasto USD funciona end-to-end con FX auto + manual override + snapshot inmutable. SC-007, SC-008 verificables.

---

## Phase 5: User Story 3 — Categorías y vendors (P2)

**Goal**: Custom categories + vendors con autocomplete y filtrado básico.

**Independent Test**: Crear categoría custom "Permisos municipales" + vendor "Municipalidad" → asignar a un gasto → filtrar lista por categoría.

### Categories

- [ ] T090 [P] [US3] Crear Server Actions `src/actions/categories/{create,update,delete}-category.ts` con confirmación texto en delete (cascade a expenses).
- [ ] T091 [P] [US3] Crear `src/lib/db/queries/categories.ts` con `getCategories(supabase, workspaceId)` ordenadas por nombre.
- [ ] T092 [US3] Crear `app/[locale]/(app)/categories/page.tsx` (RSC) con lista de categorías + botón "Nueva" + edit/delete inline.
- [ ] T093 [US3] Crear `src/components/forms/category-form.tsx` con RHF + Zod, inputs: name, color (color picker shadcn), icon (icon picker — set fijo de lucide).

### Vendors

- [ ] T094 [P] [US3] Crear Server Actions `src/actions/vendors/{create,update,delete}-vendor.ts`. Delete usa SET NULL en `expenses.vendor_id` (no cascade, el gasto sobrevive sin vendor).
- [ ] T095 [P] [US3] Crear `src/lib/db/queries/vendors.ts` con `getVendors(supabase, workspaceId)` + `searchVendors(supabase, workspaceId, query)`.
- [ ] T096 [US3] Crear `app/[locale]/(app)/vendors/page.tsx` con lista + form modal.
- [ ] T097 [US3] Crear `src/components/domain/vendor-combobox.tsx` (client) con shadcn Command + autocomplete + opción "+ Crear nuevo" si no existe match.
- [ ] T098 [US3] Reemplazar el placeholder de vendor en `expense-form.tsx` por `<VendorCombobox />`.

**Checkpoint US3**: Usuario crea categorías custom y vendors, los asigna a gastos, los renombra sin perder gastos asociados.

---

## Phase 6: User Story 4 — Multi-proyecto + Generales + archivar (P2)

**Goal**: Manejar varios proyectos en paralelo, gastos sin proyecto (Generales), y archivar proyectos sin perderlos.

**Independent Test**: Crear 2 proyectos, dejar 1 gasto en Generales, archivar 1 proyecto, verificar que sigue contando en total global pero no aparece en dropdown de nuevo gasto.

- [ ] T099 [P] [US4] Crear Server Action `src/actions/projects/archive-project.ts` que setea/limpia `archived_at`.
- [ ] T100 [P] [US4] Crear Server Action `src/actions/projects/delete-project.ts` con confirmación texto del nombre.
- [ ] T101 [US4] En `getProjects` filtrar por `archived` flag — para dropdowns siempre `archived: false`.
- [ ] T102 [US4] Crear `app/[locale]/(app)/projects/archived/page.tsx` con lista de archivados + botón "Reactivar".
- [ ] T103 [US4] Crear vista virtual "Generales" en `app/[locale]/(app)/expenses/page.tsx` mediante filtro `?project=null` que filtra `project_id IS NULL`. Agregar tab/chip "Generales" arriba de la lista para acceso rápido.
- [ ] T104 [US4] En `expense-form.tsx` el dropdown de proyecto incluye option `null = "Generales (sin proyecto)"` como primera opción.

**Checkpoint US4**: 3 vistas claras (proyecto activo / Generales / archivados), totales globales del workspace incluyen archivados.

---

## Phase 7: User Story 5 — Dashboard completo con charts (P2)

**Goal**: Dashboard rico: distribución por categoría (donut), evolución mensual (area), top vendors, lista de proyectos con barras.

**Independent Test**: Con 5 gastos en 2 proyectos / 3 categorías / 2 vendors, el dashboard muestra correctamente todos los componentes en mobile y desktop.

- [ ] T105 [US5] Ampliar `getDashboardData(supabase, workspaceId, filters?)` en `src/lib/db/queries/dashboard.ts` para devolver: `totals { ars, usd }`, `byCategory[]`, `monthlyEvolution[]` (12 meses), `topVendors[]`, `projects[]` con totales, `recentExpenses[]`.
- [ ] T106 [P] [US5] Crear `src/components/charts/category-pie.tsx` usando `@tremor/react DonutChart` (data: byCategory).
- [ ] T107 [P] [US5] Crear `src/components/charts/monthly-evolution.tsx` con `@tremor/react AreaChart` (data: monthlyEvolution, dual currency lines).
- [ ] T108 [P] [US5] Crear `src/components/charts/top-vendors.tsx` con barras horizontales o lista + montos.
- [ ] T109 [P] [US5] Crear `src/components/charts/project-progress.tsx` con `@tremor/react ProgressBar` por proyecto (gastado vs budget si existe).
- [ ] T110 [US5] Re-armar `app/[locale]/(app)/dashboard/page.tsx` con grid responsive: row 1 (totals cards × 2), row 2 (categoryPie + monthlyEvolution), row 3 (projectProgress + topVendors), row 4 (recentExpenses table). Mobile: stack vertical.
- [ ] T111 [US5] Empty state cuando no hay datos: card con CTA "Cargá tu primer gasto" → `/expenses/new`.

**Checkpoint US5**: Dashboard responsive funcional con datos reales. SC-003 verificable (TTI < 1.5s con 1000 gastos seedeados).

---

## Phase 8: User Story 6 — Búsqueda y filtros con persistencia URL (P2)

**Goal**: Filtrado combinable + búsqueda full-text con state en URL.

**Independent Test**: Aplicar filtro "marzo + Expansión casa", copiar URL a otra tab, ver mismo resultado. Buscar "cemento" → encuentra gastos por descripción y vendor.

- [ ] T112 [US6] Ampliar `getExpenses` en queries para aceptar `ExpenseFilters` y agregar full-text via `to_tsvector('spanish', ...) @@ plainto_tsquery(?)` cuando `search` está presente.
- [ ] T113 [P] [US6] Crear `src/hooks/use-filters.ts` que parsea/serializa filtros desde/hacia `useSearchParams` con `UrlFiltersSchema` Zod.
- [ ] T114 [P] [US6] Crear `src/components/domain/filter-bar.tsx` (client) con chips: rango fechas, proyecto, categoría, vendor, moneda. Cada chip abre popover con select. Botón "Limpiar todo".
- [ ] T115 [P] [US6] Crear `src/components/domain/search-input.tsx` con shadcn Input + debounced query string update.
- [ ] T116 [US6] Integrar `<FilterBar />` y `<SearchInput />` en `app/[locale]/(app)/expenses/page.tsx`. Mostrar total filtrado en header de la lista.
- [ ] T117 [US6] Aplicar mismos filtros al dashboard si la URL los lleva (filtros globales del workspace).

**Checkpoint US6**: Filtros persisten en URL, búsqueda full-text < 500ms con 5000 gastos. SC-006 verificable.

---

## Phase 9: User Story 7 — Workspaces compartidos + invitaciones (P3)

**Goal**: Invitar pareja/familia a un workspace shared con magic link auto-signup.

**Independent Test**: Owner invita por email → invitado recibe link → click → entra al workspace → carga gasto → owner lo ve.

### Workspace CRUD

- [ ] T118 [P] [US7] Crear Server Actions `src/actions/workspaces/{create,update,delete,leave,transfer-ownership}.ts`.
- [ ] T119 [P] [US7] Crear Server Action `src/actions/workspaces/change-member-role.ts` (editor↔editor solamente; escalation a owner via transfer).
- [ ] T120 [P] [US7] Crear Server Action `src/actions/workspaces/remove-member.ts`.

### Invitations

- [ ] T121 [P] [US7] Crear Server Action `src/actions/invitations/send-invitation.ts`: valida → INSERT row → invoca Edge Function `send-invitation-email` → retorna `{ invitationId, copyLink }`.
- [ ] T122 [P] [US7] Crear Server Action `src/actions/invitations/accept-invitation.ts`: valida token, chequea `expires_at`, INSERT en `workspace_members` + UPDATE `accepted_at`. Si user no autenticado, devolver redirect a magic-link signup con `?invitation=token`.
- [ ] T123 [P] [US7] Crear Server Action `src/actions/invitations/revoke-invitation.ts`.
- [ ] T124 [US7] Crear Edge Function `supabase/functions/send-invitation-email/index.ts` que: lookup invitation + workspace + inviter, render template React Email, POST a Resend API.
- [ ] T125 [US7] Crear template email en `src/lib/email/templates/invitation-email.tsx` (React Email components) con CTA al link `${APP_URL}/accept-invitation?token=...`.

### UI

- [ ] T126 [US7] Crear `app/[locale]/(app)/settings/workspaces/page.tsx` con lista de workspaces del user + botón "Crear shared workspace".
- [ ] T127 [US7] Crear `app/[locale]/(app)/settings/workspaces/[id]/page.tsx` (settings del workspace) con: rename, delete (con confirmación typing del nombre), transfer ownership, leave.
- [ ] T128 [US7] Crear `app/[locale]/(app)/settings/workspaces/[id]/members/page.tsx` con lista de miembros (rol, joined_at), botón "Invitar" (modal), pending invitations + revoke, cambio de rol, remove member.
- [ ] T129 [US7] Crear `app/[locale]/(auth)/accept-invitation/page.tsx` que: si user logged in con email correcto → llama `acceptInvitation` y redirige al workspace; si no logged in → muestra "Iniciá sesión o creá cuenta" con form magic-link prefilled con email; si email incorrecto → mensaje de error.
- [ ] T130 [US7] Display de nombre del autor en `<ExpenseRow />` cuando `created_by` no es el current user (en workspaces shared).
- [ ] T131 [US7] Implementar last-write-wins en `update-expense.ts` (etag check ya existe en T070) y mostrar toast "modificado por X" cuando devuelve `stale`.

### Hard rules de owner único

- [ ] T132 [US7] En `delete-account.ts` (auth) chequear si user es owner único en algún shared workspace → return `{ ok: false, error: 'forbidden' }` con detalle.
- [ ] T133 [US7] En `leave-workspace.ts` chequear que no sea owner único → si lo es, `forbidden`.

**Checkpoint US7**: Flow end-to-end de invitación funcionando, max 10 miembros, expiración 7d, owner protections. SC-009 verificable.

---

## Phase 10: User Story 8 — Excel import (P3)

**Goal**: Subir Excel template → preview con errores → importar.

**Independent Test**: Subir Excel con 50 filas (incl. categoría/vendor nuevos, 2 con errores) → preview muestra 48 ok + 2 rojas → confirmar → 48 gastos creados + categorías/vendors faltantes creados on-the-fly.

- [ ] T134 [P] [US8] Generar `public/templates/expense-import-template.xlsx` (script `scripts/generate-template.ts` ejecutable con `tsx`) con 9 columnas + 1 fila ejemplo + comentarios en headers.
- [ ] T135 [P] [US8] Crear `src/services/excel/parse-template.ts` con `parseExcelFile(buffer)` usando SheetJS → array de raw rows.
- [ ] T136 [P] [US8] Crear `src/services/excel/validate-row.ts` con `validateRow(rawRow, context)` que aplica `ExcelRowSchema` + chequeos extra (categoría existe o se va a crear, fx_rate disponible si moneda USD sin fx, etc.). Devuelve `{ valid: boolean; parsed?: ExcelRow; errors: string[] }`.
- [ ] T137 [P] [US8] Crear `tests/unit/services/excel.test.ts` con casos: row válida, row sin monto, row USD sin fx + sin daily_fx_rate, fila con categoría nueva, fecha mal formateada.
- [ ] T138 [US8] Crear Server Action `src/actions/import-export/parse-excel.ts` que: chequea size <= 5 MB → llama `parseExcelFile` + valida cada row → devuelve preview.
- [ ] T139 [US8] Crear Server Action `src/actions/import-export/import-rows.ts` que: para cada parsed row, lookup/crear category + vendor + project (si name no vacío), resolver fx_rate si USD sin fx, INSERT bulk en expenses con `computeAmounts` server-side.
- [ ] T140 [US8] Crear `app/[locale]/(app)/import/page.tsx` con: upload zone, preview table con rows en rojo (errores) y verde (válidas), botón "Confirmar import".
- [ ] T141 [US8] Mostrar progress bar en imports >100 rows. SC-005 (500 rows < 30s) verificable.

**Checkpoint US8**: Import end-to-end con casos edge cubiertos.

---

## Phase 11: User Story 9 — CSV export (P3)

**Goal**: Exportar la vista actual de gastos a CSV RFC 4180.

**Independent Test**: Aplicar filtros + click "Exportar CSV" → archivo descargado tiene exactamente las filas de la vista, comas/quotes correctamente escapados.

- [ ] T142 [P] [US9] Crear `src/services/csv/escape-rfc4180.ts` con `escapeCsvField(value)` y `rowsToCsv(rows, headers)`.
- [ ] T143 [P] [US9] Crear `tests/unit/services/csv.test.ts` con casos: valor con coma, valor con comilla doble (escape `""`), valor con newline, valor vacío.
- [ ] T144 [US9] Crear Server Action `src/actions/import-export/export-csv.ts` que: aplica filtros a `getExpenses`, genera CSV, sube a Storage `exports/{workspaceId}/{timestamp}.csv`, devuelve signed URL 1h.
- [ ] T145 [US9] Crear `<ExportButton />` en `expenses/page.tsx` que llama action y dispara descarga del archivo.

**Checkpoint US9**: Export funcional con escape correcto.

---

## Phase 12: User Story 10 — PWA + i18n switcher (P3)

**Goal**: App instalable + cambio de idioma persistente.

**Independent Test**: En Chrome Android, ver "Instalar app" en menú. App instalada abre standalone. Switch en settings cambia es↔en y persiste.

- [ ] T146 [P] [US10] Generar iconos PWA en `public/icons/` (192, 256, 384, 512, maskable). Usar herramienta tipo `@vite-pwa/assets-generator` o equivalente con un SVG fuente en `app/icon.tsx`.
- [ ] T147 [US10] Configurar `next-pwa` en `next.config.ts` con strategies: `NetworkFirst` para HTML, `CacheFirst` para `_next/static`, `NetworkOnly` para `/api/*` y Server Actions, `StaleWhileRevalidate` para `images.supabase.co`.
- [ ] T148 [P] [US10] Completar i18n: agregar todas las keys faltantes en `messages/{es,en}.json` para cubrir 100% de strings UI (revisar grep de strings hardcoded).
- [ ] T149 [P] [US10] Crear `src/components/layout/language-switcher.tsx` (dropdown) que cambia el locale via `next-intl` router.
- [ ] T150 [P] [US10] Crear `app/[locale]/(app)/settings/profile/page.tsx` con form: name, language (sync con `useLocale`), timezone (default America/Argentina/Buenos_Aires).
- [ ] T151 [US10] Validar instalación PWA en iOS Safari (Add to Home Screen muestra ícono custom + opens standalone).

**Checkpoint US10**: PWA instalable + i18n cobertura 100%. SC-010, SC-012 verificables.

---

## Phase 13: Polish & Cross-Cutting

**Purpose**: Lo que cruza features y se hace al final.

- [ ] T152 [P] Crear `app/[locale]/(app)/settings/account/page.tsx` con: cambio de password (Supabase Auth UI), borrar cuenta con confirmación + chequeo de owner único.
- [ ] T153 [P] Empty states pulidos en cada lista (categories, vendors, projects, expenses, dashboard).
- [ ] T154 [P] Loading UI con `loading.tsx` por segmento crítico (dashboard, expenses, projects, project detail).
- [ ] T155 [P] Error boundaries con `error.tsx` por segmento crítico.
- [ ] T156 [P] Pre-Delivery Checklist pass de AGENTS.md sobre todos los archivos creados (línea limits, imports, sin `any`, RLS, i18n cobertura).
- [ ] T157 [P] Sentry setup `@sentry/nextjs` con DSN env var (sólo se inicializa en production).
- [ ] T158 [P] Vercel Analytics + Speed Insights via `@vercel/analytics/next` y `@vercel/speed-insights/next` en root layout.
- [ ] T159 [P] README en root con: 1-paragraph descripción, screenshot dashboard, link a quickstart.md, link a constitution.md.
- [ ] T160 [P] Configurar `vercel.json` o config UI con build command `pnpm build`, output `Next.js`, env vars production.
- [ ] T161 Validar quickstart end-to-end siguiendo `quickstart.md` paso por paso desde clone limpio.
- [ ] T162 [P] Audit de a11y: tab order, aria-labels en iconos, contraste AA en light/dark, focus visible, screen reader test en dashboard + form de gasto.
- [ ] T163 Performance pass: Lighthouse mobile sobre dashboard y form de gasto, target performance >85, accessibility >95, best practices >95, PWA pass.
- [ ] T164 Smoke test final del flow MVP completo (US1+US2) en mobile + desktop antes de declarar v1.0.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: sin dependencias.
- **Phase 2 (Foundational)**: depende de Phase 1.
  - Bloquea TODAS las user stories.
- **Phase 3 (US1, P1)**: depende de Phase 2. Es el MVP mínimo defendible.
- **Phase 4 (US2, P1)**: depende de Phase 3 (extiende form y dashboard).
- **Phase 5 (US3)**: depende de Phase 2 (puede ir en paralelo con US1/US2 si hay capacidad, pero mejor secuencial).
- **Phase 6 (US4)**: depende de Phase 3 (US1) — extiende projects y expenses.
- **Phase 7 (US5)**: depende de Phases 3-6 (necesita data variada para tener algo que graficar).
- **Phase 8 (US6)**: depende de Phase 3 (US1).
- **Phase 9 (US7)**: depende de Phase 2 (puede empezar después del foundational, no necesita US1-US6 funcionando).
- **Phase 10 (US8)**: depende de Phase 3 (US1) + Phase 5 (US3) — usa categorías/vendors existentes.
- **Phase 11 (US9)**: depende de Phase 8 (US6) — comparte filtros.
- **Phase 12 (US10)**: depende de Phase 2 — i18n base ya hecho, falta cobertura completa.
- **Phase 13 (Polish)**: depende de las phases que se vayan a entregar.

### Within each story

- Schemas Zod antes de Server Actions
- Server Actions antes de Forms / Pages
- Queries antes de RSC pages que las consuman
- Tests unit en services pueden ir paralelos a la implementación de la página

### Parallel Opportunities

- Todos los `[P]` dentro del mismo phase pueden ir en paralelo.
- Una vez Phase 2 (Foundational) completa, US1+US3+US7 podrían ir en paralelo con múltiples developers, pero al ser single contributor se hacen secuenciales.

---

## Implementation Strategy

### MVP first (US1+US2 = "el reemplazo del Excel")

1. Phase 1 (Setup) — 1 día
2. Phase 2 (Foundational) — 2-3 días (lo más pesado)
3. Phase 3 (US1) — 2 días
4. Phase 4 (US2) — 1 día
5. **STOP & VALIDATE** — usar la app real con la expansión de la casa. Anotar gastos por 1-2 semanas. Validar que reemplaza efectivamente al Excel.

### Incremental v1.0 (todas las P1+P2)

6. Phase 5 (US3) — 1 día
7. Phase 6 (US4) — 1 día
8. Phase 7 (US5) — 2 días
9. Phase 8 (US6) — 1 día
10. **STOP & VALIDATE** — la app está completa para uso individual.

### Multi-user v1.0 final (P3)

11. Phase 9 (US7) — 3 días (lo más complejo después de Foundational)
12. Phase 10 (US8) — 2 días
13. Phase 11 (US9) — 0.5 día
14. Phase 12 (US10) — 1 día
15. Phase 13 (Polish) — 1-2 días

**Total estimado**: 19-22 días de trabajo focused. Real con interrupciones: 5-7 semanas.

---

## Notes

- `[P]` = archivo distinto + sin dependencia → paralelizable.
- `[Story]` (US1-US10) traza task ↔ user story para validación independiente.
- Tests solo en services puros (FX, Excel, CSV) — el resto se valida con smoke manual mobile + desktop.
- Cada user story termina con un Checkpoint validable independientemente.
- Commit después de cada task o grupo lógico (ej: todos los Zod schemas en un solo commit).
- Detenerse en cualquier checkpoint para validar antes de avanzar — especialmente después de US1+US2 (MVP defendible).
- Mantener la disciplina de los principios de constitution v1.0.0 + reglas de AGENTS.md en cada task.
