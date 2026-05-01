# Contracts — Edge Functions

**Phase**: 1
**Date**: 2026-05-01

Edge Functions de Supabase (Deno runtime). Solo estos 3 servicios necesitan service role o cron — el resto vive como Server Action.

---

## `daily-fx-fetch`

**Trigger**: cron `0 12 * * *` (12:00 UTC = 09:00 Argentina, asegura que dolarapi ya tenga la cotización del día)

**Auth**: invocada solo por cron Supabase. Service role implícita.

**Inputs**: ninguno.

**Outputs**: ninguno (logs only).

**Behavior**:
1. Fetch `GET https://dolarapi.com/v1/dolares/oficial`.
2. Parse `{ venta: number, fechaActualizacion: string, ... }`.
3. `INSERT INTO daily_fx_rates (date, ars_per_usd_official, source, fetched_at) VALUES (current_date, venta, 'dolarapi.com', now()) ON CONFLICT (date) DO UPDATE SET ars_per_usd_official = EXCLUDED.ars_per_usd_official, fetched_at = now()` — bypassa trigger de inmutabilidad usando service role + chequeo de ventana de 2h.
4. Si fetch falla, reintenta hasta 3 veces con backoff (1s, 5s, 30s).
5. Si todos los intentos fallan, log warning a Sentry — el formulario de gasto USD bloqueará automáticamente con tasa manual.

**Error handling**:
- `dolarapi unreachable` → log warn, no crash (siguiente cron retry).
- `unexpected payload shape` → log error a Sentry con sample del payload.

---

## `materialize-recurring` (v1.1, scaffolded)

**Trigger**: cron `0 13 * * *` (después de daily-fx-fetch)

**Auth**: service role.

**Inputs**: ninguno.

**Behavior** (v1.1, no se implementa en MVP):
1. `SELECT * FROM recurring_expenses WHERE paused_at IS NULL AND next_due_at <= current_date`.
2. Para cada uno, calcula amount_ars / amount_usd usando daily_fx_rates de hoy (o la tasa al `next_due_at` si está disponible).
3. INSERT en expenses con `recurring_id` apuntando al original.
4. UPDATE recurring_expenses.next_due_at según `frequency`.

**MVP**: deployar el archivo con un stub que solo loggea "not implemented yet" y termina exitosamente — para validar el deploy del cron.

---

## `send-invitation-email`

**Trigger**: invocada desde Server Action `sendInvitation`.

**Auth**: usa service role para acceder a invitations + envía vía Resend API key.

**Inputs**:
```typescript
{
  invitationId: string;
}
```

**Outputs**:
```typescript
{ ok: true } | { ok: false; error: string }
```

**Behavior**:
1. `SELECT email, role, token, expires_at FROM invitations WHERE id = ? AND accepted_at IS NULL`.
2. Si no existe → return `{ ok: false, error: 'not_found' }`.
3. Lookup workspace name + inviter name.
4. Render React Email template (`InvitationEmail`).
5. POST a Resend API con `from = no-reply@costo.app`, `to = invitation.email`, `subject = "Te invitaron a costo"`.
6. Si Resend devuelve error → return error y log a Sentry.

**Variables env**:
- `RESEND_API_KEY` (server-only)
- `APP_URL` (e.g. `https://costo.app`)

**Rate limit**: max 5 invitaciones por workspace por hora (validar en Server Action antes de invocar).

---

## Convenciones generales Edge Functions

```typescript
// Estructura estándar
import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  try {
    // ... handler logic
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message ?? 'unknown' }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }
});
```

- Logs de error van a Supabase Functions logs + Sentry.
- Ningún Edge Function devuelve datos sensibles al cliente — solo `{ ok }`.
- Cron jobs son idempotentes (UPSERT en daily_fx_rates).
