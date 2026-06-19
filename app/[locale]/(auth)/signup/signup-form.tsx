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
import { signUp } from '@/actions/auth/sign-up';
import { SignUpSchema } from '@/lib/schemas/auth';

type SignUpValues = z.infer<typeof SignUpSchema>;

export function SignupForm() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  const tToasts = useTranslations('toasts');
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
      toast.success(tToasts('accountCreated'));
      router.push('/login');
    });
  }

  return (
    <div className="space-y-7">
      <div className="space-y-1.5 text-center">
        <h1 className="text-[28px] leading-[1.15] tracking-[-0.02em] [font-weight:590]">
          {t('signUp')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('signupHint')}</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name">{t('nameOptional')}</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            aria-invalid={form.formState.errors.name ? true : undefined}
            {...form.register('name')}
          />
          {form.formState.errors.name?.message && (
            <p className="text-sm text-destructive" role="alert">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('email')}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            aria-invalid={form.formState.errors.email ? true : undefined}
            {...form.register('email')}
          />
          {form.formState.errors.email?.message && (
            <p className="text-sm text-destructive" role="alert">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{t('password')}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-describedby="password-hint"
            aria-invalid={form.formState.errors.password ? true : undefined}
            {...form.register('password')}
          />
          <p id="password-hint" className="text-xs text-muted-foreground">
            {t('passwordHint')}
          </p>
          {form.formState.errors.password?.message && (
            <p className="text-sm text-destructive" role="alert">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? '…' : t('signUp')}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t('haveAccount')}{' '}
        <Link href="/login" className="[font-weight:510] text-foreground transition-colors hover:text-link">
          {t('signIn')}
        </Link>
      </p>
    </div>
  );
}
