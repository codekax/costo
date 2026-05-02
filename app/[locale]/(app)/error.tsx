'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { logger } from '@/lib/logger';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('appError');
  useEffect(() => {
    logger.error('app.error', { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-6 py-24 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-9 text-destructive" />
        </div>
        <div className="max-w-md space-y-2">
          <p className="text-3xl tracking-[-0.6px] [font-weight:500]">{t('title')}</p>
          <p className="text-base text-muted-foreground [font-weight:450]">
            {error.message || t('fallback')}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground [font-weight:450]">
              {t('ref', { digest: error.digest })}
            </p>
          )}
        </div>
        <Button onClick={reset}>{t('retry')}</Button>
      </CardContent>
    </Card>
  );
}
