# Research — MVP Core

**Phase**: 0
**Date**: 2026-05-01

Decisiones técnicas resueltas. Todas las ambigüedades del spec quedaron cerradas durante `/grill-me`. Esta página documenta las decisiones, la razón, y las alternativas descartadas para cada elección que afecta diseño.

---

## R-01 — FX rate source

**Decision**: `dolarapi.com` v1, endpoint `/dolares/oficial`. Fetch diario via Edge Function scheduled.

**Rationale**: API pública sin auth, JSON simple, latencia baja desde Vercel/Supabase, oficial documentado. Devuelve `{ casa, nombre, compra, venta, fechaActualizacion }` — usamos `venta` como referencia para conversión a USD (porque el usuario "compra dólares" para pagar al albañil).

**Alternatives considered**:
- BCRA scrape: HTML, frágil, terms of use ambiguos.
- Bluelytics: incluye blue/MEP/CCL pero el usuario pidió "oficial editable", suficiente con dolarapi.
- Manual-only: descartado, agrega fricción al cargar gastos en USD.

---

## R-02 — Conversión multi-currency

**Decision**: Snapshot inmutable al guardar gasto. Persistir `amount`, `currency`, `fx_rate_used` (numeric 14,6), `amount_ars` (numeric 14,2), `amount_usd` (numeric 14,2). Las dos columnas denormalizadas se calculan en el server al INSERT/UPDATE; las sumas del dashboard son `SUM(amount_ars)` / `SUM(amount_usd)` directos.

**Rationale**: Auditable, rápido (sin conversión runtime), mantiene la verdad histórica. Constitution principio IV obliga a esto.

**Alternatives considered**:
- Calcular runtime con tasa de la fecha del gasto: rompe si la tasa histórica se borra/modifica, suma costo de joins en cada query.
- Single-currency con pivot a ARS: pierde fidelidad cuando el usuario quiere ver "cuánto pagué en USD".

---

## R-03 — Bloqueo de edición de tasas históricas

**Decision**: Trigger Postgres `BEFORE UPDATE OR DELETE ON daily_fx_rates` que rechaza la operación si la fila tiene más de 2 horas (ventana de corrección post-fetch).

**Rationale**: Cumple con principio IV sin atar la UX en caso de fetch erróneo del cron diario.

**Alternatives considered**:
- Bloqueo total: si el cron escribe una tasa errada, sin ventana de corrección quedamos pegados.
- Solo restricción RLS: bypassable por service role, no es defensa real.

---

## R-04 — Auth flows

**Decision**: Supabase Auth con dos métodos:
1. **Magic link** (passwordless) — primary, también para flow de invitación.
2. **Email + password** — secundario, para usuarios que prefieren.

Recovery via OTP standard de Supabase.

**Rationale**: Magic link reduce fricción en mobile y resuelve "auto-signup al aceptar invitación" naturalmente. Email+password se ofrece para usuarios que no chequean email frecuentemente.

**Alternatives considered**:
- OAuth (Google/Apple): out of MVP — agrega configuración por provider y consent screens, no resuelve un need crítico para uso personal/familiar.

---

## R-05 — Invitation flow

**Decision**:
1. Owner crea invitación → row en `invitations` con `token` UUID + `expires_at = now() + 7 days`.
2. Edge Function `send-invitation-email` envía email vía Resend con link `https://app/accept-invitation?token=XXX`.
3. Cuando el destinatario clickea: si tiene sesión activa con un email distinto al invitado, mostrar mensaje. Si tiene sesión con el email correcto, aceptar directo. Si no tiene sesión, redirigir a magic link signup que en callback acepta automáticamente.
4. Aceptación = `INSERT INTO workspace_members + UPDATE invitations SET accepted_at = now()`.

**Rationale**: Cubre los 3 casos (invitado nuevo, invitado existente, invitado con sesión incorrecta) con un solo endpoint. Magic link de Supabase resuelve el auto-signup.

**Alternatives considered**:
- Forzar signup completo antes de aceptar: fricción innecesaria para parejas/familia.
- Token JWT con email claim: más complejo, no aporta sobre UUID + DB lookup.

---

## R-06 — Edge Functions vs Vercel cron

**Decision**: Usar Supabase Edge Functions (Deno) con `cron.schedule` para `daily-fx-fetch` y `materialize-recurring`. La función `send-invitation-email` se invoca on-demand desde Server Action.

**Rationale**: El cron de Supabase está cerca de la DB, no requiere segunda plataforma. Vercel Cron tiene tier-limits en hobby. Edge Functions ya tienen acceso natural a `service_role_key`.

