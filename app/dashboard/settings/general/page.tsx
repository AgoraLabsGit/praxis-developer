import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function GeneralSettingsPage() {
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">General</h2>
        <p className="text-sm text-muted-foreground">
          Workspace name and default settings
        </p>
      </div>

      <section className="rounded-lg border bg-card p-6">
        <h3 className="font-medium mb-2">Workspace</h3>
        <p className="text-sm text-muted-foreground">
          {org.name}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Workspace name and avatar editing coming soon.
        </p>
      </section>
    </div>
  );
}
