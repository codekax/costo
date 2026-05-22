import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { formatCurrency } from '@/utils/format';
import type { VendorBreakdown } from '@/lib/db/queries/dashboard';

/**
 * Top vendors ranking — purely HTML, no chart library involved.
 *
 * Each row carries a rank dot, the vendor name, the expense count and two
 * stacked hairline bars: one for ARS, one for USD. Each bar's width is
 * normalised against the per-currency maximum in the dataset, which is
 * faithful to the magnitude inside each currency without forcing a fake
 * FX coefficient like the previous `ars + usd*1000` weighting did.
 */
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

  const maxArs = Math.max(...data.map((v) => v.ars), 0);
  const maxUsd = Math.max(...data.map((v) => v.usd), 0);

  return (
    <ol className="space-y-1">
      {data.map((v, idx) => {
        const arsWidth = maxArs > 0 ? (v.ars / maxArs) * 100 : 0;
        const usdWidth = maxUsd > 0 ? (v.usd / maxUsd) * 100 : 0;
        return (
          <li key={v.id}>
            <Link
              href={`/expenses?vendor=${v.id}`}
              className="group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-foreground/[0.03]"
            >
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs tabular-nums [font-weight:500] text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                aria-hidden
              >
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm [font-weight:500] tracking-[-0.32px]">
                    {v.name}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {tProjects('expensesCount', { count: v.count })}
                  </span>
                </div>
                {v.ars > 0 && (
                  <Bar
                    label="ARS"
                    amount={formatCurrency(v.ars, 'ARS')}
                    widthPct={arsWidth}
                    colorVar="--chart-1"
                  />
                )}
                {v.usd > 0 && (
                  <Bar
                    label="USD"
                    amount={formatCurrency(v.usd, 'USD')}
                    widthPct={usdWidth}
                    colorVar="--chart-2"
                  />
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function Bar({
  label,
  amount,
  widthPct,
  colorVar,
}: {
  label: 'ARS' | 'USD';
  amount: string;
  widthPct: number;
  colorVar: '--chart-1' | '--chart-2';
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-baseline justify-between gap-2 text-[11px]">
        <span className="uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="tabular-nums text-foreground">{amount}</span>
      </div>
      <div className="h-[3px] overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(2, widthPct)}%`,
            backgroundColor: `var(${colorVar})`,
          }}
        />
      </div>
    </div>
  );
}
