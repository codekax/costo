'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CreateVendorSchema } from '@/lib/schemas/vendor';
import { createVendor } from '@/actions/vendors/create-vendor';
import { updateVendor } from '@/actions/vendors/update-vendor';
import { useServerAction } from '@/hooks/use-server-action';
import type { Vendor } from '@/types/domain';

type Values = z.input<typeof CreateVendorSchema>;

export function VendorForm({
  workspaceId,
  vendor,
  onDone,
}: {
  workspaceId: string;
  vendor?: Vendor;
  onDone?: () => void;
}) {
  const t = useTranslations('toasts');
  const tCommon = useTranslations('common');
  const tVendors = useTranslations('vendors');
  const isEdit = Boolean(vendor);

  const form = useForm<Values>({
    resolver: zodResolver(CreateVendorSchema),
    defaultValues: {
      workspaceId,
      name: vendor?.name ?? '',
      contact: vendor?.contact ?? '',
      notes: vendor?.notes ?? '',
    },
  });

  const submit = useServerAction<Values, unknown>(
    (values) => {
      const cleaned = {
        ...values,
        contact: values.contact?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      };
      return isEdit
        ? updateVendor({ id: vendor!.id, ...cleaned })
        : createVendor(cleaned);
    },
    {
      successMessage: t(isEdit ? 'vendorUpdated' : 'vendorCreated'),
      onSuccess: onDone,
    },
  );

  return (
    <form onSubmit={form.handleSubmit(submit.run)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{tVendors('name')}</Label>
        <Input id="name" placeholder={tVendors('namePlaceholder')} {...form.register('name')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact">{tVendors('contactOptional')}</Label>
        <Input
          id="contact"
          placeholder={tVendors('contactPlaceholder')}
          {...form.register('contact')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{tVendors('notesOptional')}</Label>
        <Textarea id="notes" rows={2} {...form.register('notes')} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone}>
            {tCommon('cancel')}
          </Button>
        )}
        <Button type="submit" disabled={submit.pending}>
          {submit.pending ? '…' : isEdit ? tCommon('save') : tCommon('create')}
        </Button>
      </div>
    </form>
  );
}
