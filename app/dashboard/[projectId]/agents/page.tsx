import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AgentCard } from '@/components/agent-card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default async function AgentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('project_id', projectId)
    .single();

  if (!team) {
    redirect('/dashboard');
  }

  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('team_id', team.id)
    .order('created_at', { ascending: true });

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/dashboard/${projectId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Agents</h2>
          <p className="text-muted-foreground">
            Configure your GMAD agent stack
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {agents?.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-3 gap-6">
        <div className="p-6 rounded-lg border bg-card">
          <div className="text-2xl font-bold">$0.00</div>
          <div className="text-sm text-muted-foreground">
            Total Spend (This Month)
          </div>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <div className="text-2xl font-bold">0</div>
          <div className="text-sm text-muted-foreground">
            Workflows Completed
          </div>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <div className="text-2xl font-bold">—</div>
          <div className="text-sm text-muted-foreground">
            Avg. Workflow Time
          </div>
        </div>
      </div>
    </div>
  );
}
