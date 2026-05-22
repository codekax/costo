'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

const OPTIONS: { value: 'light' | 'dark' | 'system'; icon: LucideIcon; labelKey: 'themeLight' | 'themeDark' | 'themeSystem' }[] = [
  { value: 'light', icon: Sun, labelKey: 'themeLight' },
  { value: 'dark', icon: Moon, labelKey: 'themeDark' },
  { value: 'system', icon: Monitor, labelKey: 'themeSystem' },
];

/**
 * iOS-style segmented control for theme. Three equal-width slots on mobile
 * (full-width container), inline-flex auto-width on sm+. Active option gets
 * an elevated white pill (light) or muted (dark) — the canonical Apple
 * segmented control treatment.
 */
export function ThemeToggle() {
  const t = useTranslations('settings');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div
      role="radiogroup"
      aria-label={t('themeAria')}
      className="grid w-full grid-cols-3 gap-1 rounded-2xl bg-muted p-1 sm:inline-flex sm:w-auto"
    >
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = mounted && (theme ?? 'system') === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(opt.value)}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[13px] [font-weight:500] transition-colors sm:py-1.5',
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-4" strokeWidth={active ? 2.25 : 1.75} />
            <span>{t(opt.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
