'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestPasswordReset } from '@/actions/auth/request-password-reset';
import { RequestPasswordResetSchema } from '@/lib/schemas/auth';

type Values = z.infer<typeof RequestPasswordResetSchema>;

export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(RequestPasswordResetSchema),
    defaultValues: { email: '' },
  });

  function onSubmit(values: Values) {
    startTransition(async () => {
      const result = await requestPasswordReset(values);
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      setSent(true);
    });
  }

  return (
    <div className="space-y-7">
      <div className="space-y-1.5 text-center">
        <h1 className="text-[28px] leading-[1.15] tracking-[-0.02em] [font-weight:590]">
          {t('forgotPassword')}
        </h1>
      </div>

      {sent ? (
        <div className="rounded-lg border border-border bg-status-info px-4 py-3 text-center text-sm text-status-info-foreground">
          {t('checkEmail')}
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">{t('email')}</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? '…' : t('magicLink')}
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="[font-weight:510] text-foreground transition-colors hover:text-link">
          {t('signIn')}
        </Link>
      </p>
    </div>
  );
}
