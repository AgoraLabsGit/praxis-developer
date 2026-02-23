import type { SupabaseClient } from '@supabase/supabase-js';
import { executeAgent } from './execute-agent';
import { createPullRequest } from '@/lib/github/create-pull-request';
import {
  parseCodeFiles,
  extractPRTitle,
  extractPRBody,
} from '@/lib/utils/parse-code-files';

interface WorkflowContext {
  runId: string;
  projectId: string;
  organizationId: string;
  task: string;
  userId: string | null;
}

/**
 * Executes the GMAD workflow asynchronously.
 * Uses real LLM calls via executeAgent (Keys fallback supported).
 */
export async function executeWorkflowAsync(
  supabase: SupabaseClient,
  ctx: WorkflowContext
): Promise<void> {
  const { runId, projectId, organizationId, task, userId } = ctx;

  try {
    await supabase
      .from('workflow_runs')
      .update({ status: 'running', current_step: 1 })
      .eq('id', runId);

    const { data: team } = await supabase
      .from('teams')
      .select('id')
      .eq('project_id', projectId)
      .single();

    if (!team) {
      throw new Error('Team not found');
    }

    const { data: agents } = await supabase
      .from('agents')
      .select('id, name, type')
      .eq('team_id', team.id)
      .order('created_at', { ascending: true });

    const agentMap = {
      research: agents?.find((a) => a.type === 'research'),
      builder: agents?.find((a) => a.type === 'builder'),
      review: agents?.find((a) => a.type === 'review'),
      sync: agents?.find((a) => a.type === 'sync'),
    };

    const steps: { num: number; agent: { id: string; name: string } | null; name: string; prompt: (prev: string) => string }[] = [
      {
        num: 1,
        agent: agentMap.research ?? null,
        name: 'Research',
        prompt: (t) => `Research best practices for: ${t}\n\nProvide a concise summary with recommendations.`,
      },
      {
        num: 2,
        agent: agentMap.builder ?? null,
        name: 'Generate PRD',
        prompt: (prev) => `Create a technical PRD for: ${task}\n\nResearch context:\n${prev}\n\nOutput a structured PRD.`,
      },
      {
        num: 3,
        agent: agentMap.builder ?? null,
        name: 'Implementation',
        prompt: (prev) => `Implement the following PRD:\n${prev}\n\nProvide code snippets and implementation notes.`,
      },
      {
        num: 4,
        agent: agentMap.review ?? null,
        name: 'Review',
        prompt: (prev) => `Review this implementation for bugs and security issues:\n${prev}\n\nProvide a review summary.`,
      },
      {
        num: 5,
        agent: agentMap.sync ?? null,
        name: 'Sync to GitHub',
        prompt: (prev) => `Summarize for a GitHub PR: ${task}\n\nImplementation:\n${prev}\n\nProvide PR title and description.`,
      },
    ];

    let prevOutput = task;
    let implementationOutput = '';
    const prState = { url: null as string | null };

    // Limit prompt size to avoid runaway token costs (~16K chars ≈ 4K tokens)
    const MAX_PROMPT_CHARS = 16_000;
    const truncate = (s: string) =>
      s.length > MAX_PROMPT_CHARS ? s.substring(0, MAX_PROMPT_CHARS) + '\n\n[...truncated]' : s;

    for (const step of steps) {
      const agent = step.agent;
      if (!agent) {
        prevOutput = `[${step.name} - no agent configured]`;
        await recordStep(supabase, runId, projectId, step.num, step.name, null, prevOutput, 0);
        await supabase.from('workflow_runs').update({ current_step: step.num }).eq('id', runId);
        continue;
      }

      await recordStepStart(supabase, runId, projectId, step.num, agent, step.name);

      const startTime = Date.now();
      let output: string;
      try {
        // Step 5: Use single sync prompt only (avoids double LLM call - was calling executeAgent twice)
        if (step.num === 5) {
          const syncPrompt = `Create a GitHub PR for this implementation.

Task: ${task}
Implementation: ${truncate(implementationOutput)}

Your output should include:
Title: [Clear, concise PR title]
Description: [Detailed PR description]
`;
          output = await executeAgent(supabase, agent.id, syncPrompt, organizationId);
        } else {
          output = await executeAgent(supabase, agent.id, truncate(step.prompt(prevOutput)), organizationId);
        }
      } catch (err) {
        output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      }
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);

      if (step.num === 3) {
        implementationOutput = output;
      }

      // Step 5 (Sync): Create real GitHub PR
      if (step.num === 5) {
        try {

          const prTitle = extractPRTitle(output) || task;
          const prBody =
            extractPRBody(output) ||
            `Implementation for: ${task}\n\n${implementationOutput.substring(0, 500)}`;

          const files = parseCodeFiles(implementationOutput);

          if (files.length === 0) {
            throw new Error(
              'No code files found in implementation. Builder Agent must output code in format: ## path/to/file.ts\\n```typescript\\ncode\\n```'
            );
          }

          prState.url = await createPullRequest({
            organizationId,
            projectId,
            title: prTitle,
            body: prBody,
            files,
          });

          await recordStepComplete(
            supabase,
            runId,
            projectId,
            step.num,
            agent,
            step.name,
            `${output}\n\nPR: ${prState.url}`,
            Math.round((Date.now() - startTime) / 1000)
          );

          await supabase.from('chat_messages').insert({
            project_id: projectId,
            user_id: userId,
            workflow_run_id: runId,
            sender_type: 'agent',
            sender_name: agent.name,
            content: `✅ Created pull request: ${prState.url}`,
            metadata: { step_number: step.num, agent_id: agent.id, pr_url: prState.url },
          });
        } catch (syncErr) {
          console.error('Sync agent error:', syncErr);
          const errorMessage =
            syncErr instanceof Error ? syncErr.message : String(syncErr);
          output = `Error: ${errorMessage}`;

          await recordStepComplete(
            supabase,
            runId,
            projectId,
            step.num,
            agent,
            step.name,
            output,
            Math.round((Date.now() - startTime) / 1000)
          );

          await supabase.from('chat_messages').insert({
            project_id: projectId,
            user_id: userId,
            workflow_run_id: runId,
            sender_type: 'agent',
            sender_name: agent.name,
            content: `❌ Sync failed: ${errorMessage}`,
            metadata: { step_number: step.num, agent_id: agent.id },
          });
        }

        prevOutput = output;

        await supabase.from('chat_messages').insert({
          project_id: projectId,
          user_id: userId,
          workflow_run_id: runId,
          sender_type: 'system',
          content: prState.url
            ? `✅ Workflow completed!\n\nPull request: ${prState.url}`
            : `✅ Workflow completed with sync error. Check Sync step for details.`,
          metadata: { workflow_run_id: runId, pr_url: prState.url },
        });
      } else {
        await recordStepComplete(
          supabase,
          runId,
          projectId,
          step.num,
          agent,
          step.name,
          output,
          durationSeconds
        );
        prevOutput = output;
      }
    }

    // Update workflow run status and insert completion message if step 5 didn't
    const { data: lastStep } = await supabase
      .from('workflow_steps')
      .select('step_number')
      .eq('workflow_run_id', runId)
      .order('step_number', { ascending: false })
      .limit(1)
      .single();

    await supabase
      .from('workflow_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        pr_url: prState.url,
      })
      .eq('id', runId);

    if (lastStep?.step_number !== 5) {
      await supabase.from('chat_messages').insert({
        project_id: projectId,
        user_id: userId,
        workflow_run_id: runId,
        sender_type: 'system',
        content: `✅ Workflow completed!`,
        metadata: { workflow_run_id: runId },
      });
    }

    await supabase.from('tasks').insert({
      project_id: projectId,
      title: task,
      description: 'Created by GMAD workflow',
      status: 'in_review',
      workflow_run_id: runId,
      priority: 'medium',
    });

    const { data: project } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single();

    if (project?.organization_id) {
      await supabase.from('activity_log').insert({
        organization_id: project.organization_id,
        project_id: projectId,
        event_type: 'workflow_completed',
        description: `Workflow completed: ${task}`,
        metadata: { workflow_run_id: runId, pr_url: prState.url ?? undefined },
      });
    }
  } catch (error) {
    console.error('Workflow execution error:', error);

    await supabase
      .from('workflow_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    await supabase.from('chat_messages').insert({
      project_id: projectId,
      user_id: userId,
      workflow_run_id: runId,
      sender_type: 'system',
      content: `❌ Workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      metadata: { workflow_run_id: runId, error: String(error) },
    });
  }
}

async function recordStepStart(
  supabase: SupabaseClient,
  runId: string,
  projectId: string,
  stepNumber: number,
  agent: { id: string; name: string },
  stepName: string
) {
  await supabase.from('workflow_steps').insert({
    workflow_run_id: runId,
    agent_id: agent.id,
    step_number: stepNumber,
    name: stepName,
    status: 'running',
    started_at: new Date().toISOString(),
  });

  await supabase.from('workflow_runs').update({ current_step: stepNumber }).eq('id', runId);

  await supabase.from('chat_messages').insert({
    project_id: projectId,
    workflow_run_id: runId,
    sender_type: 'agent',
    sender_name: agent.name,
    content: `🔄 ${stepName} started...`,
    metadata: { step_number: stepNumber, agent_id: agent.id },
  });
}

async function recordStep(
  supabase: SupabaseClient,
  runId: string,
  projectId: string,
  stepNumber: number,
  stepName: string,
  agentId: string | null,
  output: string,
  durationSeconds: number
) {
  const { data: steps } = await supabase
    .from('workflow_steps')
    .select('id')
    .eq('workflow_run_id', runId)
    .eq('step_number', stepNumber)
    .order('started_at', { ascending: false })
    .limit(1);

  const stepId = steps?.[0]?.id;
  if (stepId) {
    await supabase
      .from('workflow_steps')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        output_data: output,
        cost: 0.1,
        duration_seconds: durationSeconds,
      })
      .eq('id', stepId);
  } else {
    await supabase.from('workflow_steps').insert({
      workflow_run_id: runId,
      agent_id: agentId,
      step_number: stepNumber,
      name: stepName,
      status: 'completed',
      output_data: output,
      cost: 0.1,
      duration_seconds: durationSeconds,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });
  }
}

async function recordStepComplete(
  supabase: SupabaseClient,
  runId: string,
  projectId: string,
  stepNumber: number,
  agent: { id: string; name: string },
  stepName: string,
  output: string,
  durationSeconds: number
) {
  const { data: steps } = await supabase
    .from('workflow_steps')
    .select('id')
    .eq('workflow_run_id', runId)
    .eq('step_number', stepNumber)
    .order('started_at', { ascending: false })
    .limit(1);

  const stepId = steps?.[0]?.id;
  if (stepId) {
    await supabase
      .from('workflow_steps')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        output_data: output,
        cost: 0.1,
        duration_seconds: durationSeconds,
      })
      .eq('id', stepId);
  }

  await supabase.from('chat_messages').insert({
    project_id: projectId,
    workflow_run_id: runId,
    sender_type: 'agent',
    sender_name: agent.name,
    content: `✅ ${stepName} completed\n\n${output.substring(0, 500)}${output.length > 500 ? '...' : ''}`,
    metadata: { step_number: stepNumber, agent_id: agent.id, cost: 0.1 },
  });
}
