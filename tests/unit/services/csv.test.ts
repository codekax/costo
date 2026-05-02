import { describe, expect, it } from 'vitest';
import { escapeCsvField, rowsToCsv } from '@/services/csv/escape-rfc4180';

describe('escapeCsvField', () => {
  it('returns plain values unchanged', () => {
    expect(escapeCsvField('hola')).toBe('hola');
    expect(escapeCsvField(123)).toBe('123');
  });

  it('wraps values containing commas in quotes', () => {
    expect(escapeCsvField('a,b')).toBe('"a,b"');
  });

  it('escapes embedded double quotes', () => {
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
  });

  it('wraps newlines', () => {
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
    expect(escapeCsvField('line1\r\nline2')).toBe('"line1\r\nline2"');
  });

  it('handles null/undefined as empty string', () => {
    expect(escapeCsvField(null)).toBe('');
    expect(escapeCsvField(undefined)).toBe('');
  });
});

describe('rowsToCsv', () => {
  it('formats a header line and rows', () => {
    const csv = rowsToCsv(
      [
        { name: 'Cemento', amount: 45000, note: 'a, b' },
        { name: 'Pintura "blanca"', amount: 12000, note: '' },
      ],
      [
        { key: 'name', label: 'Nombre' },
        { key: 'amount', label: 'Monto' },
        { key: 'note', label: 'Nota' },
      ],
    );
    expect(csv).toBe(
      'Nombre,Monto,Nota\r\n' +
        'Cemento,45000,"a, b"\r\n' +
        '"Pintura ""blanca""",12000,',
    );
  });
});
