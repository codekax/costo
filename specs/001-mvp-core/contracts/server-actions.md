# Contracts — Server Actions

**Phase**: 1
**Date**: 2026-05-01

Contratos de todos los Server Actions del MVP. Cada action retorna discriminated union `{ ok: true, ... } | { ok: false, error: ErrorCode }` — nunca throw al cliente. Los inputs se validan con Zod antes de cualquier llamada a DB.

## Convenciones

```typescript
// Resultado estándar
type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: ActionErrorCode; details?: Record<string, string[]> };

type ActionErrorCode =
  | 'invalid_input'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'           // unique violation, version mismatch
  | 'stale'              // last-write-wins lost the race
  | 'limit_reached'      // e.g. 10 members
  | 'expired'            // invitation expired
  | 'fx_unavailable'     // FX for date not loaded
  | 'storage_failed'
  | 'unknown';
```

Todas las Server Actions:
1. Validan input con Zod schema correspondiente.
2. Obtienen sesión via `createServerClient()`. Sin sesión → `{ ok: false, error: 'unauthenticated' }`.
3. Verifican membresía/rol vía RLS implícita (Supabase rechaza la query si no aplica policy).
4. Loggean errores con `logger.error('feature.action', { error, ... })`.
5. Llaman `revalidatePath` / `revalidateTag` post-mutation exitosa.

---

## Auth

### `signUp`
```typescript
input  : { email: string; password: string; name?: string }
result : ActionResult<{ userId: string }>
errors : invalid_input | conflict (email already used) | unknown
side   : Supabase Auth signUp + trigger crea workspace personal automáticamente
```

### `signIn`
```typescript
input  : { email: string; password: string }
result : ActionResult<{ redirectTo: string }>
errors : invalid_input | not_found | unknown
```

### `signInWithMagicLink`
```typescript
input  : { email: string; redirectTo?: string }
result : ActionResult<void>  // email enviado
errors : invalid_input | unknown
```

### `signOut`
```typescript
input  : none
result : ActionResult<void>
errors : unknown
side   : limpia cookies, revalidatePath('/')
```

### `requestPasswordReset`
```typescript
input  : { email: string }
result : ActionResult<void>
errors : invalid_input | unknown
```

### `deleteAccount`
```typescript
input  : { confirmation: string }   // user typing "DELETE"
result : ActionResult<void>
errors : invalid_input | forbidden (owner único de shared workspaces) | unknown
side   : ejecuta supabaseAdmin.auth.admin.deleteUser después de validar
```

---

## Workspaces

### `createWorkspace`
```typescript
input  : { name: string; kind: 'shared' }   // personal solo se crea por trigger
result : ActionResult<{ workspaceId: string }>
errors : invalid_input | unknown
side   : trigger seedea categorías y agrega owner como member
```

### `updateWorkspace`
```typescript
input  : { id: string; name: string }
result : ActionResult<void>
errors : invalid_input | forbidden (no es owner) | not_found | unknown
side   : revalidatePath(`/settings/workspaces/${id}`)
```

### `deleteWorkspace`
```typescript
input  : { id: string; confirmation: string }   // typing del nombre
result : ActionResult<void>
errors : invalid_input | forbidden | not_found | unknown
```

### `transferOwnership`
```typescript
input  : { workspaceId: string; toUserId: string }
result : ActionResult<void>
errors : invalid_input | forbidden | not_found | unknown
side   : UPDATE workspaces.owner_id + UPDATE workspace_members.role for both
```

### `leaveWorkspace`
```typescript
input  : { workspaceId: string }
result : ActionResult<void>
errors : forbidden (owner único) | not_found | unknown
```

---

## Invitations

### `sendInvitation`
```typescript
input  : { workspaceId: string; email: string; role: 'editor' }
result : ActionResult<{ invitationId: string; copyLink: string }>
errors : invalid_input | forbidden | limit_reached (10 members + pending invites) | conflict (already invited) | unknown
side   : INSERT invitations + invoca Edge Function send-invitation-email
```

### `acceptInvitation`
```typescript
input  : { token: string }
result : ActionResult<{ workspaceId: string }>
errors : invalid_input | not_found | expired | unknown
side   : INSERT workspace_members + UPDATE invitations.accepted_at
note   : si el usuario no está autenticado, redirige a flow de magic-link signup que llama esta action en el callback
```

### `revokeInvitation`
```typescript
input  : { invitationId: string }
result : ActionResult<void>
errors : forbidden | not_found | unknown
```

### `removeMember`
```typescript
input  : { workspaceId: string; userId: string }
result : ActionResult<void>
errors : forbidden (no owner, o el target es el owner) | not_found | unknown
```

### `changeMemberRole`
```typescript
input  : { workspaceId: string; userId: string; role: 'owner' | 'editor' }
result : ActionResult<void>
errors : forbidden | invalid_input | unknown
note   : escalation a owner se hace via transferOwnership; este action solo cambia editor↔editor
```

---

## Projects

### `createProject`
```typescript
input  : {
  workspaceId: string;
  name: string;
  type: 'renovation' | 'general' | 'other';
  description?: string;
  startDate?: string;        // YYYY-MM-DD
  endDate?: string;
  budgetArs?: number;
  budgetUsd?: number;
}
result : ActionResult<{ projectId: string }>
errors : invalid_input | forbidden | unknown
```

