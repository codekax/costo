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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UpdateProfileSchema } from '@/lib/schemas/auth';
import { updateProfile } from '@/actions/auth/update-profile';

type Values = z.input<typeof UpdateProfileSchema>;

const TIMEZONES = [
  'America/Argentina/Buenos_Aires',
  'America/Sao_Paulo',
  'America/Santiago',
  'America/Mexico_City',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/Madrid',
  'UTC',
];

export function ProfileForm({
  defaultName,
  defaultTimezone,
}: {
  defaultName: string;
  defaultTimezone: string;
}) {
  const router = useRouter();
  const tErrors = useTranslations('errors');
  const tToasts = useTranslations('toasts');
  const tCommon = useTranslations('common');
  const t = useTranslations('settings');
  const [pending, startTransition] = useTransition();

  const form = useForm<Values>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      name: defaultName,
      timezone: defaultTimezone,
    },
  });

  function onSubmit(values: Values) {
    startTransition(async () => {
      const result = await updateProfile(values);
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success(tToasts('profileUpdated'));
      router.refresh();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t('name')}</Label>
        <Input id="name" {...form.register('name')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">{t('timezone')}</Label>
        <Select
          value={form.watch('timezone') ?? 'America/Argentina/Buenos_Aires'}
          onValueChange={(v) => form.setValue('timezone', v)}
        >
          <SelectTrigger id="timezone">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending || !form.formState.isDirty}>
          {pending ? '…' : tCommon('save')}
        </Button>
      </div>
    </form>
  );
}
