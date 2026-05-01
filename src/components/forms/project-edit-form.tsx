'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateProjectSchema, type ProjectType } from '@/lib/schemas/project';
import { updateProject } from '@/actions/projects/update-project';
import type { Project } from '@/types/domain';

type Values = z.input<typeof CreateProjectSchema>;

const projectTypes: { value: ProjectType; label: string }[] = [
  { value: 'renovation', label: 'Renovación / Construcción' },
  { value: 'general', label: 'General' },
  { value: 'other', label: 'Otro' },
];

export function ProjectEditForm({ project }: { project: Project }) {
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<Values>({
    resolver: zodResolver(CreateProjectSchema),
    defaultValues: {
      workspaceId: project.workspace_id,
      name: project.name,
      type: project.type,
      description: project.description ?? '',
      startDate: project.start_date ?? '',
      endDate: project.end_date ?? '',
      budgetArs: project.budget_ars ? Number(project.budget_ars) : undefined,
      budgetUsd: project.budget_usd ? Number(project.budget_usd) : undefined,
    },
  });

  const t = form.watch('type');

  function onSubmit(values: Values) {
    startTransition(async () => {
      const result = await updateProject({
        id: project.id,
        etag: project.updated_at,
        name: values.name,
        type: values.type,
        description: values.description?.trim() || null,
        startDate: values.startDate || null,
        endDate: values.endDate || null,
        budgetArs: values.budgetArs ?? null,
        budgetUsd: values.budgetUsd ?? null,
      });
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success('Proyecto actualizado');
      router.push(`/projects/${project.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del proyecto</Label>
        <Input id="name" {...form.register('name')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <Select value={t} onValueChange={(v) => form.setValue('type', v as ProjectType)}>
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {projectTypes.map((pt) => (
              <SelectItem key={pt.value} value={pt.value}>
                {pt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" rows={3} {...form.register('description')} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Inicio</Label>
          <Input id="startDate" type="date" {...form.register('startDate')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Fin</Label>
          <Input id="endDate" type="date" {...form.register('endDate')} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="budgetArs">Presupuesto ARS</Label>
          <Input
            id="budgetArs"
            type="number"
            step="0.01"
            min="0"
            {...form.register('budgetArs', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budgetUsd">Presupuesto USD</Label>
          <Input
            id="budgetUsd"
            type="number"
            step="0.01"
            min="0"
            {...form.register('budgetUsd', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? '…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