**Alternatives considered**:
- Vercel Cron + Server Action: dependencia adicional, requiere webhook secret, más configuración.
- pg_cron en Supabase con plpgsql: mezcla lógica HTTP en SQL, peor DX.

---

## R-07 — Charts library

**Decision**: `@tremor/react` (basado en Recharts) para charts del dashboard.

**Rationale**: Tremor está hecho específicamente para dashboards financieros, viene con tokens visuales coherentes (BarChart, AreaChart, DonutChart, ProgressBar, Metric), tipado fuerte. Recharts subyacente da control fino si se necesita.

**Alternatives considered**:
- Recharts directo: requiere reinventar layout/tipografía para cada chart.
- Visx / d3: poder absoluto, costo de tiempo desproporcionado para MVP.
- Nivo: bundle pesado, peor DX en SSR.

---

## R-08 — Excel parsing

**Decision**: SheetJS (`xlsx` package) para parse + write. Validation row-by-row con Zod schema en `src/lib/schemas/excel-row.ts`.

**Rationale**: De facto standard, soporta `.xlsx` + `.xls`, streaming para archivos grandes, server-side compatible.

**Alternatives considered**:
- ExcelJS: API más verbosa, peor con archivos grandes.
- CSV-only: contradice el req de "template Excel descargable".

---

## R-09 — i18n

**Decision**: `next-intl` con routing localizado `app/[locale]/...`. Idiomas `es` (default) y `en`. Detección por `Accept-Language` header con fallback a `es` para `es-*`.

**Rationale**: Soporte first-class para App Router + RSC, mensajes server-side, sin librerías client-side adicionales en bundle. Cobertura 100% requerida (constitution).

**Alternatives considered**:
- next-i18next: legacy, peor con RSC.
- react-intl: más manual, no integrado con routing de Next.

---

## R-10 — State management

**Decision**:
- **Server cache**: TanStack Query v5 (refresh, optimistic, cache invalidation post Server Action via `revalidateTag`)
- **UI state efímero**: Zustand (filtros activos, sidebar open, modals)
- **Form state**: React Hook Form + Zod resolver
- **URL state**: `useSearchParams` + `nuqs` para typed parsing

**Rationale**: Stack mínimo, cada herramienta con un solo job. No hay Redux/Recoil/Jotai porque no hay estado global complejo.

**Alternatives considered**:
- SWR en lugar de TanStack: TanStack tiene `useOptimistic` pattern más maduro y mejor DX para mutaciones.
- Solo TanStack (sin Zustand): TanStack es para server data, abusarlo para UI ephemeral es anti-pattern.

---

## R-11 — PWA

**Decision**: `next-pwa` con strategy `NetworkFirst` para HTML, `CacheFirst` para assets, `NetworkOnly` para Server Actions y API. Manifest declara `display: "standalone"`, theme color, icons en `public/icons/` (192, 256, 384, 512 + maskable).

**Rationale**: Cubre el req "instalable" + "shell offline". Mutations explícitamente no offline en MVP (req del usuario).

**Alternatives considered**:
- Serwist (sucesor de Workbox): más nuevo y promete Next 15 support, pero menos battle-tested. Volver a evaluar en v1.1.
- Service worker custom: reinventar la rueda.

---

## R-12 — Storage de attachments

**Decision**: Supabase Storage bucket `expense-attachments` con políticas RLS:
- INSERT: usuario debe ser miembro del workspace cuyo expense vaya a referenciar (validado en Server Action antes de obtener URL firmada).
- SELECT: usuario debe ser miembro del workspace.
- DELETE: cascade desde DELETE expense.

**Rationale**: Storage en Supabase elimina dependencia de S3 directo, RLS unificada con DB, URLs firmadas evitan exposición pública.

**Alternatives considered**:
- Vercel Blob: tier-limit en hobby + no tiene RLS unificada con DB.
- Cloudflare R2: cero costo en egress pero suma plataforma adicional.

---

## R-13 — Testing strategy

**Decision** (MVP):
- **Unit tests** (Vitest): services puros (`fx`, `excel`, `csv`, `expenses/compute-totals`).
- **Integration tests** (Vitest + Supabase test instance): Server Actions críticos (`createExpense`, `acceptInvitation`, `parseExcel`).
- **Manual smoke** en mobile + desktop antes de mergear features P1/P2.
- **E2E (Playwright)**: aplazado a v1.1 — flow login + crear gasto + dashboard.

**Rationale**: Single contributor proyect en MVP. TDD completo es overhead. Coverage estricto en lógica monetaria (donde un bug daña confianza), smoke manual cubre el resto.

