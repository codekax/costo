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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t('forgotPassword')}</CardTitle>
      </CardHeader>
      <CardContent>
        {sent ? (
          <p className="text-sm text-muted-foreground">Listo — revisá tu email.</p>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? '…' : t('magicLink')}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="hover:text-foreground">
                {t('signIn')}
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
