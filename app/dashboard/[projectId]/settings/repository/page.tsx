import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RepositorySettingsForm } from './repository-settings-form';

export default async function RepositorySettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, organization_id, github_repo, default_branch')
    .eq('id', projectId)
    .single();

  if (!project) {
    redirect('/dashboard');
  }

  const orgId = project.organization_id;
  const { data: githubConnected } = orgId
    ? await supabase
        .from('workspace_integrations')
        .select('id')
        .eq('organization_id', orgId)
        .eq('service', 'github')
        .maybeSingle()
    : { data: null };

  return (
    <div className="space-y-6 rounded-lg border bg-card p-6">
      <RepositorySettingsForm
        projectId={projectId}
        githubRepo={project.github_repo ?? ''}
        defaultBranch={project.default_branch ?? 'main'}
        githubConnected={!!githubConnected}
      />
    </div>
  );
}
