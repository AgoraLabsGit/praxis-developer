-- Fix tasks table: ensure project_id exists and add RLS
-- Tasks may have been created with different schema from partial migration
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'project_id') THEN
    ALTER TABLE tasks ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own tasks" ON tasks;
CREATE POLICY "Users see own tasks" ON tasks FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())));
