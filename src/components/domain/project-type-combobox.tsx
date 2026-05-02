'use client';

import { useTranslations } from 'next-intl';
import {
  CreatableCombobox,
  type CreatableComboboxOption,
} from '@/components/ui/creatable-combobox';
import { PROJECT_TYPE_SUGGESTIONS } from '@/lib/schemas/project';

/**
 * Project type is free-text — there is no `project_types` table. The combobox
 * just suggests values previously used in the workspace plus a built-in seed
 * list. "Create" simply hands the typed string back as the new value; persistence
 * happens when the project itself is saved.
 */
export function ProjectTypeCombobox({
  value,
  existingTypes,
  onChange,
}: {
  value: string | null;
  existingTypes: string[];
  onChange: (value: string | null) => void;
}) {
  const tProjects = useTranslations('projects');
  const merged = mergeUnique([...existingTypes, ...PROJECT_TYPE_SUGGESTIONS]);
  const options = merged.map((t) => ({ value: t, label: t }));

  return (
    <CreatableCombobox
      value={value}
      options={options}
      onChange={onChange}
      placeholder={tProjects('typePlaceholder')}
      searchPlaceholder={tProjects('typeSearchPlaceholder')}
      ariaLabel={tProjects('typeAriaLabel')}
      onCreate={async (name) => {
        const created: CreatableComboboxOption = { value: name, label: name };
        return { ok: true, data: created };
      }}
    />
  );
}

function mergeUnique(list: ReadonlyArray<string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