### `updateProject`
```typescript
input  : { id: string; ...partial of createProject input; etag: string /* updated_at */ }
result : ActionResult<void>
errors : invalid_input | forbidden | not_found | stale | unknown
```

### `archiveProject`
```typescript
input  : { id: string; archive: boolean }
result : ActionResult<void>
errors : forbidden | not_found | unknown
```

### `deleteProject`
```typescript
input  : { id: string; confirmation: string }   // typing project name
result : ActionResult<void>
errors : invalid_input | forbidden | not_found | unknown
side   : cascade a expenses
```

---

## Categories

### `createCategory`
```typescript
input  : { workspaceId: string; name: string; color: string; icon: string }
result : ActionResult<{ categoryId: string }>
errors : invalid_input | conflict (unique) | unknown
```

### `updateCategory`
```typescript
input  : { id: string; name?: string; color?: string; icon?: string }
result : ActionResult<void>
errors : invalid_input | conflict | not_found | unknown
```

### `deleteCategory`
```typescript
input  : { id: string; confirmation: string }
result : ActionResult<void>
errors : invalid_input | not_found | unknown
side   : cascade a expenses (acepta perder gastos asociados)
```

---

## Vendors

### `createVendor`
```typescript
input  : { workspaceId: string; name: string; contact?: string; notes?: string }
result : ActionResult<{ vendorId: string }>
errors : invalid_input | conflict | unknown
```

### `updateVendor`
```typescript
input  : { id: string; name?: string; contact?: string; notes?: string }
result : ActionResult<void>
errors : invalid_input | conflict | not_found | unknown
```

### `deleteVendor`
```typescript
input  : { id: string; confirmation: string }
result : ActionResult<void>
errors : invalid_input | not_found | unknown
side   : SET NULL en expenses.vendor_id (no cascade)
```

---

## Expenses

### `createExpense`
```typescript
input  : {
  workspaceId: string;
  projectId: string | null;          // null = Generales
  categoryId: string;
  vendorId?: string | null;
  amount: number;                    // > 0
  currency: 'ARS' | 'USD';
  fxRateUsed: number;                // > 0
  paidAt: string;                    // YYYY-MM-DD
  description?: string;
  notes?: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'pdf';
}
result : ActionResult<{ expenseId: string }>
errors : invalid_input | forbidden | not_found (project/category/vendor) | unknown
side   : Server calcula amount_ars + amount_usd y los persiste; trigger DB valida coherencia
note   : revalidateTag(`workspace:${workspaceId}:expenses`)
```

### `updateExpense`
```typescript
input  : same as createExpense + { id: string; etag: string }
result : ActionResult<void>
errors : invalid_input | forbidden | not_found | stale | unknown
```

### `deleteExpense`
```typescript
input  : { id: string }
result : ActionResult<void>
errors : forbidden | not_found | unknown
```

### `uploadAttachment`
```typescript
input  : { workspaceId: string; expenseId: string; file: File }   // <= 10 MB
result : ActionResult<{ url: string; type: 'image' | 'pdf' }>
errors : invalid_input (size, mime) | forbidden | storage_failed | unknown
note   : path = `{workspaceId}/{expenseId}/{filename}`. URL firmada a 7 días para SELECT.
```

---

## Import / Export

### `parseExcel`
```typescript
input  : { workspaceId: string; file: File }   // <= 5 MB
result : ActionResult<{
  rows: Array<{
    rowNumber: number;
    valid: boolean;
    errors: string[];        // i18n keys
    parsed?: ParsedExcelRow;
  }>;
  summary: { total: number; valid: number; invalid: number };
}>
errors : invalid_input | unknown
note   : NO escribe en DB — solo parsea y valida. Frontend muestra preview.
```

### `importRows`
```typescript
input  : { workspaceId: string; rows: ParsedExcelRow[] }
result : ActionResult<{ importedCount: number; createdCategoryIds: string[]; createdVendorIds: string[] }>
errors : invalid_input | forbidden | fx_unavailable | unknown
note   : crea categorías/vendors faltantes on-the-fly. Para filas USD sin fx_rate, usa daily_fx_rates de la fecha del gasto.
```

### `exportCsv`
```typescript
input  : { workspaceId: string; filters: ExpenseFilters }
result : ActionResult<{ csvUrl: string }>   // signed URL temporal
errors : forbidden | unknown
note   : genera CSV server-side, sube a Storage como `exports/{workspaceId}/{timestamp}.csv`, devuelve signed URL 1h.
```

---

## Profile

### `updateProfile`
```typescript
input  : { name?: string; locale?: 'es' | 'en'; timezone?: string }
result : ActionResult<void>
errors : invalid_input | unknown
```

---

## Error mapping a UI strings (i18n)

```
invalid_input          → "Revisá los datos ingresados"
unauthenticated        → "Iniciá sesión para continuar"
forbidden              → "No tenés permisos para esta acción"
not_found              → "Recurso no encontrado"
conflict               → "Ya existe un registro con esos datos"
stale                  → "Otro miembro modificó esto mientras editabas"
limit_reached          → "Alcanzaste el límite máximo"
expired                → "La invitación expiró"
fx_unavailable         → "No hay tasa de cambio para esa fecha"
storage_failed         → "No se pudo subir el archivo"
unknown                → "Algo salió mal — intentá de nuevo"
```
