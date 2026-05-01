import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { Plus, Folder, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { createServerClient } from '@/lib/supabase/server';
import { getActiveWorkspace } from '@/lib/active-workspace';
import { getProjects } from '@/lib/db/queries/projects';
import { formatCurrency } from '@/utils/format';

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const ws = await getActiveWorkspace();
  if (!ws) return null;

  const supabase = await createServerClient();
  const projects = await getProjects(supabase, ws.active.id, { archived: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
          <p className="text-sm text-muted-foreground">
            {projects.length === 0
              ? 'Sin proyectos todavía'
              : `${projects.length} proyecto${projects.length === 1 ? '' : 's'} activo${projects.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/projects/archived">
              <Archive className="mr-1 size-4" /> Archivados
            </Link>
          </Button>
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="mr-1 size-4" /> Nuevo proyecto
            </Link>
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Folder className="size-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Empezá creando tu primer proyecto</p>
              <p className="text-sm text-muted-foreground">
                Por ejemplo: &quot;Expansión casa&quot; o &quot;Cocina nueva&quot;.
              </p>
            </div>
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="mr-1 size-4" /> Crear proyecto
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const progressArs =
              p.budget_ars && Number(p.budget_ars) > 0
                ? Math.min(100, (p.total_ars / Number(p.budget_ars)) * 100)
                : null;
            const progressUsd =
              p.budget_usd && Number(p.budget_usd) > 0
                ? Math.min(100, (p.total_usd / Number(p.budget_usd)) * 100)
                : null;
            return (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="h-full transition-colors hover:bg-accent/30">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <Badge variant="outline" className="capitalize">
                        {p.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Total ARS</p>
                        <p className="text-lg font-semibold tabular-nums">
                          {formatCurrency(p.total_ars, 'ARS')}
                        </p>
                        {progressArs !== null && (
                          <Progress value={progressArs} className="mt-1 h-1.5" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total USD</p>
                        <p className="text-lg font-semibold tabular-nums">
                          {formatCurrency(p.total_usd, 'USD')}
                        </p>
                        {progressUsd !== null && (
                          <Progress value={progressUsd} className="mt-1 h-1.5" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {p.expense_count} gasto{p.expense_count === 1 ? '' : 's'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