**Alternatives considered**:
- TDD completo desde día 1: el usuario explícitamente pidió "no overengineering", tests donde más valor tienen.
- Cero tests: lógica de FX y Excel parsing es demasiado crítica para no testear.

---

## R-14 — Diseño visual base

**Decision**: Tema basado en linear.app (estructura/sidebar/tipografía) + wise (UX de currency conversion en form de gasto) + stripe (tablas y exports). Tokens semánticos en `app/globals.css` definidos vía CSS vars (Tailwind v4 native pattern).

**Rationale**: Las 3 referencias coinciden en estética enterprise-financiera profesional. Evita el look "shadcn genérico" sin perder velocidad de desarrollo.

**Alternatives considered**:
- Solo shadcn defaults: aceptable pero estético débil para una app que el usuario va a usar todos los días.
- Diseño custom from scratch: costo de tiempo desproporcionado para MVP.

---

## R-15 — Timezone handling

**Decision**: Todas las fechas de gasto (`paid_at`) almacenadas como `date` (sin timezone). UI usa `America/Argentina/Buenos_Aires` por default; settable per user en `profile.timezone`. Formato visualizado con `date-fns-tz`.

**Rationale**: "Gasto del 15 de marzo" es semánticamente date-only, no instante. Evita el bug clásico de "el gasto cargado a las 23:30 de Argentina aparece como 16 en UTC".

**Alternatives considered**:
- `timestamptz`: agrega complejidad sin valor para este dominio.

---

## R-16 — Concurrent edit strategy

**Decision**: Last-write-wins con `updated_at` timestamp. La UI guarda `etag = updated_at` al cargar el form. En el UPDATE, Server Action verifica `WHERE id = ? AND updated_at = etag`. Si no afecta filas, devuelve `{ ok: false, error: "stale" }` y la UI muestra toast con quién pisó el cambio.

**Rationale**: Workspaces compartidos son chicos (2-10 miembros, mismo hogar). Locks pesimistas son overkill. Last-write-wins con feedback claro es el balance.

**Alternatives considered**:
- Operational Transform / CRDTs: overkill absoluto.
- Server-side merge: ambiguo en campos de monto, peligroso.

---

## R-17 — Email provider

**Decision**: Resend (`@resend/node`) para emails de invitación y password reset. Templates en `src/lib/email/templates/` como JSX (Resend soporta React Email).

**Rationale**: DX excelente, free tier 3000 emails/mes (más que suficiente para invitaciones de uso personal/familiar), templates en React mantenibles.

**Alternatives considered**:
- Supabase Auth built-in emails: limitado en customización, menos control sobre templates de invitación.
- SendGrid/Mailgun: más config, pricing peor en tier free.

---

## R-18 — Analytics

**Decision**: Vercel Analytics + Vercel Speed Insights en producción. Sentry para crash analytics. Sin product analytics adicionales en MVP.

**Rationale**: Costo cero en hobby tier, integración nativa con deploy, suficiente visibilidad para una app personal/familiar.

**Alternatives considered**:
- PostHog: poderoso pero overhead de setup y privacy considerations innecesarias para uso personal.
- Plausible: para producto público, no aplica acá.

---

## R-19 — Form validation strategy

**Decision**: Single Zod schema por entidad en `src/lib/schemas/`. Reutilizado por:
- React Hook Form via `zodResolver`
- Server Action input validation
- Excel row validation

**Rationale**: Single source of truth previene drift cliente-server. Cumple constitution principio I.

**Alternatives considered**:
- Yup / Joi: zod es estándar de facto en TS, mejor inferencia de tipos.

---

## R-20 — File size limits

**Decision**:
- Attachments: max 10 MB por archivo (PDF/JPG/PNG).
- Excel import: max 5 MB / 5000 rows.

**Rationale**: Límites generosos para uso real, suficientes para protección contra abuso. Se puede subir si se necesita.

---

## Decisiones diferidas a v1.1+

Listado explícito de cosas resueltas como "fuera de MVP" para que tasks no las incluyan:

- OCR de recibos vía AI vision (gpt-4o-mini o Claude Haiku)
- Recurrentes (definición, materialización vía cron, edición)
- Etapas de obra (`stages` table)
- PDF export (`@react-pdf/renderer`)
- Dark mode toggle (CSS vars existen, falta toggle UI)
- Búsqueda avanzada (full-text con ranking, búsqueda dentro de notas)
- Offline writes (background sync, queue)
- Alertas de presupuesto (% gastado vs budget, push notifications)
- Transfer ownership UI completa (DB ya soporta, falta UI flow)
- Idioma PT, otros
- Notion-style tags adicionales por gasto
- Multi-tasa (blue, MEP, CCL)
