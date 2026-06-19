import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Coins, Users, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CostoMark } from '@/components/brand/costo-logo';

/**
 * Linear-language marketing landing: dark canvas, indigo accent, a sticky
 * translucent nav, a centered hero with a product mock, and a three-up feature
 * row. Server component — fully static, no client JS. Wrapped in `.theme-linear`
 * so it borrows Linear's tokens without affecting the authenticated app.
 */
export async function Landing() {
  const t = await getTranslations('landing');

  const features = [
    { icon: Coins, title: t('feature1Title'), body: t('feature1Body') },
    { icon: Users, title: t('feature2Title'), body: t('feature2Body') },
    { icon: FileSpreadsheet, title: t('feature3Title'), body: t('feature3Body') },
  ] as const;

  return (
    <div className="theme-linear min-h-svh bg-background text-foreground antialiased">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="costo">
            <CostoMark className="size-6 text-primary" />
            <span className="text-[18px] [font-weight:590] tracking-[-0.02em]">costo</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">{t('navLogin')}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">{t('navSignup')}</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="relative overflow-hidden">
        {/* Indigo aurora glow behind the hero */}
        <div
          className="pointer-events-none absolute inset-x-0 top-[-10%] mx-auto h-[480px] max-w-3xl rounded-full bg-primary/20 blur-[120px]"
          aria-hidden
        />

        <section className="relative mx-auto max-w-3xl px-6 pt-20 text-center sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            {t('eyebrow')}
          </span>
          <h1 className="mt-6 text-balance text-[40px] leading-[1.08] tracking-[-0.03em] [font-weight:590] sm:text-[56px]">
            {t('heroTitle')}{' '}
            <span className="text-primary">{t('heroTitleAccent')}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-[17px] leading-relaxed text-muted-foreground">
            {t('heroSubtitle')}
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild>
              <Link href="/signup">
                {t('ctaPrimary')}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/login">{t('ctaSecondary')}</Link>
            </Button>
          </div>
        </section>

        {/* Product mock */}
        <section className="relative mx-auto mt-16 max-w-4xl px-6 sm:mt-20">
          <ProductMock t={t} />
        </section>

        {/* Features */}
        <section className="mx-auto mt-24 max-w-5xl px-6 pb-28 sm:mt-32">
          <p className="text-center text-sm [font-weight:510] text-primary">
            {t('featuresEyebrow')}
          </p>
          <h2 className="mt-2 text-center text-[28px] tracking-[-0.02em] [font-weight:590] sm:text-[34px]">
            {t('featuresTitle')}
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-border/80"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <h3 className="mt-4 text-[17px] [font-weight:590] tracking-[-0.01em]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <span className="inline-flex items-center gap-2">
            <CostoMark className="size-5 text-muted-foreground" />
            costo
          </span>
          <span className="text-xs">{t('footerLegal')}</span>
        </div>
      </footer>
    </div>
  );
}

type TFn = Awaited<ReturnType<typeof getTranslations>>;

/** Static dashboard mock evoking the real product (no live data). */
function ProductMock({ t }: { t: TFn }) {
  const rows = [
    { label: t('mockCat1'), pct: 64, amount: '$ 482.000', cur: 'ARS', color: 'bg-primary' },
    { label: t('mockCat2'), pct: 41, amount: '$ 1.240', cur: 'USD', color: 'bg-chart-3' },
    { label: t('mockCat3'), pct: 22, amount: '$ 96.500', cur: 'ARS', color: 'bg-chart-2' },
  ] as const;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <span className="text-sm [font-weight:590]">{t('mockHeader')}</span>
        <span className="text-xs text-muted-foreground">ARS · USD</span>
      </div>
      <div className="grid gap-5 p-6 sm:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2 text-foreground">
                  <span className={`size-2 rounded-full ${r.color}`} aria-hidden />
                  {r.label}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {r.amount} <span className="text-xs">{r.cur}</span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-center rounded-xl border border-border bg-background/60 p-5 text-center">
          <span className="text-xs text-muted-foreground">{t('mockTotal')}</span>
          <span className="mt-1 text-[28px] [font-weight:590] tracking-[-0.02em] tabular-nums">
            $ 578.500
          </span>
          <span className="mt-1 text-xs text-muted-foreground">ARS</span>
        </div>
      </div>
    </div>
  );
}
