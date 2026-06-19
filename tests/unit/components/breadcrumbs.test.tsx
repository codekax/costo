import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import esMessages from '@/i18n/messages/es.json';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';

let mockPathname = '/es/dashboard';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

vi.mock('next-intl', () => ({
  useTranslations: (ns: 'breadcrumbs') => (key: string) =>
    (esMessages[ns] as Record<string, string>)[key] ?? key,
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

function renderAt(pathname: string) {
  mockPathname = pathname;
  return render(<Breadcrumbs />);
}

describe('Breadcrumbs', () => {
  it('renders nothing on a top-level page (avoids duplicating the h1)', () => {
    const { container } = renderAt('/es/dashboard');
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('Inicio')).toBeNull();
  });

  it('builds a settings → profile trail without duplicate React keys', () => {
    // `/settings` has no page of its own so its href is rewritten to
    // `/settings/profile` — same as the child's href. Keying on href would
    // collide and make React reuse a stale crumb (the "Ajustes Inicio" bug).
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderAt('/es/settings/profile');
    expect(screen.getByText('Ajustes')).toBeTruthy();
    expect(screen.getByText('Perfil')).toBeTruthy();
    expect(screen.queryByText('Inicio')).toBeNull();
    expect(errorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('same key'),
      expect.anything(),
      expect.anything(),
    );
    errorSpy.mockRestore();
  });

  it('falls back to "Detalle" for dynamic id segments', () => {
    renderAt('/es/expenses/abc-123');
    expect(screen.getByText('Gastos')).toBeTruthy();
    expect(screen.getByText('Detalle')).toBeTruthy();
  });

  it('handles the default locale without a prefix', () => {
    // 2 segments after no locale prefix → trail shows
    renderAt('/settings/profile');
    expect(screen.getByText('Ajustes')).toBeTruthy();
    expect(screen.getByText('Perfil')).toBeTruthy();
  });
});
