'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UpdateWorkspaceSchema } from '@/lib/schemas/workspace';
import { updateWorkspace } from '@/actions/workspaces/update-workspace';

type Values = z.input<typeof UpdateWorkspaceSchema>;

export function WorkspaceSettingsForm({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const tErrors = useTranslations('errors');
  const tToasts = useTranslations('toasts');
  const tCommon = useTranslations('common');
  const t = useTranslations('workspaces');
  const [pending, startTransition] = useTransition();

  const form = useForm<Values>({
    resolver: zodResolver(UpdateWorkspaceSchema),
    defaultValues: { id, name },
  });

  function onSubmit(values: Values) {
    startTransition(async () => {
      const result = await updateWorkspace(values);
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success(tToasts('workspaceUpdated'));
      router.refresh();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-2">
      <div className="flex-1 space-y-2">
        <Label htmlFor="name">{t('name')}</Label>
        <Input id="name" {...form.register('name')} />
      </div>
      <Button type="submit" disabled={pending || !form.formState.isDirty}>
        {pending ? '…' : tCommon('save')}
      </Button>
    </form>
  );
}
