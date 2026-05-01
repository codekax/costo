import { describe, expect, it } from 'vitest';
import { computeAmounts } from '@/services/fx/snapshot-fx';

describe('computeAmounts', () => {
  it('ARS amount keeps amountArs unchanged and computes amountUsd', () => {
    const r = computeAmounts({ amount: 1050, currency: 'ARS', fxRate: 1050 });
    expect(r.amountArs).toBe(1050);
    expect(r.amountUsd).toBe(1);
  });

  it('USD amount keeps amountUsd unchanged and computes amountArs', () => {
    const r = computeAmounts({ amount: 200, currency: 'USD', fxRate: 1050 });
    expect(r.amountUsd).toBe(200);
    expect(r.amountArs).toBe(210000);
  });

  it('rounds to 2 decimals', () => {
    const r = computeAmounts({ amount: 100, currency: 'ARS', fxRate: 333 });
    expect(r.amountUsd).toBe(0.3);
  });

  it('handles small ARS / non-trivial fx rate', () => {
    const r = computeAmounts({ amount: 12345.67, currency: 'ARS', fxRate: 1234.567 });
    expect(r.amountArs).toBe(12345.67);
    expect(r.amountUsd).toBe(10);
  });

  it('rejects zero amount', () => {
    expect(() => computeAmounts({ amount: 0, currency: 'ARS', fxRate: 1000 })).toThrow();
  });

  it('rejects negative fx rate', () => {
    expect(() => computeAmounts({ amount: 100, currency: 'USD', fxRate: -1 })).toThrow();
  });

  it('rejects non-finite values', () => {
    expect(() =>
      computeAmounts({ amount: Number.POSITIVE_INFINITY, currency: 'USD', fxRate: 1000 }),
    ).toThrow();
  });
});
