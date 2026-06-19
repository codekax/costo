import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { Landing } from '@/components/landing/landing';

export default async function LocaleRoot() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect('/dashboard');

  return <Landing />;
}
