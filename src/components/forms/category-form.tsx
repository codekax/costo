'use client';

import { Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eyebrow } from '@/components/ui/editorial';
import { CreateCategorySchema } from '@/lib/schemas/category';
import { createCategory } from '@/actions/categories/create-category';
import { updateCategory } from '@/actions/categories/update-category';
import { CATEGORY_COLORS, CATEGORY_ICON_LIST, getCategoryIcon } from '@/lib/category-icons';
import { useServerAction } from '@/hooks/use-server-action';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/domain';

type Values = z.input<typeof CreateCategorySchema>;

/**
 * Decide foreground for a swatch background using YIQ contrast.
 * Used so the check mark inside the selected color stays legible on both
 * light (#eab308) and dark (#1b1938) hues.
 */
function isLightColor(hex: string): boolean {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq > 160;
}

export function CategoryForm({
  workspaceId,
  category,
  onDone,
}: {
  workspaceId: string;
  category?: Category;
  onDone?: () => void;
}) {
  const t = useTranslations('toasts');
  const tCommon = useTranslations('common');
  const tCategories = useTranslations('categories');
  const isEdit = Boolean(category);

  const form = useForm<Values>({
    resolver: zodResolver(CreateCategorySchema),
    defaultValues: {
      workspaceId,
      name: category?.name ?? '',
      color: category?.color ?? CATEGORY_COLORS[0],
      icon: category?.icon ?? 'folder',
    },
  });

  const submit = useServerAction<Values, unknown>(
    isEdit
      ? (values) => updateCategory({ id: category!.id, ...values })
      : createCategory,
    {
      successMessage: t(isEdit ? 'categoryUpdated' : 'categoryCreated'),
      onSuccess: onDone,
    },
  );

  const color = form.watch('color');
  const icon = form.watch('icon');
  const PreviewIcon = getCategoryIcon(icon);

  return (
    <form onSubmit={form.handleSubmit(submit.run)} className="space-y-6">
      {/* Live preview portrait — Mastercard circular portrait gesture, reflects
          the current color + icon combo so the user sees the result before save. */}
      <div className="flex flex-col items-center gap-2 pt-2">
        <div
          className="flex size-20 items-center justify-center rounded-full transition-colors"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          <PreviewIcon className="size-9" strokeWidth={1.75} />
        </div>
        <p className="text-xs text-muted-foreground [font-weight:400]">
          {form.watch('name') || tCategories('namePlaceholder')}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{tCategories('name')}</Label>
        <Input id="name" placeholder={tCategories('namePlaceholder')} {...form.register('name')} />
      </div>

      {/* COLOR — bigger swatches, full pill, selected has check + ring offset */}
      <div className="space-y-3">
        <Eyebrow>{tCategories('color')}</Eyebrow>
        <div className="flex flex-wrap gap-2.5">
          {CATEGORY_COLORS.map((c) => {
            const selected = color === c;
            const lightBg = isLightColor(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => form.setValue('color', c, { shouldDirty: true })}
                className={cn(
                  'group/swatch relative flex size-10 items-center justify-center rounded-full transition-all',
                  'hover:scale-110 active:scale-95',
                  selected && 'ring-2 ring-offset-2 ring-offset-card scale-110',
                )}
                style={{
                  backgroundColor: c,
                  ['--tw-ring-color' as string]: c,
                }}
                aria-label={`Color ${c}`}
                aria-pressed={selected}
              >
                {selected ? (
                  <Check
                    className="size-5"
                    strokeWidth={3}
                    color={lightBg ? '#141413' : '#ffffff'}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* ICON — selected uses the chosen color tint so both choices read together */}
      <div className="space-y-3">
        <Eyebrow>{tCategories('icon')}</Eyebrow>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-9">
          {CATEGORY_ICON_LIST.map((iconName) => {
            const Icon = getCategoryIcon(iconName);
            const selected = icon === iconName;
            return (
              <button
                key={iconName}
                type="button"
                onClick={() => form.setValue('icon', iconName, { shouldDirty: true })}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-md border transition-all',
                  'hover:bg-foreground/[0.04] hover:border-foreground/20',
                  selected
                    ? 'border-transparent shadow-sm'
                    : 'border-border text-muted-foreground',
                )}
                style={
                  selected
                    ? {
                        backgroundColor: `${color}1a`,
                        color,
                        boxShadow: `inset 0 0 0 1.5px ${color}`,
                      }
                    : undefined
                }
                aria-label={iconName}
                aria-pressed={selected}
              >
                <Icon className="size-4" strokeWidth={selected ? 2 : 1.75} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone}>
            {tCommon('cancel')}
          </Button>
        )}
        <Button type="submit" disabled={submit.pending}>
          {submit.pending ? '…' : isEdit ? tCommon('save') : tCommon('create')}
        </Button>
      </div>
    </form>
  );
}
