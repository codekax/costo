import { describe, expect, it } from 'vitest';
import { validateRow } from '@/services/excel/parse-template';

describe('validateRow', () => {
  it('parses a valid ARS row', () => {
    const r = validateRow(
      {
        fecha: '2026-04-15',
        proyecto: 'Expansión',
        categoria: 'Materiales',
        vendor: 'Corralón',
        descripcion: 'Cemento',
        moneda: 'ARS',
        monto: 45000,
        fx_rate: '',
        nota: '',
      },
      2,
    );
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.parsed.moneda).toBe('ARS');
      expect(r.parsed.monto).toBe(45000);
    }
  });

  it('rejects invalid fecha', () => {
    const r = validateRow(
      {
        fecha: 'not-a-date',
        categoria: 'X',
        moneda: 'ARS',
        monto: 100,
      },
      2,
    );
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.errors).toContain('fecha_invalid');
  });

  it('rejects monto <= 0', () => {
    const r = validateRow(
      {
        fecha: '2026-01-01',
        categoria: 'X',
        moneda: 'ARS',
        monto: 0,
      },
      2,
    );
    expect(r.valid).toBe(false);
  });

  it('rejects unknown moneda', () => {
    const r = validateRow(
      {
        fecha: '2026-01-01',
        categoria: 'X',
        moneda: 'EUR',
        monto: 100,
      },
      2,
    );
    expect(r.valid).toBe(false);
  });

  it('parses USD with fx_rate', () => {
    const r = validateRow(
      {
        fecha: '2026-04-16',
        categoria: 'Mano de obra',
        moneda: 'USD',
        monto: 200,
        fx_rate: 1050,
      },
      3,
    );
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.parsed.fx_rate).toBe(1050);
  });

  it('accepts USD without fx_rate (resolved at import time)', () => {
    const r = validateRow(
      {
        fecha: '2026-04-16',
        categoria: 'X',
        moneda: 'USD',
        monto: 200,
      },
      3,
    );
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.parsed.fx_rate).toBeUndefined();
  });

  it('handles missing categoria', () => {
    const r = validateRow(
      {
        fecha: '2026-01-01',
        categoria: '',
        moneda: 'ARS',
        monto: 100,
      },
      2,
    );
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.errors).toContain('categoria_required');
  });

  it('parses Excel serial date numbers', () => {
    // Excel serial 45748 ≈ 2025-04-15
    const r = validateRow(
      {
        fecha: 45748,
        categoria: 'X',
        moneda: 'ARS',
        monto: 1,
      },
      2,
    );
    expect(r.valid).toBe(true);
  });

  it('parses Date objects', () => {
    const r = validateRow(
      {
        fecha: new Date(2026, 3, 15),
        categoria: 'X',
        moneda: 'ARS',
        monto: 1,
      },
      2,
    );
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.parsed.fecha).toBe('2026-04-15');
  });
});
