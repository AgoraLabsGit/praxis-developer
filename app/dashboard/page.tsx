import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  TrendingUp,
  Clock,
  DollarSign,
  Zap,
  Plus,
  ArrowRight,
  CheckCircle2,
  Loader2,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user!.id)
    .single();

  // Fetch projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', org!.id)
    .eq('status', 'active')
    .limit(6);

  // Fetch recent workflow runs with corrected relations
  const { data: recentRuns } = await supabase
    .from('workflow_runs')
    .select(
      `
      *,
      workflow:workflows (
        name,
        team:teams (
          project:projects (
            id,
            name,
            color
          )
        )
      )
    `
    )
    .eq('user_id', user!.id)
    .order('started_at', { ascending: false })
    .limit(5);

  // Fetch agent counts for projects
  const projectsWithAgents = await Promise.all(
    (projects || []).map(async (project) => {
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('project_id', project.id)
        .single();

      if (!team) return { ...project, agentCount: 0 };

      const { count } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', team.id);

      return { ...project, agentCount: count || 0 };
    })
  );

  // Calculate stats
  const totalWorkflows = recentRuns?.length || 0;
  const completedWorkflows =
    recentRuns?.filter((r) => r.status === 'completed').length || 0;
  const totalCost =
    recentRuns?.reduce((sum, r) => sum + (parseFloat(String(r.total_cost)) || 0), 0) || 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Welcome back, {user?.email?.split('@')[0]}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your AI development
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Zap}
          label="Total Workflows"
          value={totalWorkflows.toString()}
          trend="+12% from last week"
          trendUp
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={completedWorkflows.toString()}
          trend={`${totalWorkflows > 0 ? Math.round((completedWorkflows / totalWorkflows) * 100) : 0}% success rate`}
        />
        <StatCard
          icon={DollarSign}
          label="Total Spend"
          value={`$${totalCost.toFixed(2)}`}
          trend="This month"
        />
        <StatCard
          icon={Clock}
          label="Avg. Time"
          value="26 min"
          trend="Per workflow"
        />
      </div>

      {/* Projects Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Projects</h2>
          <Link href="/dashboard/new-project">
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </Link>
        </div>

        {projectsWithAgents && projectsWithAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectsWithAgents.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Create your first project
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started with AI-powered development
            </p>
            <Link href="/dashboard/new-project">
              <Button>Create Project</Button>
            </Link>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Workflows</h2>
        {recentRuns && recentRuns.length > 0 ? (
          <Card className="divide-y">
            {recentRuns.map((run) => (
              <WorkflowActivityItem key={run.id} run={run} />
            ))}
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No workflow activity yet. Start by creating a task in your
              roadmap.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  trend: string;
  trendUp?: boolean;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <Icon className="w-5 h-5 text-foreground" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div
        className={`text-xs flex items-center gap-1 ${
          trendUp ? 'text-success' : 'text-muted-foreground'
        }`}
      >
        {trendUp && <TrendingUp className="w-3 h-3" />}
        {trend}
      </div>
    </Card>
  );
}

interface ProjectWithAgents {
  id: string;
  name: string;
  description?: string;
  color?: string;
  agentCount: number;
}

function ProjectCard({ project }: { project: ProjectWithAgents }) {
  return (
    <Link href={`/dashboard/${project.id}`}>
      <Card className="p-6 hover:bg-accent/50 transition-all duration-200 cursor-pointer group hover:border-foreground/20">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
            style={{ backgroundColor: project.color || '#3B82F6' }}
          >
            {project.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate transition-colors">
              {project.name}
            </h3>
            {project.description && (
              <p className="text-sm text-muted-foreground truncate">
                {project.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {project.agentCount} agents
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
        </div>
      </Card>
    </Link>
  );
}

interface WorkflowRun {
  id: string;
  input_task: string;
  status: string;
  started_at: string;
  total_cost?: number | string;
  pr_url?: string;
  workflow?: {
    team?: {
      project?: { id: string; name: string; color?: string };
    };
  };
}

function WorkflowActivityItem({ run }: { run: WorkflowRun }) {
  const project = run.workflow?.team?.project;
  const statusIcon = {
    completed: <CheckCircle2 className="w-5 h-5 text-success" />,
    running: <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />,
    failed: <XCircle className="w-5 h-5 text-destructive" />,
  }[run.status] || <Clock className="w-5 h-5 text-muted-foreground" />;

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors">
      {statusIcon}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {project && (
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: project.color || '#3B82F6' }}
            />
          )}
          <span className="font-medium truncate">{run.input_task}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
          {run.total_cost && ` • $${parseFloat(String(run.total_cost)).toFixed(2)}`}
        </div>
      </div>

      {run.status === 'completed' && run.pr_url && (
        <Link href={run.pr_url} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            View PR
            <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      )}
    </div>
  );
}
