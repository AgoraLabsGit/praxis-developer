import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NewProjectForm } from './form';

export default async function NewProjectPage() {
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

  if (!org) redirect('/onboard');

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Create New Project</h1>
      <NewProjectForm organizationId={org.id} />
    </div>
  );
}
