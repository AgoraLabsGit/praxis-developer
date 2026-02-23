import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProjectSettingsGeneralPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (!project) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6 rounded-lg border bg-card p-6">
      <div>
        <h3 className="font-medium mb-2">Project Name</h3>
        <p className="text-muted-foreground">{project.name}</p>
      </div>
      <div>
        <h3 className="font-medium mb-2">Description</h3>
        <p className="text-muted-foreground">
          {project.description || 'No description'}
        </p>
      </div>
      <div>
        <h3 className="font-medium mb-2">GitHub Repository</h3>
        <p className="text-muted-foreground">
          {project.github_repo || 'Not connected'}
        </p>
      </div>
    </div>
  );
}
