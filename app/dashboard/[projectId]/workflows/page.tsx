import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Workflow, Clock, DollarSign, CheckCircle2 } from 'lucide-react';

export default async function WorkflowsPage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = await createServerSupabaseClient();

  // Get team for this project
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('project_id', params.projectId)
    .single();

  if (!team) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <p className="text-muted-foreground">Team not found</p>
      </div>
    );
  }

  // Get workflow (one per team)
  const { data: workflow } = await supabase
    .from('workflows')
    .select('*')
    .eq('team_id', team.id)
    .maybeSingle();

  // Get workflow runs (use workflow id if exists)
  const { data: runs } = workflow
    ? await supabase
        .from('workflow_runs')
        .select('*')
        .eq('workflow_id', workflow.id)
        .order('started_at', { ascending: false })
        .limit(20)
    : { data: [] };

  const totalRuns = runs?.length || 0;
  const completedRuns =
    runs?.filter((r) => r.status === 'completed').length || 0;
  const totalCost =
    runs?.reduce((sum, r) => sum + (parseFloat(String(r.total_cost)) || 0), 0) || 0;

  // Calculate avg duration from started_at and completed_at
  const avgTime =
    runs && runs.length > 0
      ? runs.reduce((sum, r) => {
          if (r.completed_at && r.started_at) {
            const duration =
              (new Date(r.completed_at).getTime() -
                new Date(r.started_at).getTime()) /
              1000;
            return sum + duration;
          }
          return sum;
        }, 0) / runs.length
      : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Workflows</h1>
        <p className="text-muted-foreground">
          Manage and monitor your GMAD workflow
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Workflow className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Total Runs
            </span>
          </div>
          <div className="text-2xl font-bold">{totalRuns}</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-muted-foreground">
              Success Rate
            </span>
          </div>
          <div className="text-2xl font-bold">
            {totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0}%
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Total Cost
            </span>
          </div>
          <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Avg. Duration
            </span>
          </div>
          <div className="text-2xl font-bold">
            {Math.round(avgTime / 60)} min
          </div>
        </Card>
      </div>

      {/* Workflow Card */}
      {workflow ? (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Workflow className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{workflow.name}</h2>
              <p className="text-sm text-muted-foreground">
                GMAD: Research → PRD → Build → Review → Sync
              </p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4">
            {['Research', 'Generate PRD', 'Implementation', 'Review', 'Sync'].map(
              (step, i) => (
                <div key={i} className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <span className="font-bold text-primary">{i + 1}</span>
                  </div>
                  <div className="text-sm font-medium">{step}</div>
                </div>
              )
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <p className="text-muted-foreground">
            No workflow configured for this project yet.
          </p>
        </Card>
      )}

      {/* Recent Runs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Runs</h2>
        {runs && runs.length > 0 ? (
          <div className="space-y-2">
            {runs.map((run) => (
              <Card key={run.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium mb-1">{run.input_task}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(run.started_at).toLocaleString()}
                      {run.total_cost &&
                        ` • $${parseFloat(String(run.total_cost)).toFixed(2)}`}
                    </div>
                  </div>
                  <Badge
                    variant={
                      run.status === 'completed'
                        ? 'default'
                        : run.status === 'running'
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {run.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No workflow runs yet</p>
          </Card>
        )}
      </div>
    </div>
  );
}
