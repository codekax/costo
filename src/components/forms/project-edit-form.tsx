'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProjectTypeCombobox } from '@/components/domain/project-type-combobox';
import { CreateProjectSchema } from '@/lib/schemas/project';
import { updateProject } from '@/actions/projects/update-project';
import { useServerAction } from '@/hooks/use-server-action';
import type { Project } from '@/types/domain';

type Values = {
  workspaceId: string;
  name: string;
  type: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budgetArs?: number;
  budgetUsd?: number;
};

export function ProjectEditForm({
  project,
  existingTypes,
}: {
  project: Project;
  existingTypes: string[];
}) {
  const t = useTranslations('toasts');
  const tCommon = useTranslations('common');
  const tProjects = useTranslations('projects');
  const router = useRouter();

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

  const type = form.watch('type');

  const submit = useServerAction(
    (values: Values) =>
      updateProject({
        id: project.id,
        etag: project.updated_at,
        name: values.name,
        type: values.type,
        description: values.description?.trim() || null,
        startDate: values.startDate || null,
        endDate: values.endDate || null,
        budgetArs: values.budgetArs ?? null,
        budgetUsd: values.budgetUsd ?? null,
      }),
    {
      successMessage: t('projectUpdated'),
      onSuccess: () => router.push(`/projects/${project.id}`),
    },
  );

  return (
    <form onSubmit={form.handleSubmit(submit.run)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">{tProjects('name')}</Label>
        <Input id="name" {...form.register('name')} />
      </div>

      <div className="space-y-2">
        <Label>{tProjects('type')}</Label>
        <ProjectTypeCombobox
          value={type}
          existingTypes={existingTypes}
          onChange={(v) => form.setValue('type', v ?? '', { shouldValidate: true })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{tProjects('description')}</Label>
        <Textarea id="description" rows={3} {...form.register('description')} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">{tProjects('startDateOptional')}</Label>
          <Input id="startDate" type="date" {...form.register('startDate')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">{tProjects('endDateOptional')}</Label>
          <Input id="endDate" type="date" {...form.register('endDate')} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="budgetArs">{tProjects('budgetArsOptional')}</Label>
          <Input
            id="budgetArs"
            type="number"
            step="0.01"
            min="0"
            {...form.register('budgetArs', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budgetUsd">{tProjects('budgetUsdOptional')}</Label>
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
          {tCommon('cancel')}
        </Button>
        <Button type="submit" disabled={submit.pending}>
          {submit.pending ? '…' : tProjects('saveChanges')}
        </Button>
      </div>
    </form>
  );
}
