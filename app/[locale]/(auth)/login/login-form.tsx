'use client';

import { useState, useTransition } from 'react';
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
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl leading-[1.1] tracking-[-0.5px] [font-weight:500] sm:text-3xl sm:tracking-[-0.6px] lg:text-[36px] lg:leading-[1.05] lg:tracking-[-0.72px]">
          {t('signIn')}
        </CardTitle>
        <CardDescription>{t('loginSubtitle', { email: t('email'), brand: 'costo' })}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password">{t('password')}</TabsTrigger>
            <TabsTrigger value="magic">{t('magicLink')}</TabsTrigger>
          </TabsList>

          <TabsContent value="password" className="mt-4">
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-invalid={passwordForm.formState.errors.email ? true : undefined}
                  {...passwordForm.register('email')}
                />
                {passwordForm.formState.errors.email?.message && (
                  <p className="text-sm text-destructive" role="alert">
                    {passwordForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  aria-invalid={passwordForm.formState.errors.password ? true : undefined}
                  {...passwordForm.register('password')}
                />
                {passwordForm.formState.errors.password?.message && (
                  <p className="text-sm text-destructive" role="alert">
                    {passwordForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? t('loggingIn') : t('signIn')}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <Link
                  href="/signup"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t('signUp')}
                </Link>
                <Link
                  href="/forgot-password"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t('forgotPassword')}
                </Link>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="magic" className="mt-4">
            {magicLinkSent ? (
              <p className="text-sm text-muted-foreground">
                {t('magicLinkSent')}
              </p>
            ) : (
              <form onSubmit={magicForm.handleSubmit(onMagicLinkSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-magic">{t('email')}</Label>
                  <Input
                    id="email-magic"
                    type="email"
                    autoComplete="email"
                    required
                    aria-invalid={magicForm.formState.errors.email ? true : undefined}
                    {...magicForm.register('email')}
                  />
                  {magicForm.formState.errors.email?.message && (
                    <p className="text-sm text-destructive" role="alert">
                      {magicForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <Button type="submit" disabled={pending} className="w-full">
                  {t('magicLink')}
                </Button>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
