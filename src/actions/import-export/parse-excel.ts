'use server';

import { z } from 'zod';
import { parseExcelBuffer, validateRow, type ParsedRow } from '@/services/excel/parse-template';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';
import { requireWorkspaceMember } from '@/actions/_workspace-guard';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_ROWS = 5000;

const InputSchema = z.object({
  workspaceId: z.string().uuid(),
  fileBase64: z.string().min(1),
});

export type ParseExcelOk = {
  rows: ParsedRow[];
  summary: { total: number; valid: number; invalid: number };
  missingColumns: string[];
};

export async function parseExcel(input: unknown): Promise<ActionResult<ParseExcelOk>> {
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) return actionError('invalid_input');

  const guard = await requireWorkspaceMember(parsed.data.workspaceId);
  if (!guard.ok) return guard.error;

  try {
    const buffer = Buffer.from(parsed.data.fileBase64, 'base64');
    if (buffer.byteLength > MAX_BYTES) return actionError('invalid_input');

    const { rows, missingColumns } = parseExcelBuffer(
      buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    );

    if (missingColumns.length > 0) {
      return actionOk({
        rows: [],
        summary: { total: 0, valid: 0, invalid: 0 },
        missingColumns,
      });
    }

    if (rows.length > MAX_ROWS) return actionError('invalid_input');

    const parsedRows = rows.map((r, i) => validateRow(r, i + 2)); // +2 = header is row 1
    const valid = parsedRows.filter((r) => r.valid).length;

    return actionOk({
      rows: parsedRows,
      summary: { total: parsedRows.length, valid, invalid: parsedRows.length - valid },
      missingColumns: [],
    });
  } catch (error) {
    logger.error('import.parseExcel', { error });
    return actionError('unknown');
  }
}
