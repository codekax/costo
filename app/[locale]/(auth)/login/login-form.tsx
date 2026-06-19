'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from '@/actions/auth/sign-in';
import { signInWithMagicLink } from '@/actions/auth/sign-in-with-magic-link';
import { SignInSchema, MagicLinkSchema } from '@/lib/schemas/auth';

type SignInValues = z.infer<typeof SignInSchema>;

export function LoginForm() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [magicPending, startMagic] = useTransition();
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const form = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { email: '', password: '' },
  });

  function onSubmit(values: SignInValues) {
    startTransition(async () => {
      const result = await signIn(values);
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      router.push(result.data.redirectTo);
      router.refresh();
    });
  }

  function onMagicLink() {
    const email = form.getValues('email');
    const parsed = MagicLinkSchema.safeParse({ email });
    if (!parsed.success) {
      form.setError('email', { message: parsed.error.issues[0]?.message });
      return;
    }
    startMagic(async () => {
      const result = await signInWithMagicLink(parsed.data);
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      setMagicLinkSent(true);
    });
  }

  return (
    <div className="space-y-7">
      <div className="space-y-1.5 text-center">
        <h1 className="text-[28px] leading-[1.15] tracking-[-0.02em] [font-weight:590]">
          {t('loginTitle')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('loginSubtitleClean')}</p>
      </div>

      {magicLinkSent ? (
        <div className="rounded-lg border border-border bg-status-info px-4 py-3 text-center text-sm text-status-info-foreground">
          {t('magicLinkSent')}
        </div>
      ) : (
        <>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
              <div className="flex items-baseline justify-between">
                <Label htmlFor="password">{t('password')}</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t('forgotPassword')}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={form.formState.errors.password ? true : undefined}
                {...form.register('password')}
              />
              {form.formState.errors.password?.message && (
                <p className="text-sm text-destructive" role="alert">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? t('loggingIn') : t('signIn')}
            </Button>
          </form>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t('or')}
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={magicPending}
            onClick={onMagicLink}
          >
            <Sparkles className="size-4" aria-hidden />
            {magicPending ? t('loggingIn') : t('magicLink')}
          </Button>
        </>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {t('noAccount')}{' '}
        <Link href="/signup" className="[font-weight:510] text-foreground transition-colors hover:text-link">
          {t('createOne')}
        </Link>
      </p>
    </div>
  );
}
