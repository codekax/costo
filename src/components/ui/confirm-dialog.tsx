'use client';

import { useEffect, useState, useTransition, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ActionResult } from '@/actions/_shared';

type BaseProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Defaults to "Cancelar". */
  cancelLabel?: ReactNode;
  /** Defaults to "Confirmar" / "Borrar definitivamente" depending on variant. */
  confirmLabel?: ReactNode;
  variant?: 'default' | 'destructive';
  /** Function returning an ActionResult. Toast on error, close on success. */
  onConfirm: () => Promise<ActionResult<unknown>>;
  /** Optional success toast / hook */
  onSuccess?: () => void;
};

type Props =
  | (BaseProps & { confirmText?: undefined; confirmHelp?: undefined })
  | (BaseProps & {
      /**
       * If provided, the confirm button stays disabled until the user types
       * this exact value into the input. Used for destructive operations.
       */
      confirmText: string;
      confirmHelp: ReactNode;
    });

/**
 * Confirmation dialog primitive.
 *  - Plain confirm/cancel by default.
 *  - Destructive type-to-confirm when `confirmText` is provided.
 *
 * Replaces ad-hoc Dialog + Input + state across project / workspace /
 * category / vendor / account delete flows.
 */
export function ConfirmDialog(props: Props) {
  const {
    open,
    onOpenChange,
    title,
    description,
    cancelLabel,
    confirmLabel,
    variant = 'default',
    onConfirm,
    onSuccess,
  } = props;
  const tErrors = useTranslations('errors');
  const tConfirm = useTranslations('confirm');
  const [pending, startTransition] = useTransition();
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  const requiresType = 'confirmText' in props && typeof props.confirmText === 'string';
  const canConfirm =
    !pending && (!requiresType || (requiresType && typed === props.confirmText));

  function handleConfirm() {
    startTransition(async () => {
      const result = await onConfirm();
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      onOpenChange(false);
      onSuccess?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {requiresType ? (
          <div className="space-y-2">
            <Label htmlFor="confirm-input">{props.confirmHelp}</Label>
            <Input
              id="confirm-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {cancelLabel ?? tConfirm('cancel')}
          </Button>
          <Button
            type="button"
            variant={variant}
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {pending
              ? '…'
              : (confirmLabel ??
                (variant === 'destructive' ? tConfirm('deleteForever') : tConfirm('confirm')))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
