'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteAccount } from '@/actions/auth/delete-account';

export function DeleteAccountSection({
  ownedSharedWorkspaces,
}: {
  ownedSharedWorkspaces: { id: string; name: string }[];
}) {
  const tErrors = useTranslations('errors');
  const tCommon = useTranslations('common');
  const tConfirm = useTranslations('confirm');
  const t = useTranslations('settings');
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [pending, startTransition] = useTransition();

  const isBlocked = ownedSharedWorkspaces.length > 0;

  function onDelete() {
    startTransition(async () => {
      const result = await deleteAccount({ confirmation });
      if (result && !result.ok) {
        toast.error(tErrors(result.error));
      }
    });
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-base text-destructive">{t('deleteSectionTitle')}</CardTitle>
        <CardDescription>
          {t('deleteSectionDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isBlocked && (
          <div className="flex items-start gap-3 rounded-md border border-amber-500/50 bg-amber-500/5 p-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <div className="space-y-1">
              <p className="font-medium">{t('deleteBlockedTitle')}</p>
              <p className="text-muted-foreground">
                {t('deleteBlockedDescription')}
              </p>
              <ul className="ml-4 list-disc space-y-0.5">
                {ownedSharedWorkspaces.map((w) => (
                  <li key={w.id}>
                    <Link
                      href={`/settings/workspaces/${w.id}`}
                      className="font-medium underline hover:text-foreground"
                    >
                      {w.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <Button
          variant="destructive"
          disabled={isBlocked}
          onClick={() => setOpen(true)}
        >
          <Trash2 className="mr-1 size-4" /> {t('deleteAccountButton')}
        </Button>
      </CardContent>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) {
            setOpen(false);
            setConfirmation('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('deleteDialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm">
              {t('deleteTypeHelp')}
            </Label>
            <Input
              id="confirm"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              disabled={pending || confirmation !== 'DELETE'}
              onClick={onDelete}
            >
              {pending ? '…' : tConfirm('deleteForever')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
