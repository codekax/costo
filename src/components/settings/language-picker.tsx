'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { useRouter, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';
import { updateProfile } from '@/actions/auth/update-profile';

const OPTIONS: { value: Locale; label: string; flag: string }[] = [
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
];

/**
 * iOS-style segmented control for app language. Two equal-width slots in
 * mobile (full-width container), auto-width on sm+. Switches the route
 * locale via next-intl and refreshes the server tree so the new strings
 * (and stored user metadata) load immediately.
 */
export function LanguagePicker() {
  const t = useTranslations('language');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function onSelect(next: Locale) {
    if (next === locale || pending) return;
    startTransition(async () => {
      // Persist the preference in user_metadata so future sessions land in
      // the right locale, then switch the URL and refresh the server tree.
      await updateProfile({ locale: next });
      router.replace(pathname, { locale: next });
      router.refresh();
    });
  }

  return (
    <div
      role="radiogroup"
      aria-label={t('switchLabel')}
      className="grid w-full grid-cols-2 gap-1 rounded-2xl bg-muted p-1 sm:inline-flex sm:w-auto"
    >
      {OPTIONS.map((opt) => {
        const active = locale === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(opt.value)}
            disabled={pending}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-[13px] [font-weight:510] transition-colors sm:py-1.5',
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
              'disabled:opacity-60',
            )}
          >
            <span aria-hidden>{opt.flag}</span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
