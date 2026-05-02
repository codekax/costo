import * as XLSX from 'xlsx';
import { ExcelRowSchema, type ExcelRow } from '@/lib/schemas/excel-row';

export const REQUIRED_COLUMNS = [
  'fecha',
  'proyecto',
  'categoria',
  'vendor',
  'descripcion',
  'moneda',
  'monto',
  'fx_rate',
  'nota',
] as const;

export type RawRow = Record<string, unknown>;

export type ParsedRowOk = {
  rowNumber: number;
  raw: RawRow;
  valid: true;
  parsed: ExcelRow;
  errors: never[];
};

export type ParsedRowError = {
  rowNumber: number;
  raw: RawRow;
  valid: false;
  parsed?: never;
  errors: string[];
};

export type ParsedRow = ParsedRowOk | ParsedRowError;

export function parseExcelBuffer(buffer: ArrayBuffer): {
  rows: RawRow[];
  missingColumns: string[];
} {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return { rows: [], missingColumns: [...REQUIRED_COLUMNS] };

  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) return { rows: [], missingColumns: [...REQUIRED_COLUMNS] };

  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, {
    raw: true,
    defval: '',
  });

  const headers = new Set(Object.keys(rows[0] ?? {}).map((k) => k.toLowerCase().trim()));
  const missingColumns = REQUIRED_COLUMNS.filter((c) => !headers.has(c));

  return { rows, missingColumns };
}

export function validateRow(raw: RawRow, rowNumber: number): ParsedRow {
  const normalized: Record<string, unknown> = {};
  for (const key of Object.keys(raw)) {
    normalized[key.toLowerCase().trim()] = raw[key];
  }

  const errors: string[] = [];

  // fecha — accept Date, ISO string, or YYYY-MM-DD
  let fecha = '';
  const rawFecha = normalized.fecha;
  if (rawFecha instanceof Date) {
    fecha = toIsoDate(rawFecha);
  } else if (typeof rawFecha === 'string') {
    const trimmed = rawFecha.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      fecha = trimmed;
    } else {
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) fecha = toIsoDate(parsed);
      else errors.push('fecha_invalid');
    }
  } else if (typeof rawFecha === 'number') {
    // Excel serial date
    const parsed = XLSX.SSF.parse_date_code(rawFecha);
    if (parsed) {
      fecha = `${pad(parsed.y)}-${pad2(parsed.m)}-${pad2(parsed.d)}`;
    } else {
      errors.push('fecha_invalid');
    }
  } else {
    errors.push('fecha_required');
  }

  // moneda
  const monedaRaw = String(normalized.moneda ?? '')
    .trim()
    .toUpperCase();
  const moneda = monedaRaw === 'ARS' || monedaRaw === 'USD' ? monedaRaw : null;
  if (!moneda) errors.push('moneda_invalid');

  // monto
  const montoRaw = normalized.monto;
  let monto = NaN;
  if (typeof montoRaw === 'number') monto = montoRaw;
  else if (typeof montoRaw === 'string' && montoRaw.trim() !== '') {
    monto = Number(montoRaw.trim().replace(/\./g, '').replace(',', '.'));
  }
  if (!Number.isFinite(monto) || monto <= 0) errors.push('monto_invalid');

  // fx_rate (optional unless USD without daily rate — resolved at import time)
  const fxRaw = normalized.fx_rate;
  let fx: number | undefined;
  if (typeof fxRaw === 'number' && fxRaw > 0) fx = fxRaw;
  else if (typeof fxRaw === 'string' && fxRaw.trim() !== '') {
    const n = Number(fxRaw.trim().replace(/\./g, '').replace(',', '.'));
    if (Number.isFinite(n) && n > 0) fx = n;
    else errors.push('fx_rate_invalid');
  }

  // categoria required, others optional
  const categoria = String(normalized.categoria ?? '').trim();
  if (!categoria) errors.push('categoria_required');

  if (errors.length > 0) {
    return { rowNumber, raw, valid: false, errors };
  }

  const candidate = {
    fecha,
    proyecto: String(normalized.proyecto ?? '').trim(),
    categoria,
    vendor: String(normalized.vendor ?? '').trim(),
    descripcion: String(normalized.descripcion ?? '').trim(),
    moneda: moneda!,
    monto,
    fx_rate: fx,
    nota: String(normalized.nota ?? '').trim(),
  };

  const result = ExcelRowSchema.safeParse(candidate);
  if (!result.success) {
    return {
      rowNumber,
      raw,
      valid: false,
      errors: result.error.issues.map((i) => i.message || 'invalid'),
    };
  }

  return { rowNumber, raw, valid: true, parsed: result.data, errors: [] };
}

function pad(n: number): string {
  return String(n).padStart(4, '0');
}
function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
function toIsoDate(d: Date): string {
  return `${pad(d.getFullYear())}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
