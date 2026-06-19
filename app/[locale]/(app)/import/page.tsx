import Link from 'next/link';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Download } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/layout/page-title';
import { requireWorkspaceContext } from '@/lib/workspace-context';

import { ImportFlow } from './import-flow';

export default async function ImportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('import');

  const { workspace } = await requireWorkspaceContext();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageTitle>{t('title')}</PageTitle>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('step1Title')}</CardTitle>
          <CardDescription>{t('step1Description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link
              href="/templates/expense-import-template.xlsx"
              download="expense-import-template.xlsx"
            >
              <Download className="mr-1 size-4" /> {t('downloadTemplate')}
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('step2Title')}</CardTitle>
          <CardDescription>{t('step2Description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ImportFlow workspaceId={workspace.id} />
        </CardContent>
      </Card>
    </div>
  );
}
