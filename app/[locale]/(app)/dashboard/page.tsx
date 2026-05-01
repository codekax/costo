import { setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inicio</h1>
        <p className="text-sm text-muted-foreground">
          Resumen del workspace — se llena cuando carges tu primer gasto.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total ARS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$0,00</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total USD</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">US$0,00</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Próximos pasos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Foundational layer en producción ✓</p>
          <p>Phase 3 (US1 — cargar gasto) próximo en el plan.</p>
        </CardContent>
      </Card>
    </div>
  );
}
