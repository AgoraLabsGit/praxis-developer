'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { DEFAULT_AGENT_CONFIGS } from '@/lib/agent-prompts';

export async function createProject(
  organizationId: string,
  name: string,
  description: string
): Promise<string> {
  const supabase = await createServerSupabaseClient();

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      organization_id: organizationId,
      name,
      description: description || null,
    })
    .select('id')
    .single();

  if (projectError || !project) {
    throw new Error('Failed to create project');
  }

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({ project_id: project.id, name: 'Development' })
    .select('id')
    .single();

  if (teamError || !team) {
    throw new Error('Failed to create team');
  }

  await supabase.from('workflows').insert({
    team_id: team.id,
    name: 'Feature Development',
  });

  const agentConfigs = Object.values(DEFAULT_AGENT_CONFIGS);
  await supabase.from('agents').insert(
    agentConfigs.map((config) => ({
      team_id: team.id,
      name: config.name,
      type: config.type,
      model_provider: config.model_provider,
      model_name: config.model_name,
      system_prompt: config.system_prompt,
      max_cost_per_run: config.max_cost_per_run,
      monthly_budget: config.monthly_budget,
    }))
  );

  return project.id;
}
