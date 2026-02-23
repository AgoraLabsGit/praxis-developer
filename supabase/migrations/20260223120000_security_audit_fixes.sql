-- Security Audit Fixes (Feb 2025)
-- Addresses: RLS policy hardening, auth.uid() caching, indexes, WITH CHECK consistency
-- Defensive: only runs for tables that exist (handles partial remote schema)

-- =============================================================================
-- 1. Add indexes for RLS policy performance (owner_id, organization_id)
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
    CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflow_runs') THEN
    CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow ON workflow_runs(workflow_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integrations') THEN
    CREATE INDEX IF NOT EXISTS idx_integrations_organization ON integrations(organization_id);
  END IF;
END $$;

-- =============================================================================
-- 2. Recreate RLS policies (only for tables that exist)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
    DROP POLICY IF EXISTS "Users see own org" ON organizations;
    CREATE POLICY "Users see own org" ON organizations
      FOR ALL TO authenticated
      USING (owner_id = (SELECT auth.uid()))
      WITH CHECK (owner_id = (SELECT auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
    DROP POLICY IF EXISTS "Users see own projects" ON projects;
    CREATE POLICY "Users see own projects" ON projects
      FOR ALL TO authenticated
      USING (organization_id IN (SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid())))
      WITH CHECK (organization_id IN (SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid())));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teams') THEN
    DROP POLICY IF EXISTS "Users see own teams" ON teams;
    CREATE POLICY "Users see own teams" ON teams
      FOR ALL TO authenticated
      USING (project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid()))))
      WITH CHECK (project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid()))));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflows') THEN
    DROP POLICY IF EXISTS "Users see own workflows" ON workflows;
    CREATE POLICY "Users see own workflows" ON workflows
      FOR ALL TO authenticated
      USING (team_id IN (SELECT id FROM teams WHERE project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid())))))
      WITH CHECK (team_id IN (SELECT id FROM teams WHERE project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid())))));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflow_runs') THEN
    DROP POLICY IF EXISTS "Users see own workflow runs" ON workflow_runs;
    CREATE POLICY "Users see own workflow runs" ON workflow_runs
      FOR ALL TO authenticated
      USING (user_id = (SELECT auth.uid()))
      WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agents') THEN
    DROP POLICY IF EXISTS "Users see own agents" ON agents;
    CREATE POLICY "Users see own agents" ON agents
      FOR ALL TO authenticated
      USING (team_id IN (SELECT id FROM teams WHERE project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid())))))
      WITH CHECK (team_id IN (SELECT id FROM teams WHERE project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid())))));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflow_steps') THEN
    DROP POLICY IF EXISTS "Users see own workflow steps" ON workflow_steps;
    CREATE POLICY "Users see own workflow steps" ON workflow_steps
      FOR ALL TO authenticated
      USING (workflow_run_id IN (SELECT id FROM workflow_runs WHERE user_id = (SELECT auth.uid())))
      WITH CHECK (workflow_run_id IN (SELECT id FROM workflow_runs WHERE user_id = (SELECT auth.uid())));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    DROP POLICY IF EXISTS "Users see own tasks" ON tasks;
    CREATE POLICY "Users see own tasks" ON tasks
      FOR ALL TO authenticated
      USING (project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid()))))
      WITH CHECK (project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid()))));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
    DROP POLICY IF EXISTS "Users see own chat messages" ON chat_messages;
    CREATE POLICY "Users see own chat messages" ON chat_messages
      FOR ALL TO authenticated
      USING (project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid()))))
      WITH CHECK (project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid()))));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integrations') THEN
    DROP POLICY IF EXISTS "Users see own integrations" ON integrations;
    CREATE POLICY "Users see own integrations" ON integrations
      FOR ALL TO authenticated
      USING (organization_id IN (SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid())))
      WITH CHECK (organization_id IN (SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid())));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_log') THEN
    DROP POLICY IF EXISTS "Users see own activity" ON activity_log;
    CREATE POLICY "Users see own activity" ON activity_log
      FOR ALL TO authenticated
      USING (
        organization_id IS NOT NULL
        AND organization_id IN (SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid()))
      )
      WITH CHECK (
        organization_id IS NOT NULL
        AND organization_id IN (SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid()))
      );
  END IF;
END $$;

-- =============================================================================
-- 3. Safe view for integrations (only if integrations table exists)
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integrations') THEN
    CREATE OR REPLACE VIEW integrations_safe AS
    SELECT id, organization_id, name, type, status, last_sync_at, created_at, updated_at
    FROM integrations;
    ALTER VIEW integrations_safe SET (security_invoker = true);
    COMMENT ON VIEW integrations_safe IS 'Client-safe integration list. Excludes config (OAuth tokens). Use integrations table server-side only.';
    COMMENT ON COLUMN integrations.config IS 'OAuth tokens and secrets. NEVER select this column from client. Use integrations_safe view or server actions only.';
  END IF;
END $$;
