/**
 * `Scope` — first-class value type for the /expenses scope concept.
 *
 * The expense list can be scoped to:
 *  - all     → workspace-wide (no project filter)
 *  - general → expenses with project_id IS NULL
 *  - project → expenses for a specific project (any UUID)
 *
 * Encapsulates parsing from URL string, conversion to ExpenseFilters,
 * and human-readable labels. Avoids ad-hoc `string` interpretation
 * scattered across page / tabs / export-button.
 */

import type { ExpenseFilters } from '@/lib/schemas/expense';

export type ScopeAll = { kind: 'all' };
export type ScopeGeneral = { kind: 'general' };
export type ScopeProject = { kind: 'project'; projectId: string };
export type Scope = ScopeAll | ScopeGeneral | ScopeProject;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const SCOPE_ALL: ScopeAll = { kind: 'all' };
export const SCOPE_GENERAL: ScopeGeneral = { kind: 'general' };

export function parseScope(value: string | null | undefined): Scope {
  if (!value || value === 'all') return SCOPE_ALL;
  if (value === 'general') return SCOPE_GENERAL;
  if (UUID_RE.test(value)) return { kind: 'project', projectId: value };
  return SCOPE_ALL;
}

/** Serialize back to URL form. `null` means "default scope" (no param needed). */
export function serializeScope(scope: Scope): string | null {
  if (scope.kind === 'all') return null;
  if (scope.kind === 'general') return 'general';
  return scope.projectId;
}

/** Project filter slice that this scope contributes to ExpenseFilters. */
export function scopeToProjectFilter(scope: Scope): Pick<ExpenseFilters, 'projectId'> {
  if (scope.kind === 'all') return {};
  if (scope.kind === 'general') return { projectId: null };
  return { projectId: scope.projectId };
}

/** Human-readable label. Pass projects so we can resolve project names. */
export function scopeLabel(
  scope: Scope,
  projects: ReadonlyArray<{ id: string; name: string }>,
): string {
  if (scope.kind === 'all') return 'Todos';
  if (scope.kind === 'general') return 'Generales';
  return projects.find((p) => p.id === scope.projectId)?.name ?? 'Proyecto';
}

export function scopeEquals(a: Scope, b: Scope): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'project' && b.kind === 'project') return a.projectId === b.projectId;
  return true;
}
