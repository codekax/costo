'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { parseExcel, type ParseExcelOk } from '@/actions/import-export/parse-excel';
import { importRows, type ImportRowsResult } from '@/actions/import-export/import-rows';

export function ImportFlow({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const tErrors = useTranslations('errors');
  const t = useTranslations('import');
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<ParseExcelOk | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportRowsResult | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] ?? '';
      startTransition(async () => {
        const r = await parseExcel({ workspaceId, fileBase64: base64 });
        if (!r.ok) {
          toast.error(tErrors(r.error));
          return;
        }
        setPreview(r.data);
      });
    };
    reader.readAsDataURL(file);
  }

  function onConfirmImport() {
    if (!preview) return;
    const validRows = preview.rows.filter((r) => r.valid).map((r) => r.parsed!);
    setImporting(true);
    setProgress(10);
    startTransition(async () => {
      const r = await importRows({ workspaceId, rows: validRows });
      setProgress(100);
      setImporting(false);
      if (!r.ok) {
        toast.error(tErrors(r.error));
        return;
      }
      setResult(r.data);
      toast.success(t('importedToast', { count: r.data.importedCount }));
      router.refresh();
    });
  }

  function reset() {
    setPreview(null);
    setResult(null);
    setProgress(0);
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-md border bg-card p-4">
          <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
          <div className="text-sm">
            <p className="font-medium">{t('completeTitle')}</p>
            <ul className="mt-1 space-y-0.5 text-muted-foreground">
              <li>{t('importedExpenses', { count: result.importedCount })}</li>
              {result.createdCategories > 0 && (
                <li>{t('createdCategories', { count: result.createdCategories })}</li>
              )}
              {result.createdVendors > 0 && (
                <li>{t('createdVendors', { count: result.createdVendors })}</li>
              )}
              {result.createdProjects > 0 && (
                <li>{t('createdProjects', { count: result.createdProjects })}</li>
              )}
              {result.failedCount > 0 && (
                <li className="text-destructive">{t('failedRows', { count: result.failedCount })}</li>
              )}
            </ul>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset}>
            {t('importOther')}
          </Button>
          <Button asChild>
            <Link href="/expenses">{t('viewExpenses')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="space-y-3">
        <Input
          type="file"
          accept=".xlsx,.xls"
          onChange={onFileChange}
          disabled={pending}
          aria-label={t('fileAria')}
        />
        {pending && <p className="text-sm text-muted-foreground">{t('processing')}</p>}
      </div>
    );
  }

  if (preview.missingColumns.length > 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-md border border-destructive/50 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 size-5 text-destructive" />
          <div className="text-sm">
            <p className="font-medium">{t('missingColumnsTitle')}</p>
            <p className="mt-1 text-muted-foreground">
              {preview.missingColumns.join(', ')}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={reset}>
          {t('uploadOther')}
        </Button>
      </div>
    );
  }

  if (preview.rows.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{t('emptyFile')}</p>
        <Button variant="outline" onClick={reset}>
          {t('uploadOther')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Badge variant="secondary">{t('rowsTotal', { count: preview.summary.total })}</Badge>
        <Badge variant="default">{t('rowsValid', { count: preview.summary.valid })}</Badge>
        {preview.summary.invalid > 0 && (
          <Badge variant="destructive">{t('rowsInvalid', { count: preview.summary.invalid })}</Badge>
        )}
      </div>

      {importing && <Progress value={progress} className="h-2" />}

      <div className="max-h-[400px] overflow-auto rounded-md border">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted">
            <tr>
              <th className="px-2 py-1.5 text-left">{t('headerNumber')}</th>
              <th className="px-2 py-1.5 text-left">{t('headerDate')}</th>
              <th className="px-2 py-1.5 text-left">{t('headerCategory')}</th>
              <th className="px-2 py-1.5 text-left">{t('headerProject')}</th>
              <th className="px-2 py-1.5 text-right">{t('headerAmount')}</th>
              <th className="px-2 py-1.5 text-left">{t('headerCurrency')}</th>
              <th className="px-2 py-1.5 text-left">{t('headerErrors')}</th>
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((r) => (
              <tr
                key={r.rowNumber}
                className={
                  r.valid
                    ? 'border-t'
                    : 'border-t bg-destructive/5 text-destructive'
                }
              >
                <td className="px-2 py-1.5 text-muted-foreground">{r.rowNumber}</td>
                <td className="px-2 py-1.5">{String(r.raw.fecha ?? '')}</td>
                <td className="px-2 py-1.5">{String(r.raw.categoria ?? '')}</td>
                <td className="px-2 py-1.5">{String(r.raw.proyecto ?? '') || t('rowProjectGeneral')}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {String(r.raw.monto ?? '')}
                </td>
                <td className="px-2 py-1.5">{String(r.raw.moneda ?? '')}</td>
                <td className="px-2 py-1.5">{r.errors.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={reset} disabled={importing}>
          {t('cancel')}
        </Button>
        <Button
          onClick={onConfirmImport}
          disabled={importing || preview.summary.valid === 0}
        >
          {importing ? t('importing') : t('importRows', { count: preview.summary.valid })}
        </Button>
      </div>
    </div>
  );
}
