import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getWorkspaceKeys } from '@/lib/utils/get-workspace-keys';
import { ApiKeysList } from './api-keys-list';

export default async function ApiKeysPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: org } = user
    ? await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single()
    : { data: null };

  if (!user || !org) {
    redirect('/dashboard/integrations');
  }

  const keys = await getWorkspaceKeys();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">API Keys</h2>
        <p className="text-sm text-muted-foreground">
          Securely store API keys and credentials for integrations
        </p>
      </div>

      <ApiKeysList keys={keys} />
    </div>
  );
}
