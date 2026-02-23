import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { decrypt } from './encrypt';

/**
 * Retrieves an API key from workspace environment variables.
 * Falls back to process.env if not found in database.
 * Database keys override env vars.
 * Requires request context (cookies).
 */
export async function getApiKey(keyName: string): Promise<string | null> {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return process.env[keyName] || null;

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!org) return process.env[keyName] || null;

  const { data: integration } = await supabase
    .from('workspace_integrations')
    .select('metadata')
    .eq('organization_id', org.id)
    .eq('service', 'environment')
    .maybeSingle();

  const keys = integration?.metadata?.keys as Record<string, string> | undefined;
  const rawValue = keys?.[keyName];

  if (!rawValue) return process.env[keyName] || null;

  try {
    return decrypt(rawValue);
  } catch {
    return rawValue;
  }
}

/**
 * Gets multiple keys at once (more efficient).
 */
export async function getApiKeys(
  keyNames: string[]
): Promise<Record<string, string | null>> {
  const entries = await Promise.all(
    keyNames.map(async (name) => [name, await getApiKey(name)] as const)
  );
  return Object.fromEntries(entries);
}

/**
 * Retrieves an API key for a specific organization (no request context).
 * Use in background jobs (e.g. workflow execution) where cookies are unavailable.
 * Falls back to process.env if not found in database.
 */
export async function getApiKeyForOrg(
  organizationId: string,
  keyName: string
): Promise<string | null> {
  const supabase = createAdminClient();

  const { data: integration } = await supabase
    .from('workspace_integrations')
    .select('metadata')
    .eq('organization_id', organizationId)
    .eq('service', 'environment')
    .maybeSingle();

  const keys = integration?.metadata?.keys as Record<string, string> | undefined;
  const rawValue = keys?.[keyName];

  if (!rawValue) return process.env[keyName] || null;

  try {
    return decrypt(rawValue);
  } catch {
    return rawValue;
  }
}
