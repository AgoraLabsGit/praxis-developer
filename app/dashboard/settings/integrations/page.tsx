import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Github, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GitHubIntegrationCard } from './github-integration-card';

export default async function IntegrationsPage({
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
  let aiProviders: { id: string; name: string; is_default: boolean }[] = [];

  if (org) {
    const { data } = await supabase
      .from('workspace_integrations')
      .select('id, metadata')
      .eq('organization_id', org.id)
      .eq('service', 'github')
      .maybeSingle();
    githubIntegration = data;

    const { data: providers } = await supabase
      .from('ai_providers')
      .select('id, name, is_default')
      .eq('organization_id', org.id);
    aiProviders = providers ?? [];
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Connect your accounts and AI providers for GMAD workflows
        </p>
      </div>

      {/* GitHub */}
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

      {/* AI Providers */}
      <section className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">AI Providers</h3>
            <p className="text-sm text-muted-foreground">
              Configure OpenRouter, OpenAI, Anthropic, and more
            </p>
          </div>
        </div>

        {aiProviders.length > 0 ? (
          <div className="space-y-2">
            {aiProviders.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
              >
                <span className="font-medium capitalize">{p.name}</span>
                {p.is_default && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                    Default
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">
            No AI providers configured yet.
          </p>
        )}

        <Link href="/dashboard/settings/integrations/ai-providers">
          <Button variant="outline">Add AI Provider</Button>
        </Link>
      </section>
    </div>
  );
}
