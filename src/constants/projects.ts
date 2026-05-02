import type { ProjectType } from '@/types/domain';

export const PROJECT_TYPES: ProjectType[] = ['renovation', 'general', 'other'];

export const PROJECT_TYPE_LABEL_ES: Record<ProjectType, string> = {
  renovation: 'Renovación / Construcción',
  general: 'General',
  other: 'Otro',
};

export const PROJECT_TYPE_LABEL_EN: Record<ProjectType, string> = {
  renovation: 'Renovation',
  general: 'General',
  other: 'Other',
};
