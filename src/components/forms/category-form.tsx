'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreateCategorySchema } from '@/lib/schemas/category';
import { createCategory } from '@/actions/categories/create-category';
import { updateCategory } from '@/actions/categories/update-category';
import { CATEGORY_COLORS, CATEGORY_ICON_LIST, getCategoryIcon } from '@/lib/category-icons';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/domain';

type Values = z.input<typeof CreateCategorySchema>;

export function CategoryForm({
  workspaceId,
  category,
  onDone,
}: {
  workspaceId: string;
  category?: Category;
  onDone?: () => void;
}) {
  const tErrors = useTranslations('errors');
  const [pending, startTransition] = useTransition();

  const form = useForm<Values>({
    resolver: zodResolver(CreateCategorySchema),
    defaultValues: {
      workspaceId,
      name: category?.name ?? '',
      color: category?.color ?? CATEGORY_COLORS[0]!,
      icon: category?.icon ?? 'folder',
    },
  });

  const color = form.watch('color');
  const icon = form.watch('icon');

  function onSubmit(values: Values) {
    startTransition(async () => {
      const result = category
        ? await updateCategory({ id: category.id, ...values })
        : await createCategory(values);

      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success(category ? 'Categoría actualizada' : 'Categoría creada');
      onDone?.();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" placeholder="Permisos municipales" {...form.register('name')} />
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => form.setValue('color', c)}
              className={cn(
                'size-8 rounded-full ring-offset-2 transition-all',
                color === c && 'ring-2 ring-offset-background',
              )}
              style={{ backgroundColor: c, ['--tw-ring-color' as string]: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Ícono</Label>
        <div className="grid grid-cols-9 gap-2">
          {CATEGORY_ICON_LIST.map((iconName) => {
            const Icon = getCategoryIcon(iconName);
            return (
              <button
                key={iconName}
                type="button"
                onClick={() => form.setValue('icon', iconName)}
                className={cn(
                  'flex size-9 items-center justify-center rounded-md border transition-colors',
                  icon === iconName ? 'border-primary bg-primary/10' : 'hover:bg-accent',
                )}
                aria-label={iconName}
                aria-pressed={icon === iconName}
              >
                <Icon className="size-4" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? '…' : category ? 'Guardar cambios' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}
