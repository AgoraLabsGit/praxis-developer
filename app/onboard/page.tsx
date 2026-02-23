import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { createOrganizationForUser } from './actions';

export default async function OnboardPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (org) {
    redirect('/dashboard');
  }

  await createOrganizationForUser(user.id);
  redirect('/dashboard');
}
