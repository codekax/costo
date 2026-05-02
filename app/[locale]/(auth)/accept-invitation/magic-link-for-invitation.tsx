'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInWithMagicLink } from '@/actions/auth/sign-in-with-magic-link';

export function MagicLinkForInvitation({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const tErrors = useTranslations('errors');
  const t = useTranslations('acceptInvitation');
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function onClick() {
    startTransition(async () => {
      const result = await signInWithMagicLink({
        email,
        redirectTo:
          typeof window !== 'undefined'
            ? `${window.location.origin}/accept-invitation?token=${token}`
            : undefined,
      });
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('linkSent', { email })}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="invited-email">{t('invitedEmailLabel')}</Label>
        <Input id="invited-email" value={email} readOnly disabled />
      </div>
      <Button onClick={onClick} disabled={pending} className="w-full">
        {pending ? t('sendingLink') : t('sendLink')}
      </Button>
    </div>
  );
}
