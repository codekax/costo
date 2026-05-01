<!--
Sync Impact Report
==================
Version change: (initial) → 1.0.0
Modified principles: N/A (first ratification)
Added sections:
  - Core Principles (7 principles)
  - Tech Stack & Constraints
  - Development Workflow
  - Governance
Removed sections: none
Templates requiring updates:
  ✅ .specify/memory/constitution.md (this file, populated)
  ⚠ .specify/templates/plan-template.md (review on first /speckit-plan run)
  ⚠ .specify/templates/spec-template.md (review on first /speckit-specify run)
  ⚠ .specify/templates/tasks-template.md (review on first /speckit-tasks run)
Follow-up TODOs: none
-->

# Constitution del Proyecto `costo`

App web responsive (PWA) para tracking de gastos multi-proyecto y multi-currency, con workspaces personales y compartidos. Esta constitution define los principios no negociables del proyecto.

## Core Principles

### I. Type Safety en los Bordes (NON-NEGOTIABLE)

TypeScript en modo `strict` siempre. `any` está prohibido — si aparece, es un bug. Toda data que cruza un borde del sistema (request body, response, env vars, params de URL, archivos importados, payloads de OCR, datos de DB no triviales) se valida con Zod antes de usarse. Los tipos de la app derivan de los schemas de Zod (`z.infer`), nunca al revés.

**Razón:** evitar errores de runtime que un sistema financiero no puede tolerar. Un monto mal parseado o una currency invalida corrompe reportes silenciosamente.

### II. Supabase como Única Fuente de Verdad + RLS desde el Día 1

Supabase Postgres es la única base de datos. Toda tabla con datos de usuario tiene políticas RLS activas antes de exponerse al cliente — no hay endpoints "temporales" que bypassen RLS. El cliente del browser usa la anon key + RLS; el server (Server Actions, Edge Functions) usa la service role key solo cuando RLS no aplica (ej: cron jobs).

**Razón:** workspace pattern significa que un bug de filtrado en queries puede leakear gastos entre usuarios. RLS es la última línea de defensa y debe estar siempre activa.

### III. Aislamiento por Workspace

Toda tabla de dominio tiene `workspace_id` (excepto las globales como `daily_fx_rates`). Toda query incluye filtro por `workspace_id`. Toda RLS policy verifica membership vía `workspace_members`. No existen relaciones cross-workspace — categorías, vendors, proyectos, gastos, recurrentes viven todos dentro de un único workspace.

**Razón:** simplicidad y aislamiento total. Un workspace compartido es un pequeño espacio cooperativo sin contaminación con espacios personales.

### IV. Integridad Financiera Inmutable

Cada `expense` guarda al momento de crearse: `amount`, `currency`, `fx_rate_used`, `amount_ars`, `amount_usd` denormalizados. Estos campos nunca se recalculan después — son snapshot histórico. Editar la tasa del día (`daily_fx_rates`) no afecta gastos existentes. Las sumas de reportes son `SUM(amount_ars)` / `SUM(amount_usd)` directos, sin conversión runtime.

**Razón:** la tasa cambia todos los días. Si un gasto se recalcula con tasa nueva, los totales históricos mienten. Los reportes deben ser auditables y reproducibles.

### V. Server-First con Optimistic UX

Las lecturas iniciales (dashboard, lista de gastos, detalle de proyecto) van por React Server Components contra Supabase. Las mutaciones van por Server Actions. El cliente usa TanStack Query v5 con `useOptimistic` para feedback instantáneo en cargas de gastos, marcando la fila como pendiente hasta confirmación. No se bloquea la UI esperando ack del server.

**Razón:** balance entre performance (RSC inicial), DX (Server Actions sin API routes manuales) y UX (instantáneo al cargar gastos, que es la acción más frecuente).

### VI. Mobile-First Responsive + Accesibilidad AA

Todo el diseño parte de mobile (`base:` en Tailwind), y se expande a tablet/desktop con breakpoints. Targets táctiles >= 44×44px. Contraste WCAG AA mínimo. Navegación por teclado completa en desktop. Forms con labels correctos, errores anunciados a screen readers. PWA instalable (manifest + icons + service worker shell-cache).

**Razón:** la app se usa con la mano izquierda mientras el usuario está en la obra, midiendo cosas. Mobile no es secundario.

### VII. Simplicidad Pragmática (Anti Over-Engineering)

