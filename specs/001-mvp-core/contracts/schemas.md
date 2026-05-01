# Contracts — Zod Schemas

**Phase**: 1
**Date**: 2026-05-01

Schemas Zod de referencia para validación en bordes (Server Actions, Excel rows, env vars). Cada schema vive en `src/lib/schemas/`. Tipos derivados con `z.infer<typeof X>`.

---

## `env.ts`

```typescript
import { z } from 'zod';

const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  DOLARAPI_BASE_URL: z.string().url().default('https://dolarapi.com/v1'),
  RESEND_API_KEY: z.string().min(20),
  APP_URL: z.string().url(),
});

export const env = ServerEnvSchema.parse(process.env);
```

---

## `workspace.ts`

```typescript
export const WorkspaceKindSchema = z.enum(['personal', 'shared']);
export const WorkspaceRoleSchema = z.enum(['owner', 'editor']);

export const CreateWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(80),
  kind: z.literal('shared'),  // personal solo via trigger
});

export const UpdateWorkspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
});

export const DeleteWorkspaceSchema = z.object({
  id: z.string().uuid(),
  confirmation: z.string(),  // verified equal to workspace.name in action
});

export type Workspace = z.infer<typeof WorkspaceSchema>;
```

---

## `invitation.ts`

```typescript
export const SendInvitationSchema = z.object({
  workspaceId: z.string().uuid(),
  email: z.string().email().toLowerCase().trim(),
  role: z.literal('editor'),
});

export const AcceptInvitationSchema = z.object({
  token: z.string().uuid(),
});
```

---

## `project.ts`

```typescript
export const ProjectTypeSchema = z.enum(['renovation', 'general', 'other']);

export const CreateProjectSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
  type: ProjectTypeSchema,
  description: z.string().trim().max(2000).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  budgetArs: z.number().positive().finite().optional(),
  budgetUsd: z.number().positive().finite().optional(),
}).refine(
  (v) => !v.endDate || !v.startDate || v.endDate >= v.startDate,
  { path: ['endDate'], message: 'end_before_start' },
);

export const UpdateProjectSchema = CreateProjectSchema
  .extend({ id: z.string().uuid(), etag: z.string() })
  .partial()
  .required({ id: true, etag: true });

export const ArchiveProjectSchema = z.object({
  id: z.string().uuid(),
  archive: z.boolean(),
});
```

---

## `category.ts`

```typescript
export const CreateCategorySchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(1).max(60),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  icon: z.string().min(1).max(40),
});
```

---

## `vendor.ts`

```typescript
export const CreateVendorSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
  contact: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
});
```

---

## `expense.ts`

```typescript
export const CurrencySchema = z.enum(['ARS', 'USD']);

export const CreateExpenseSchema = z.object({
  workspaceId: z.string().uuid(),
  projectId: z.string().uuid().nullable(),
  categoryId: z.string().uuid(),
  vendorId: z.string().uuid().nullable().optional(),

  amount: z.number().positive().finite(),
  currency: CurrencySchema,
  fxRateUsed: z.number().positive().finite(),

  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),

  attachmentUrl: z.string().url().optional(),
  attachmentType: z.enum(['image', 'pdf']).optional(),
});

export const UpdateExpenseSchema = CreateExpenseSchema.extend({
  id: z.string().uuid(),
  etag: z.string(),
});

export const ExpenseFiltersSchema = z.object({
  projectId: z.string().uuid().nullable().optional(),
  categoryId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  currency: CurrencySchema.optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().trim().max(200).optional(),
}).default({});
```

---

## `excel-row.ts`

```typescript
export const ExcelRowSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  proyecto: z.string().trim().max(100).optional().default(''),
  categoria: z.string().trim().min(1).max(60),
  vendor: z.string().trim().max(100).optional().default(''),
  descripcion: z.string().trim().max(500).optional().default(''),
  moneda: z.enum(['ARS', 'USD']),
  monto: z.number().positive().finite(),
  fx_rate: z.number().positive().finite().optional(),
  nota: z.string().trim().max(2000).optional().default(''),
}).refine(
  (v) => v.moneda === 'ARS' || typeof v.fx_rate === 'number' || true,
  // fx_rate vacío en USD es válido — se resuelve con daily_fx_rates en import
);

export type ExcelRow = z.infer<typeof ExcelRowSchema>;
```

---

## `filters.ts` (URL state)

```typescript
// Compatible con nuqs / useSearchParams
export const UrlFiltersSchema = z.object({
  project: z.string().uuid().nullable().optional(),
  category: z.string().uuid().optional(),
  vendor: z.string().uuid().optional(),
  currency: z.enum(['ARS', 'USD']).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  q: z.string().max(200).optional(),
  sort: z.enum(['paid_at_desc', 'paid_at_asc', 'amount_desc', 'amount_asc']).default('paid_at_desc'),
  page: z.coerce.number().int().min(1).default(1),
});
```

---

## Patrón de uso en Server Actions

```typescript
'use server';

export async function createExpense(input: unknown): Promise<ActionResult<{ expenseId: string }>> {
  const parsed = CreateExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'invalid_input', details: parsed.error.flatten().fieldErrors };
  }
  // ... continue with parsed.data (typed)
}
```

## Patrón de uso en React Hook Form

```typescript
const form = useForm<z.input<typeof CreateExpenseSchema>>({
  resolver: zodResolver(CreateExpenseSchema),
  defaultValues: { /* ... */ },
});
```

## Patrón de uso en URL filters

```typescript
const sp = useSearchParams();
const filters = UrlFiltersSchema.parse(Object.fromEntries(sp.entries()));
```
