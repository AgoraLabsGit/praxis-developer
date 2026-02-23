-- Repair: Ensure full schema exists (handles partial migrations)
-- Create base tables if missing (order matters for FKs)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  github_repo TEXT,
  color TEXT DEFAULT '#3B82F6',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Development',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create workflows if missing
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Feature Development',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create workflow_runs if missing (required for workflow_steps)
CREATE TABLE IF NOT EXISTS workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'running',
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 5,
  input_task TEXT NOT NULL,
  pr_url TEXT,
  total_cost DECIMAL(10,4) DEFAULT 0.00,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  estimated_completion TIMESTAMP
);

-- Drop agents FK from tasks, drop agents, recreate
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assigned_agent_id_fkey;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_agent_id_fkey;
DROP TABLE IF EXISTS workflow_steps;
DROP TABLE IF EXISTS agents CASCADE;

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  model_provider TEXT DEFAULT 'anthropic',
  model_name TEXT DEFAULT 'claude-3-5-sonnet-20241022',
  system_prompt TEXT NOT NULL DEFAULT 'You are a helpful AI agent.',
  max_cost_per_run DECIMAL(10,4) DEFAULT 5.00,
  monthly_budget DECIMAL(10,2) DEFAULT 200.00,
  current_month_spend DECIMAL(10,2) DEFAULT 0.00,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id UUID REFERENCES workflow_runs(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id),
  step_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  input_data TEXT,
  output_data TEXT,
  cost DECIMAL(10,4) DEFAULT 0.00,
  tokens_used INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_seconds INTEGER
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own agents" ON agents;
CREATE POLICY "Users see own agents" ON agents FOR ALL
  USING (team_id IN (SELECT id FROM teams WHERE project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))));

DROP POLICY IF EXISTS "Users see own workflow steps" ON workflow_steps;
CREATE POLICY "Users see own workflow steps" ON workflow_steps FOR ALL
  USING (workflow_run_id IN (SELECT id FROM workflow_runs WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_agents_team ON agents(team_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_run ON workflow_steps(workflow_run_id);

-- Re-add tasks FK if column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assigned_agent_id') THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_assigned_agent_id_fkey
      FOREIGN KEY (assigned_agent_id) REFERENCES agents(id);
  END IF;
END $$;
