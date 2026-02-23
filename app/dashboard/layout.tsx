import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProjectSelector } from '@/components/project-selector';
import { ChatSidebar } from '@/components/chat-sidebar';
import Link from 'next/link';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId?: string };
}) {
  const supabase = await createServerSupabaseClient();
  const { projectId } = params ?? {};

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/login');
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!org) {
    redirect('/onboard');
  }

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
    .eq('organization_id', org.id)
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
    <div className="h-screen flex flex-col">
      <header className="h-16 border-b flex items-center justify-between px-6 bg-background">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xl font-bold">
            Praxis Developer
          </Link>
          <ProjectSelector projects={projectsWithCount} currentProjectId={projectId} />
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Projects
          </Link>
          <span className="text-sm text-muted-foreground">
            @{user.email?.split('@')[0]}
          </span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-muted/30">{children}</main>

        <aside className="hidden lg:flex w-96 border-l bg-background flex-col">
          <ChatSidebar projectId={projectId} />
        </aside>
      </div>
    </div>
  );
}
