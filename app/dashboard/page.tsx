import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ProjectCard } from '@/components/project-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user!.id)
    .single();

  const { data: projects } = await supabase
    .from('projects')
    .select(
      `
      *,
      teams (
        id,
        agents (id)
      )
    `
    )
    .eq('organization_id', org!.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const projectsWithCount = (projects || []).map((p) => ({
    ...p,
    teams: p.teams?.map((t: { id: string; agents?: { id: string }[] }) => ({
      ...t,
      agents: t.agents ?? [],
    })),
  }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Your Projects</h1>
          <p className="text-muted-foreground">
            Manage your AI-powered development projects
          </p>
        </div>

        <Link href="/dashboard/new-project">
          <Button>+ New Project</Button>
        </Link>
      </div>

      {projectsWithCount && projectsWithCount.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectsWithCount.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Package className="h-16 w-16 mx-auto text-muted-foreground" />}
          title="No projects yet"
          description="Create your first project to get started"
          actionLabel="Create Project"
          actionHref="/dashboard/new-project"
        />
      )}
    </div>
  );
}
