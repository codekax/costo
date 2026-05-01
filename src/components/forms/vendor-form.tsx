'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CreateVendorSchema } from '@/lib/schemas/vendor';
import { createVendor } from '@/actions/vendors/create-vendor';
import { updateVendor } from '@/actions/vendors/update-vendor';
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
  const tErrors = useTranslations('errors');
  const [pending, startTransition] = useTransition();

  const form = useForm<Values>({
    resolver: zodResolver(CreateVendorSchema),
    defaultValues: {
      workspaceId,
      name: vendor?.name ?? '',
      contact: vendor?.contact ?? '',
      notes: vendor?.notes ?? '',
    },
  });

  function onSubmit(values: Values) {
    startTransition(async () => {
      const cleaned = {
        ...values,
        contact: values.contact?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      };
      const result = vendor
        ? await updateVendor({ id: vendor.id, ...cleaned })
        : await createVendor(cleaned);

      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success(vendor ? 'Proveedor actualizado' : 'Proveedor creado');
      onDone?.();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" placeholder="Corralón Norte" {...form.register('name')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact">Contacto (opcional)</Label>
        <Input
          id="contact"
          placeholder="Tel: 11 1234-5678"
          {...form.register('contact')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea id="notes" rows={2} {...form.register('notes')} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? '…' : vendor ? 'Guardar cambios' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}
