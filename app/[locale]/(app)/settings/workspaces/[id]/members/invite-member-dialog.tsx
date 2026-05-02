'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Copy, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SendInvitationSchema } from '@/lib/schemas/invitation';
import { sendInvitation } from '@/actions/invitations/send-invitation';

type Values = z.input<typeof SendInvitationSchema>;

export function InviteMemberDialog({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const tErrors = useTranslations('errors');
  const tToasts = useTranslations('toasts');
  const tCommon = useTranslations('common');
  const t = useTranslations('workspaces');
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [copyLink, setCopyLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(SendInvitationSchema),
    defaultValues: { workspaceId, email: '', role: 'editor' },
  });

  function onSubmit(values: Values) {
    startTransition(async () => {
      const result = await sendInvitation(values);
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success(tToasts('invitationSent'));
      setCopyLink(result.data.copyLink);
      router.refresh();
    });
  }

  function onCopy() {
    if (!copyLink) return;
    void navigator.clipboard.writeText(copyLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function reset() {
    setOpen(false);
    setCopyLink(null);
    setCopied(false);
    form.reset({ workspaceId, email: '', role: 'editor' });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : reset())}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 size-4" /> {t('invite')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        {copyLink ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('invitationCreated')}</DialogTitle>
              <DialogDescription>
                {t('invitationCreatedDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2">
              <Input value={copyLink} readOnly className="font-mono text-xs" />
              <Button variant="outline" onClick={onCopy} aria-label={t('copyLinkAria')}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={reset}>{t('done')}</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{t('inviteMember')}</DialogTitle>
              <DialogDescription>
                {t('inviteDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <Label htmlFor="email">{t('emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="off"
                placeholder={t('emailPlaceholder')}
                {...form.register('email')}
              />
              <p className="text-xs text-muted-foreground">
                {t('roleHint')}
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={reset}>
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? '…' : t('invite')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
