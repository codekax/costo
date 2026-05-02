'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const OPTIONS = [
  { value: 'light' as const, icon: Sun, labelKey: 'themeLight' as const },
  { value: 'dark' as const, icon: Moon, labelKey: 'themeDark' as const },
  { value: 'system' as const, icon: Monitor, labelKey: 'themeSystem' as const },
];

export function ThemeToggle() {
  const t = useTranslations('settings');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes returns undefined on server — wait until client to render the active state
  useEffect(() => setMounted(true), []);

  return (
    <div
      role="radiogroup"
      aria-label={t('themeAria')}
      className="inline-flex rounded-md border border-border bg-muted/40 p-1"
    >
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = mounted && theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(opt.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm transition-colors',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-4" />
            <span>{t(opt.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
