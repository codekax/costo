'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signUp } from '@/actions/auth/sign-up';
import { SignUpSchema } from '@/lib/schemas/auth';

type SignUpValues = z.infer<typeof SignUpSchema>;

export function SignupForm() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<SignUpValues>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: { email: '', password: '', name: '' },
  });

  function onSubmit(values: SignUpValues) {
    startTransition(async () => {
      const result = await signUp(values);
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success('Cuenta creada — revisá tu email para confirmar.');
      router.push('/login');
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t('signUp')}</CardTitle>
        <CardDescription>Vas a recibir un workspace personal automáticamente.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre (opcional)</Label>
            <Input id="name" type="text" autoComplete="name" {...form.register('name')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...form.register('password')}
            />
            <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? '…' : t('signUp')}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">
              {t('signIn')}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
