import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { executeWorkflowAsync } from '@/lib/agents/workflow-executor';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, task } = body;

    if (!projectId || !task || typeof task !== 'string') {
      return NextResponse.json(
        { error: 'Missing projectId or task' },
        { status: 400 }
      );
    }

    const { data: team } = await supabase
      .from('teams')
      .select('id')
      .eq('project_id', projectId)
      .single();

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const { data: workflow } = await supabase
      .from('workflows')
      .select('id')
      .eq('team_id', team.id)
      .single();

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    const { data: project } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single();

    if (!project?.organization_id) {
      return NextResponse.json(
        { error: 'Project organization not found' },
        { status: 404 }
      );
    }

    const { data: run, error: runError } = await supabase
      .from('workflow_runs')
      .insert({
        workflow_id: workflow.id,
        user_id: user.id,
        input_task: task,
        status: 'queued',
        total_steps: 5,
        estimated_completion: new Date(Date.now() + 26 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (runError) {
      console.error('Error creating workflow run:', runError);
      return NextResponse.json(
        { error: 'Failed to create workflow run' },
        { status: 500 }
      );
    }

    await supabase.from('chat_messages').insert({
      project_id: projectId,
      user_id: user.id,
      workflow_run_id: run.id,
      sender_type: 'system',
      content: `🚀 Starting Feature Development workflow...\n\nTask: ${task}\n\nEstimated time: ~26 minutes`,
      metadata: { workflow_run_id: run.id, status: 'queued' },
    });

    await supabase.from('activity_log').insert({
      organization_id: project.organization_id,
      project_id: projectId,
      event_type: 'workflow_started',
      description: `Workflow started: ${task}`,
      metadata: { workflow_run_id: run.id, task },
    });

    const adminSupabase = createAdminClient();
    executeWorkflowAsync(adminSupabase, {
      runId: run.id,
      projectId,
      organizationId: project.organization_id,
      task,
      userId: user.id,
    }).catch((err) => {
      console.error('Workflow execution error:', err);
    });

    return NextResponse.json({
      success: true,
      runId: run.id,
    });
  } catch (error) {
    console.error('Workflow run error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
