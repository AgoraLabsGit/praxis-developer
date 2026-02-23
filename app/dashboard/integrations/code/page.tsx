import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Github } from 'lucide-react';
import { GitHubIntegrationCard } from '../github-integration-card';

export default async function CodeIntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const params = await searchParams;

  const { data: { user } } = await supabase.auth.getUser();
  const { data: org } = user
    ? await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single()
    : { data: null };

  let githubIntegration: { id: string; metadata: Record<string, unknown> } | null = null;

  if (org) {
    const { data } = await supabase
      .from('workspace_integrations')
      .select('id, metadata')
      .eq('organization_id', org.id)
      .eq('service', 'github')
      .maybeSingle();
    githubIntegration = data;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Code & Repos</h2>
        <p className="text-sm text-muted-foreground">
          Connect GitHub for pull requests and code sync
        </p>
      </div>

      <section className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#24292f] dark:bg-[#0d1117] flex items-center justify-center">
            <Github className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-medium">GitHub</h3>
            <p className="text-sm text-muted-foreground">
              Create pull requests and sync code
            </p>
          </div>
        </div>

        <GitHubIntegrationCard
          connected={!!githubIntegration}
          metadata={githubIntegration?.metadata}
          error={params.error}
          connectedService={params.connected}
        />
      </section>
    </div>
  );
}
