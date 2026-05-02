'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreateWorkspaceSchema } from '@/lib/schemas/workspace';
import { createWorkspace } from '@/actions/workspaces/create-workspace';

type Values = z.input<typeof CreateWorkspaceSchema>;

export function CreateWorkspaceDialog() {
  const router = useRouter();
  const tErrors = useTranslations('errors');
  const tToasts = useTranslations('toasts');
  const tCommon = useTranslations('common');
  const t = useTranslations('workspaces');
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<Values>({
    resolver: zodResolver(CreateWorkspaceSchema),
    defaultValues: { name: '', kind: 'shared' },
  });

  function onSubmit(values: Values) {
    startTransition(async () => {
      const result = await createWorkspace(values);
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success(tToasts('workspaceCreated'));
      setOpen(false);
      form.reset();
      router.push(`/settings/workspaces/${result.data.workspaceId}`);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 size-4" /> {t('newWorkspace')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{t('createDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('createDialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="name">{t('name')}</Label>
            <Input id="name" placeholder={t('namePlaceholder')} {...form.register('name')} autoFocus />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? '…' : tCommon('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
