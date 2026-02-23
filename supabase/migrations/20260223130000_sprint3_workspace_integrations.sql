-- Sprint 3: Workspace integrations (GitHub OAuth tokens)
-- Replaces/additional to integrations table for OAuth-specific storage

-- Ensure update_updated_at exists (may not exist in all deployments)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS workspace_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service TEXT NOT NULL DEFAULT 'github',
  encrypted_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, service)
);

ALTER TABLE workspace_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own workspace integrations" ON workspace_integrations
  FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_workspace_integrations_org ON workspace_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_workspace_integrations_service ON workspace_integrations(organization_id, service);

CREATE TRIGGER update_workspace_integrations_updated_at
  BEFORE UPDATE ON workspace_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
