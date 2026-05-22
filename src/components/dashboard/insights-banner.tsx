import { Lightbulb } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Card, CardContent } from '@/components/ui/card';
import type {
  CategoryBreakdown,
  Forecast,
  VendorBreakdown,
  WorkspaceTotals,
} from '@/lib/db/queries/dashboard';
import { formatCurrency } from '@/utils/format';

type Insight = { kind: 'category-jump' | 'vendor-concentration' | 'forecast'; text: string };

/**
 * Rule-based insights. No AI involved — purely derivations on the data the
 * dashboard query already produced. We pick at most 3 insights, ranked by
 * impact (% delta or concentration ratio), so the banner stays readable on a
 * phone.
 */
export async function InsightsBanner({
  byCategory,
  topVendors,
  totals,
  forecast,
}: {
  byCategory: CategoryBreakdown[];
  topVendors: VendorBreakdown[];
  totals: WorkspaceTotals;
  forecast: Forecast;
}) {
  const t = await getTranslations('dashboard.insights');
  const insights: Insight[] = [];

  // 1) Category growth — top category by % delta (ARS combined w/ USD via
  //    summing absolute amounts; on a renovation workload ARS dominates so
  //    that is acceptable, but we guard against divide-by-zero).
  const growthRanked = byCategory
    .map((c) => {
      const cur = c.ars + c.usd;
      const prev = c.prevArs + c.prevUsd;
      if (prev <= 0 || cur <= prev) return null;
      const pct = ((cur - prev) / prev) * 100;
      return { c, pct, cur };
    })
    .filter((x): x is { c: CategoryBreakdown; pct: number; cur: number } => x !== null)
    .sort((a, b) => b.pct - a.pct);
  const grower = growthRanked[0];
  if (grower && grower.pct >= 20) {
    insights.push({
      kind: 'category-jump',
      text: t('categoryJump', { name: grower.c.name, pct: Math.round(grower.pct) }),
    });
  }

  // 2) Vendor concentration — if the top vendor represents >40% of total
  //    period spend (combined ARS+USD again, same caveat).
  const totalSpend = totals.ars + totals.usd;
  const topVendor = topVendors[0];
  if (topVendor && totalSpend > 0) {
    const share = ((topVendor.ars + topVendor.usd) / totalSpend) * 100;
    if (share >= 40) {
      insights.push({
        kind: 'vendor-concentration',
        text: t('vendorConcentration', {
          name: topVendor.name,
          pct: Math.round(share),
        }),
      });
    }
  }

  // 3) Forecast — projected end-of-month spend (ARS only — the more common
  //    currency for the daily flow; USD usually maps to large milestone
  //    purchases that don't track MTD well).
  if (
    forecast.daysElapsed > 2 &&
    forecast.daysElapsed < forecast.daysInMonth - 1 &&
    forecast.mtdArs > 0
  ) {
    insights.push({
      kind: 'forecast',
      text: t('forecast', {
        projected: formatCurrency(forecast.projectedArs, 'ARS'),
      }),
    });
  }

  if (insights.length === 0) return null;

  return (
    <Card className="border-accent/20 bg-accent/5">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <span
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"
          aria-hidden
        >
          <Lightbulb className="size-4" />
        </span>
        <div className="space-y-1.5">
          <p className="eyebrow !text-accent">{t('title')}</p>
          <ul className="space-y-1 text-sm [font-weight:450]">
            {insights.slice(0, 3).map((ins, idx) => (
              <li key={idx}>{ins.text}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
