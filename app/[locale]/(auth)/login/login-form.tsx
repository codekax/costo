'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { signIn } from '@/actions/auth/sign-in';
import { signInWithMagicLink } from '@/actions/auth/sign-in-with-magic-link';
import { SignInSchema, MagicLinkSchema } from '@/lib/schemas/auth';

type SignInValues = z.infer<typeof SignInSchema>;
type MagicLinkValues = z.infer<typeof MagicLinkSchema>;

export function LoginForm() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const passwordForm = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { email: '', password: '' },
  });

  const magicForm = useForm<MagicLinkValues>({
    resolver: zodResolver(MagicLinkSchema),
    defaultValues: { email: '' },
  });

  function onPasswordSubmit(values: SignInValues) {
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

  function onMagicLinkSubmit(values: MagicLinkValues) {
    startTransition(async () => {
      const result = await signInWithMagicLink(values);
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      setMagicLinkSent(true);
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl leading-[1.1] tracking-[-0.6px] [font-weight:600] sm:text-[34px]">
          {t('loginTitle')}
        </h1>
        <p className="text-[15px] text-muted-foreground [font-weight:450]">
          {t('loginSubtitleClean')}
        </p>
      </div>

      <Tabs defaultValue="password" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="password">{t('password')}</TabsTrigger>
          <TabsTrigger value="magic">
            <Sparkles className="mr-1.5 size-3.5" aria-hidden />
            {t('magicLink')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="password" className="mt-5">
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="tu@email.com"
                  className="pl-9"
                  aria-invalid={passwordForm.formState.errors.email ? true : undefined}
                  {...passwordForm.register('email')}
                />
              </div>
              {passwordForm.formState.errors.email?.message && (
                <p className="text-sm text-destructive" role="alert">
                  {passwordForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="password">{t('password')}</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t('forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="pl-9"
                  aria-invalid={passwordForm.formState.errors.password ? true : undefined}
                  {...passwordForm.register('password')}
                />
              </div>
              {passwordForm.formState.errors.password?.message && (
                <p className="text-sm text-destructive" role="alert">
                  {passwordForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? t('loggingIn') : t('signIn')}
              {!pending && <ArrowRight className="ml-1 size-4" aria-hidden />}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="magic" className="mt-5">
          {magicLinkSent ? (
            <div className="rounded-2xl border border-border bg-status-info/40 px-4 py-3 text-sm text-status-info-foreground">
              {t('magicLinkSent')}
            </div>
          ) : (
            <form onSubmit={magicForm.handleSubmit(onMagicLinkSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-magic">{t('email')}</Label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="email-magic"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="tu@email.com"
                    className="pl-9"
                    aria-invalid={magicForm.formState.errors.email ? true : undefined}
                    {...magicForm.register('email')}
                  />
                </div>
                {magicForm.formState.errors.email?.message && (
                  <p className="text-sm text-destructive" role="alert">
                    {magicForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? t('loggingIn') : t('magicLink')}
                {!pending && <ArrowRight className="ml-1 size-4" aria-hidden />}
              </Button>
            </form>
          )}
        </TabsContent>
      </Tabs>

      <div className="border-t border-border pt-6 text-center text-sm">
        <span className="text-muted-foreground">{t('noAccount')} </span>
        <Link
          href="/signup"
          className="[font-weight:500] text-foreground transition-colors hover:text-accent"
        >
          {t('createOne')}
        </Link>
      </div>
    </div>
  );
}
