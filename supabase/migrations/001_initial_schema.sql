-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projects (MVP: multiple projects supported)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  github_repo TEXT,
  color TEXT DEFAULT '#3B82F6',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Teams (MVP: one team per project = "Development")
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Development',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Agents (GMAD stack with configs)
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Workflow (MVP: hardcoded GMAD, one per team)
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Feature Development',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workflow runs (execution history)
CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Workflow steps (execution log)
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Tasks (roadmap items)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  assigned_agent_id UUID REFERENCES agents(id),
  workflow_run_id UUID REFERENCES workflow_runs(id),
  due_date DATE,
  completed_at TIMESTAMP,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  workflow_run_id UUID REFERENCES workflow_runs(id),
  sender_type TEXT NOT NULL,
  sender_name TEXT,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Integrations (MVP: GitHub only)
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'GitHub',
  type TEXT NOT NULL DEFAULT 'github',
  config JSONB NOT NULL,
  status TEXT DEFAULT 'connected',
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  project_id UUID REFERENCES projects(id),
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own org" ON organizations FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "Users see own projects" ON projects FOR ALL
  USING (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE POLICY "Users see own teams" ON teams FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())));

CREATE POLICY "Users see own agents" ON agents FOR ALL
  USING (team_id IN (SELECT id FROM teams WHERE project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))));

CREATE POLICY "Users see own workflow runs" ON workflow_runs FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users see own workflow steps" ON workflow_steps FOR ALL
  USING (workflow_run_id IN (SELECT id FROM workflow_runs WHERE user_id = auth.uid()));

CREATE POLICY "Users see own tasks" ON tasks FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())));

CREATE POLICY "Users see own chat messages" ON chat_messages FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())));

CREATE POLICY "Users see own integrations" ON integrations FOR ALL
  USING (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE POLICY "Users see own activity" ON activity_log FOR ALL
  USING (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE workflow_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE workflow_steps;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;

-- Indexes
CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_teams_project ON teams(project_id);
CREATE INDEX idx_agents_team ON agents(team_id);
CREATE INDEX idx_workflow_runs_user ON workflow_runs(user_id);
CREATE INDEX idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX idx_workflow_steps_run ON workflow_steps(workflow_run_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_chat_project ON chat_messages(project_id);
CREATE INDEX idx_activity_org ON activity_log(organization_id);
CREATE INDEX idx_activity_project ON activity_log(project_id);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
