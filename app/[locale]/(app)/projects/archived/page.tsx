import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { Archive } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createServerClient } from '@/lib/supabase/server';
import { getActiveWorkspace } from '@/lib/active-workspace';
import { getProjects } from '@/lib/db/queries/projects';
import { formatCurrency } from '@/utils/format';

export default async function ArchivedProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const ws = await getActiveWorkspace();
  if (!ws) return null;

  const supabase = await createServerClient();
  const projects = await getProjects(supabase, ws.active.id, { archived: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proyectos archivados</h1>
          <p className="text-sm text-muted-foreground">
            {projects.length === 0
              ? 'Sin proyectos archivados.'
              : `${projects.length} proyecto${projects.length === 1 ? '' : 's'} archivado${projects.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button asChild variant="ghost">
          <Link href="/projects">Volver a activos</Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Archive className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Los proyectos que archives van a aparecer acá.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="h-full opacity-75 transition-opacity hover:opacity-100">
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{p.name}</h3>
                    <Badge variant="secondary">Archivado</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Total ARS</p>
                      <p className="font-medium tabular-nums">
                        {formatCurrency(p.total_ars, 'ARS')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total USD</p>
                      <p className="font-medium tabular-nums">
                        {formatCurrency(p.total_usd, 'USD')}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.expense_count} gasto{p.expense_count === 1 ? '' : 's'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
