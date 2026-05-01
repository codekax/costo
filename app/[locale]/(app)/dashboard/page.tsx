import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { Plus, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createServerClient } from '@/lib/supabase/server';
import { getActiveWorkspace } from '@/lib/active-workspace';
import { getDashboardData } from '@/lib/db/queries/dashboard';
import { getProjects } from '@/lib/db/queries/projects';
import { getWorkspaceTotals } from '@/lib/db/queries/expenses';
import { CategoryDonut } from '@/components/charts/category-donut';
import { MonthlyEvolution } from '@/components/charts/monthly-evolution';
import { TopVendors } from '@/components/charts/top-vendors';
import { ProjectProgressList } from '@/components/charts/project-progress';
import { ExpenseRow } from '@/components/domain/expense-row';
import { formatCurrency } from '@/utils/format';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const ws = await getActiveWorkspace();
  if (!ws) return null;

  const supabase = await createServerClient();
  const [data, allTotals, projects] = await Promise.all([
    getDashboardData(supabase, ws.active.id),
    getWorkspaceTotals(supabase, ws.active.id),
    getProjects(supabase, ws.active.id, { archived: false }),
  ]);

  const isEmpty = allTotals.count === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inicio</h1>
          <p className="text-sm text-muted-foreground">{ws.active.name}</p>
        </div>
        <Button asChild>
          <Link href="/expenses/new">
            <Plus className="mr-1 size-4" /> Nuevo gasto
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TotalCard label="Total ARS" amount={allTotals.ars} currency="ARS" />
        <TotalCard label="Total USD" amount={allTotals.usd} currency="USD" />
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <Receipt className="size-10 text-muted-foreground" />
            <div className="space-y-1">
              <p className="font-medium">Empezá a trackear tus costos</p>
              <p className="text-sm text-muted-foreground">
                Cargá tu primer gasto y vas a verlo reflejado acá inmediatamente.
              </p>
            </div>
            <Button asChild>
              <Link href="/expenses/new">
                <Plus className="mr-1 size-4" /> Cargar primer gasto
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribución por categoría</CardTitle>
                <CardDescription>Últimos 12 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="ars">
                  <TabsList className="mb-3">
                    <TabsTrigger value="ars">ARS</TabsTrigger>
                    <TabsTrigger value="usd">USD</TabsTrigger>
                  </TabsList>
                  <TabsContent value="ars">
                    <CategoryDonut data={data.byCategory} currency="ARS" />
                  </TabsContent>
                  <TabsContent value="usd">
                    <CategoryDonut data={data.byCategory} currency="USD" />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evolución mensual</CardTitle>
                <CardDescription>ARS y USD acumulados por mes</CardDescription>
              </CardHeader>
              <CardContent>
                <MonthlyEvolution data={data.monthly} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Proyectos activos</CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectProgressList projects={projects} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top proveedores</CardTitle>
                <CardDescription>Por monto total</CardDescription>
              </CardHeader>
              <CardContent>
                <TopVendors data={data.topVendors} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Últimos gastos</CardTitle>
                <CardDescription>Los 10 más recientes</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/expenses">Ver todos</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.recent.map((e) => (
                <ExpenseRow key={e.id} expense={e} />
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function TotalCard({
  label,
  amount,
  currency,
}: {
  label: string;
  amount: number;
  currency: 'ARS' | 'USD';
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tabular-nums">{formatCurrency(amount, currency)}</p>
      </CardContent>
    </Card>
  );
}
