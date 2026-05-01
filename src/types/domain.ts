// Domain types — derived from DB rows + Zod schemas. Single source of truth.

import type { Database } from './db';

type Tables = Database['public']['Tables'];

export type Workspace = Tables['workspaces']['Row'];
export type WorkspaceMember = Tables['workspace_members']['Row'];
export type Invitation = Tables['invitations']['Row'];
export type Project = Tables['projects']['Row'];
export type Category = Tables['categories']['Row'];
export type Vendor = Tables['vendors']['Row'];
export type Expense = Tables['expenses']['Row'];
export type RecurringExpense = Tables['recurring_expenses']['Row'];
export type DailyFxRate = Tables['daily_fx_rates']['Row'];

export type Currency = Database['public']['Enums']['currency_code'];
export type WorkspaceRole = Database['public']['Enums']['workspace_role'];
export type WorkspaceKind = Database['public']['Enums']['workspace_kind'];
export type ProjectType = Database['public']['Enums']['project_type'];

export type ExpenseWithRelations = Expense & {
  project: Pick<Project, 'id' | 'name'> | null;
  category: Pick<Category, 'id' | 'name' | 'color' | 'icon'>;
  vendor: Pick<Vendor, 'id' | 'name'> | null;
};
