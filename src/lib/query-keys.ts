/**
 * Centralised TanStack Query key factory.
 *
 * Why this exists:
 *  - Avoid string drift across hooks (`['expenses']` vs `['expense']`)
 *  - One source of truth for invalidations (`queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })`)
 *  - Type-safe `as const` tuples make TS narrow on selectors
 *
 * Convention:
 *  - Top-level entity → `entity.all`
 *  - Sub-resources → `entity.list(filters)`, `entity.detail(id)`, `entity.byProject(projectId)`
 *  - Filters/params get serialised inside the tuple so RQ dedupes correctly
 *
 * Architectural note (RSC-first):
 *  Most reads in this app come from server components (`async page.tsx`
 *  + `Promise.all([getExpenses(...), ...])`). React Query is reserved for
 *  client-only state where SSR isn't worth it: live polling (FX rate),
 *  optimistic UI on mutation, debounced autocomplete (vendor combobox),
 *  infinite scroll. If a feature can be solved with a Server Action +
 *  `revalidatePath`, prefer that.
 *
 * Migration plan when we start using RQ:
 *  1. Add the entity branch here first
 *  2. Build the hook in `src/hooks/use-<entity>.ts`
 *  3. After mutations, invalidate via the factory — never inline strings
 */

import type { ExpenseFilters } from '@/lib/schemas/expense';

export const queryKeys = {
  expenses: {
    all: ['expenses'] as const,
    list: (workspaceId: string, filters: ExpenseFilters) =>
      ['expenses', 'list', workspaceId, filters] as const,
    detail: (id: string) => ['expenses', 'detail', id] as const,
    byProject: (projectId: string) => ['expenses', 'project', projectId] as const,
  },
  projects: {
    all: ['projects'] as const,
    list: (workspaceId: string) => ['projects', 'list', workspaceId] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
    archived: (workspaceId: string) => ['projects', 'archived', workspaceId] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: (workspaceId: string) => ['categories', 'list', workspaceId] as const,
  },
  vendors: {
    all: ['vendors'] as const,
    list: (workspaceId: string) => ['vendors', 'list', workspaceId] as const,
    search: (workspaceId: string, query: string) =>
      ['vendors', 'search', workspaceId, query] as const,
  },
  fxRate: {
    all: ['fx-rate'] as const,
    today: ['fx-rate', 'today'] as const,
    forDate: (date: string) => ['fx-rate', 'date', date] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    summary: (workspaceId: string) => ['dashboard', 'summary', workspaceId] as const,
  },
  workspaces: {
    all: ['workspaces'] as const,
    members: (workspaceId: string) => ['workspaces', 'members', workspaceId] as const,
    invitations: (workspaceId: string) =>
      ['workspaces', 'invitations', workspaceId] as const,
  },
} as const;
