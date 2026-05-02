'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { acceptInvitation } from '@/actions/invitations/accept-invitation';

export function AcceptInvitationButton({ token }: { token: string }) {
  const router = useRouter();
  const tErrors = useTranslations('errors');
  const tToasts = useTranslations('toasts');
  const t = useTranslations('acceptInvitation');
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await acceptInvitation({ token });
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success(tToasts('welcome'));
      router.push('/dashboard');
      router.refresh();
    });
  }

  return (
    <Button onClick={onClick} disabled={pending} className="w-full">
      {pending ? t('acceptingButton') : t('acceptButton')}
    </Button>
  );
}
