/* eslint-disable no-console */
/**
 * Generates public/templates/expense-import-template.xlsx with the 9 columns
 * required by the import flow. Run with:
 *   pnpm tsx scripts/generate-excel-template.ts
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import * as XLSX from 'xlsx';

const HEADER_ROW = [
  'fecha',
  'proyecto',
  'categoria',
  'vendor',
  'descripcion',
  'moneda',
  'monto',
  'fx_rate',
  'nota',
];

const EXAMPLE_ROW = [
  '2026-04-15',
  'Expansión casa',
  'Materiales',
  'Corralón Norte',
  'Cemento x 10 bolsas',
  'ARS',
  45000,
  '',
  '',
];

const USD_EXAMPLE_ROW = [
  '2026-04-16',
  'Expansión casa',
  'Mano de obra',
  'Albañil Juan',
  'Semana 1',
  'USD',
  200,
  1050,
  'adelanto',
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([HEADER_ROW, EXAMPLE_ROW, USD_EXAMPLE_ROW]);

// Column widths for readability
ws['!cols'] = [
  { wch: 12 }, // fecha
  { wch: 22 }, // proyecto
  { wch: 18 }, // categoria
  { wch: 20 }, // vendor
  { wch: 32 }, // descripcion
  { wch: 8 }, // moneda
  { wch: 12 }, // monto
  { wch: 10 }, // fx_rate
  { wch: 24 }, // nota
];

XLSX.utils.book_append_sheet(wb, ws, 'gastos');

const outDir = resolve(process.cwd(), 'public/templates');
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, 'expense-import-template.xlsx');

const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
writeFileSync(outPath, buffer as unknown as Uint8Array);

console.log(`✓ Template written to ${outPath}`);
