import { setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createServerClient } from '@/lib/supabase/server';
import { getActiveWorkspace } from '@/lib/active-workspace';
import { getVendors } from '@/lib/db/queries/vendors';
import { VendorsList } from './vendors-list';

export default async function VendorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const ws = await getActiveWorkspace();
  if (!ws) return null;

  const supabase = await createServerClient();
  const vendors = await getVendors(supabase, ws.active.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
        <p className="text-sm text-muted-foreground">
          Contratistas, corralones y comercios. Asignables a cada gasto.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista</CardTitle>
        </CardHeader>
        <CardContent>
          <VendorsList workspaceId={ws.active.id} vendors={vendors} />
        </CardContent>
      </Card>
    </div>
  );
}
