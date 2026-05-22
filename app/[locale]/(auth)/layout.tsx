import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Check } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import { Eyebrow, GhostWatermark } from '@/components/ui/mastercard';

/**
 * Mastercard-language auth shell:
 *  - Editorial 2-column layout on desktop: ghost-watermark + eyebrow + tagline left,
 *    form card right (paper laid on paper)
 *  - On mobile: just the form, centered on canvas
 */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect('/dashboard');

  const t = await getTranslations('authHero');

  return (
    <main className="relative grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <Eyebrow>{t('brand')}</Eyebrow>
        <div className="space-y-6">
          <GhostWatermark className="!text-[clamp(72px,9vw,160px)]">
            {t('watermark')}
          </GhostWatermark>
          <h2 className="max-w-md text-[44px] leading-[1.05] tracking-[-0.88px] [font-weight:500]">
            {t('headline')}
          </h2>
          <p className="max-w-md text-base text-muted-foreground [font-weight:450]">
            {t('subhead')}
          </p>
          <ul className="max-w-md space-y-2.5 pt-2">
            {(['feature1', 'feature2', 'feature3'] as const).map((key) => (
              <li key={key} className="flex items-start gap-3 text-sm [font-weight:450] text-foreground">
                <span
                  className="mt-[2px] inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"
                  aria-hidden
                >
                  <Check className="size-3" strokeWidth={2.5} />
                </span>
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-sm text-muted-foreground [font-weight:450]">{t('footer')}</div>
      </section>

      <section className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
