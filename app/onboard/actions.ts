'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { DEFAULT_AGENT_CONFIGS } from '@/lib/agent-prompts';

export async function createOrganizationForUser(userId: string) {
  const supabase = createAdminClient();

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ owner_id: userId, name: 'My Organization' })
    .select('id')
    .single();

  if (orgError || !org) {
    throw new Error(
      orgError ? `Failed to create organization: ${orgError.message}` : 'Failed to create organization'
    );
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      organization_id: org.id,
      name: 'My First Project',
      description: 'Get started with Praxis Developer',
    })
    .select('id')
    .single();

  if (projectError || !project) {
    throw new Error(
      projectError ? `Failed to create project: ${projectError.message}` : 'Failed to create project'
    );
  }

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({ project_id: project.id, name: 'Development' })
    .select('id')
    .single();

  if (teamError || !team) {
    throw new Error(
      teamError ? `Failed to create team: ${teamError.message}` : 'Failed to create team'
    );
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

  return org.id;
}
