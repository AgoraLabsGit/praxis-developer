import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Triangle, Database } from 'lucide-react';
import { VercelIntegrationCard } from './vercel-integration-card';
import { SupabaseIntegrationCard } from './supabase-integration-card';

export default async function InfrastructurePage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: org } = user
    ? await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single()
    : { data: null };

  let vercelIntegration: { metadata: Record<string, unknown> } | null = null;
  if (org) {
    const { data } = await supabase
      .from('workspace_integrations')
      .select('metadata')
      .eq('organization_id', org.id)
      .eq('service', 'vercel')
      .maybeSingle();
    vercelIntegration = data;
  }

  const vercelProjectId = vercelIntegration?.metadata?.project_id as string | undefined;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseConfigured = !!(supabaseUrl && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Infrastructure</h2>
        <p className="text-sm text-muted-foreground">
          Connect deployment and database services for preview URLs and data
        </p>
      </div>

      {/* Vercel */}
      <section className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-black dark:bg-white flex items-center justify-center">
            <Triangle className="w-5 h-5 text-white dark:text-black" />
          </div>
          <div>
            <h3 className="font-medium">Vercel</h3>
            <p className="text-sm text-muted-foreground">
              Deployments, preview URLs, and project linking
            </p>
          </div>
        </div>

        <VercelIntegrationCard
          configured={!!vercelIntegration}
          projectId={vercelProjectId}
        />
      </section>

      {/* Supabase */}
      <section className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#3ECF8E]/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-[#3ECF8E]" />
          </div>
          <div>
            <h3 className="font-medium">Supabase</h3>
            <p className="text-sm text-muted-foreground">
              Database, auth, and real-time—configured via environment
            </p>
          </div>
        </div>

        <SupabaseIntegrationCard
          configured={supabaseConfigured}
          projectUrl={supabaseUrl ?? null}
        />
      </section>
    </div>
  );
}