Se acepta duplicación local antes que abstracción prematura. Regla de 3 borderline → no se abstrae. Hard delete con cascade es aceptable para esta app — el usuario eligió no preservar histórico de categorías/vendors borrados, y esa decisión se respeta sin agregar capas de soft-delete "por las dudas". No se introducen dependencias nuevas sin justificar el costo. No se diseña para requisitos hipotéticos futuros.

**Razón:** la complejidad oculta el bug. Una app con 80% de las features bien implementadas vale más que una con 100% mal estructurada.

## Tech Stack & Constraints

**Stack obligatorio:**
- Next.js 15 (App Router, RSC, Server Actions) + React 19
- TypeScript strict
- Tailwind CSS v4 + shadcn/ui
- TanStack Query v5 (server cache) + Zustand (UI state efímero)
- React Hook Form + Zod (forms + validación)
- Supabase (Postgres, Auth, Storage, Edge Functions)
- next-intl (i18n es/en)
- next-pwa
- SheetJS (xlsx import/export)
- Tremor + Recharts (charts)
- date-fns (timezones)
- Vercel (deploy)
- pnpm (siempre — nunca npm/yarn)

**Restricciones de código:**
- Imports absolutos con alias `@/` — nunca relativos `../../`
- `console.log` prohibido en producción — usar `logger` wrapper (`@/lib/logger`)
- Comentarios y JSDoc en inglés
- Strings de UI vía `next-intl` (es/en) — nunca hardcoded
- Server Actions sobre API routes cuando sea posible
- Migrations de DB versionadas en `supabase/migrations/` — nunca `db push`
- Edge Functions deployadas vía CLI con review previo

**Restricciones de UX:**
- Diseño visual de referencia: linear.app (estructura) + wise (currency UX) + stripe (tablas)
- Light/dark mode toggle
- i18n default por browser (es-* → es, otros → en)

## Development Workflow

**Antes de implementar cualquier cambio:**
1. Verificar que la funcionalidad respeta los 7 principios. Si los rompe, escalar a discusión antes de codear.
2. Si toca schema: actualizar simultáneamente migration + types + Zod schemas + RLS policies.
3. Si toca FX o montos: verificar que se preserva el snapshot inmutable.

**Cambios de schema requieren actualizar 4 lugares atómicamente:**
1. `supabase/migrations/<timestamp>_*.sql` — migration con `ALTER PUBLICATION` si aplica
2. `src/types/db.ts` — types regenerados
3. `src/lib/schemas/*.ts` — Zod schemas
4. RLS policies dentro de la misma migration

**Validaciones obligatorias antes de mergear:**
- `pnpm typecheck` clean
- `pnpm lint` clean
- Tests de utils críticos (`fx`, `amount-conversion`) verdes
- Manual smoke test del flujo afectado en mobile + desktop

**Git workflow:**
- Nunca commit/push automático sin pedido explícito
- Commits en inglés, convencionales (`feat:`, `fix:`, `chore:`)
- PRs no requeridas para proyecto solo (single contributor) pero los principios igual aplican

## Governance

Esta constitution **supersede** cualquier convención implícita. Cuando una decisión de implementación entra en conflicto con un principio, gana el principio.

**Enmiendas:**
- Cualquier cambio a un principio core requiere bump de versión semántica:
  - **MAJOR**: remover o redefinir un principio backward-incompatible
  - **MINOR**: agregar un nuevo principio o expandir guidance materialmente
  - **PATCH**: clarificación, typo, refinamiento sin cambio semántico
- Cada amendment actualiza `LAST_AMENDED_DATE` y deja Sync Impact Report al inicio del archivo.

**Compliance:**
- Cada `/speckit-plan` debe incluir una sección "Constitution Check" verificando alineación con estos principios.
- Cada `/speckit-tasks` debe categorizar tareas según los principios afectados (type safety, RLS, integridad financiera, etc.).
- Si una task contradice un principio, la task se rechaza o se eleva a amendment.

**Decisiones explícitas que esta constitution congela** (ya no se renegocian sin amendment):
- Workspace pattern (no per-project sharing)
- Roles `owner` + `editor` (no `viewer` por ahora)
- Hard delete con cascade (no soft delete genérico)
- FX snapshot inmutable
- OCR fuera del MVP
- i18n es + en (sumar otros = MINOR amendment)
- Stack tecnológico de la sección Tech Stack & Constraints

**Version**: 1.0.0 | **Ratified**: 2026-05-01 | **Last Amended**: 2026-05-01
