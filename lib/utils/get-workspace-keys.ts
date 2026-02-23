import { createServerSupabaseClient } from '@/lib/supabase/server';
import { decrypt } from './encrypt';

/**
 * Fetches workspace API keys for the current user's org, decrypted.
 * Used by the Keys management page for display and edit.
 */
export async function getWorkspaceKeys(): Promise<Record<string, string>> {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!org) return {};

  const { data: integration } = await supabase
    .from('workspace_integrations')
    .select('metadata')
    .eq('organization_id', org.id)
    .eq('service', 'environment')
    .maybeSingle();

  const keys = integration?.metadata?.keys as Record<string, string> | undefined;
  if (!keys || typeof keys !== 'object') return {};

  const result: Record<string, string> = {};
  for (const [name, raw] of Object.entries(keys)) {
    if (typeof raw === 'string') {
      try {
        result[name] = decrypt(raw);
      } catch {
        result[name] = raw;
      }
    }
  }
  return result;
}
