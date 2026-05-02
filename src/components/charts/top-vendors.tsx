import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/utils/format';
import type { VendorBreakdown } from '@/lib/db/queries/dashboard';

export function TopVendors({ data }: { data: VendorBreakdown[] }) {
  const t = useTranslations('dashboard');
  const tProjects = useTranslations('projects');
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('vendorsEmpty')}
      </p>
    );
  }

  const max = Math.max(...data.map((v) => v.ars + v.usd * 1000));

  return (
    <ul className="space-y-3">
      {data.map((v) => {
        const weight = v.ars + v.usd * 1000;
        const widthPct = max > 0 ? (weight / max) * 100 : 0;
        return (
          <li key={v.id}>
            <Link
              href={`/expenses?vendor=${v.id}`}
              className="block rounded-md p-3 transition-colors hover:bg-foreground/5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm [font-weight:500] tracking-[-0.32px]">{v.name}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {tProjects('expensesCount', { count: v.count })}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs tabular-nums text-muted-foreground">
                {v.ars > 0 && <span>{formatCurrency(v.ars, 'ARS')}</span>}
                {v.usd > 0 && <span>{formatCurrency(v.usd, 'USD')}</span>}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
