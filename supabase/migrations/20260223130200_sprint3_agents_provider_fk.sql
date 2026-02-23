-- Sprint 3: Wire agents to ai_providers

ALTER TABLE agents ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES ai_providers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agents_provider ON agents(provider_id);

-- projects: add default_branch for repository config
ALTER TABLE projects ADD COLUMN IF NOT EXISTS default_branch TEXT DEFAULT 'main';
