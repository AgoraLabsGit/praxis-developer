import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SettingsNav } from './settings-nav';

export default async function WorkspaceSettingsLayout({
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

  const navItems = [
    { href: '/dashboard/settings/integrations', label: 'Integrations', icon: 'plug' },
    { href: '/dashboard/settings/billing', label: 'Billing', icon: 'credit-card' },
    { href: '/dashboard/settings/security', label: 'Security', icon: 'shield' },
  ];

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Workspace Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage integrations, billing, and security for {org.name}
        </p>
      </div>

      <div className="flex gap-8">
        <SettingsNav items={navItems} />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
