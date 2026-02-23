-- Sprint 3: AI Providers (workspace-scoped multi-provider config)

CREATE TABLE IF NOT EXISTS ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (name IN ('openrouter', 'openai', 'anthropic', 'google', 'perplexity', 'custom')),
  is_default BOOLEAN DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own ai_providers" ON ai_providers
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

CREATE INDEX IF NOT EXISTS idx_ai_providers_org ON ai_providers(organization_id);

-- Ensure only one default per org (enforced in app; could add trigger later)
CREATE TRIGGER update_ai_providers_updated_at
  BEFORE UPDATE ON ai_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
