import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard-shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/login');
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('owner_id', user.id)
    .single();

  if (!org) {
    redirect('/onboard');
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, color, description')
    .eq('organization_id', org.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  return (
    <DashboardShell
      user={user}
      organization={org}
      projects={projects || []}
    >
      {children}
    </DashboardShell>
  );
}
