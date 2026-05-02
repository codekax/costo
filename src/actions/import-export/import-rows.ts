'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';

import { ExcelRowSchema } from '@/lib/schemas/excel-row';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';
import { requireWorkspaceMembership } from '@/lib/workspace-context';
import {
  createExpenseRecordsBulk,
  type BulkExpenseRow,
} from '@/services/expenses/lifecycle';
import { EXCEL_IMPORT_MAX_ROWS, EXPENSE_BULK_INSERT_CHUNK } from '@/constants/expenses';

const InputSchema = z.object({
  workspaceId: z.string().uuid(),
  rows: z.array(ExcelRowSchema).max(EXCEL_IMPORT_MAX_ROWS),
});

export type ImportRowsResult = {
  importedCount: number;
  failedCount: number;
  createdCategories: number;
  createdVendors: number;
  createdProjects: number;
  errors: { row: number; reason: string }[];
};

export async function importRows(input: unknown): Promise<ActionResult<ImportRowsResult>> {
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) return actionError('invalid_input');

  const guard = await requireWorkspaceMembership(parsed.data.workspaceId);
  if (!guard.ok) return actionError(guard.reason);

  const { workspaceId, rows } = parsed.data;
  const supabase = guard.supabase;

  try {
    const [
      { data: existingCategories },
      { data: existingVendors },
      { data: existingProjects },
    ] = await Promise.all([
      supabase.from('categories').select('id, name').eq('workspace_id', workspaceId),
      supabase.from('vendors').select('id, name').eq('workspace_id', workspaceId),
      supabase
        .from('projects')
        .select('id, name')
        .eq('workspace_id', workspaceId)
        .is('archived_at', null),
    ]);

    const categoryByName = new Map<string, string>(
      (existingCategories ?? []).map((c) => [c.name.toLowerCase(), c.id]),
    );
    const vendorByName = new Map<string, string>(
      (existingVendors ?? []).map((v) => [v.name.toLowerCase(), v.id]),
    );
    const projectByName = new Map<string, string>(
      (existingProjects ?? []).map((p) => [p.name.toLowerCase(), p.id]),
    );

    let createdCategories = 0;
    let createdVendors = 0;
    let createdProjects = 0;

    async function resolveCategory(name: string): Promise<string> {
      const key = name.toLowerCase();
      const cached = categoryByName.get(key);
      if (cached) return cached;
      const { data, error } = await supabase
        .from('categories')
        .insert({ workspace_id: workspaceId, name })
        .select('id')
        .single();
      if (error) throw error;
      categoryByName.set(key, data.id);
      createdCategories++;
      return data.id;
    }

    async function resolveVendor(name: string): Promise<string | null> {
      if (!name) return null;
      const key = name.toLowerCase();
      const cached = vendorByName.get(key);
      if (cached) return cached;
      const { data, error } = await supabase
        .from('vendors')
        .insert({ workspace_id: workspaceId, name })
        .select('id')
        .single();
      if (error) throw error;
      vendorByName.set(key, data.id);
      createdVendors++;
      return data.id;
    }

    async function resolveProject(name: string): Promise<string | null> {
      if (!name) return null;
      const key = name.toLowerCase();
      const cached = projectByName.get(key);
      if (cached) return cached;
      const { data, error } = await supabase
        .from('projects')
        .insert({ workspace_id: workspaceId, name, type: 'general' })
        .select('id')
        .single();
      if (error) throw error;
      projectByName.set(key, data.id);
      createdProjects++;
      return data.id;
    }

    const bulkRows: BulkExpenseRow[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      const [categoryId, vendorId, projectId] = await Promise.all([
        resolveCategory(row.categoria),
        resolveVendor(row.vendor),
        resolveProject(row.proyecto),
      ]);
      bulkRows.push({
        rowNumber: i + 2,
        expense: {
          workspaceId,
          projectId,
          categoryId,
          vendorId,
          amount: row.monto,
          currency: row.moneda,
          fxRateHint: row.fx_rate,
          paidAt: row.fecha,
          description: row.descripcion || undefined,
          notes: row.nota || undefined,
        },
      });
    }

    const bulk = await createExpenseRecordsBulk(
      supabase,
      bulkRows,
      guard.user.id,
      EXPENSE_BULK_INSERT_CHUNK,
    );

    revalidateTag(`workspace:${workspaceId}:expenses`);
    revalidatePath('/expenses');
    revalidatePath('/dashboard');
    revalidatePath('/projects');

    return actionOk({
      importedCount: bulk.imported,
      failedCount: bulk.errors.length,
      createdCategories,
      createdVendors,
      createdProjects,
      errors: bulk.errors.map((e) => ({ row: e.rowNumber, reason: e.reason })),
    });
  } catch (error) {
    logger.error('import.importRows', { error });
    return actionError('unknown');
  }
}
