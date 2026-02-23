-- Enable RLS on all tables (fixes UNRESTRICTED tables from partial migrations)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts, then recreate
DROP POLICY IF EXISTS "Users see own org" ON organizations;
CREATE POLICY "Users see own org" ON organizations FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users see own projects" ON projects;
CREATE POLICY "Users see own projects" ON projects FOR ALL
  USING (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users see own teams" ON teams;
CREATE POLICY "Users see own teams" ON teams FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())));

DROP POLICY IF EXISTS "Users see own workflows" ON workflows;
CREATE POLICY "Users see own workflows" ON workflows FOR ALL
  USING (team_id IN (SELECT id FROM teams WHERE project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))))
  WITH CHECK (team_id IN (SELECT id FROM teams WHERE project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))));

DROP POLICY IF EXISTS "Users see own workflow runs" ON workflow_runs;
CREATE POLICY "Users see own workflow runs" ON workflow_runs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users see own agents" ON agents;
CREATE POLICY "Users see own agents" ON agents FOR ALL
  USING (team_id IN (SELECT id FROM teams WHERE project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))))
  WITH CHECK (team_id IN (SELECT id FROM teams WHERE project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))));

DROP POLICY IF EXISTS "Users see own workflow steps" ON workflow_steps;
CREATE POLICY "Users see own workflow steps" ON workflow_steps FOR ALL
  USING (workflow_run_id IN (SELECT id FROM workflow_runs WHERE user_id = auth.uid()))
  WITH CHECK (workflow_run_id IN (SELECT id FROM workflow_runs WHERE user_id = auth.uid()));
