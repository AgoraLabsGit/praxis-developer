# Sprint 3: Live Connections & Main Configuration

**Status:** Complete (Steps 0–5 done; Step 6 partial)  
**Baseline:** Sprint 2 UI (collapsible sidebars, theme, project/agents/workflows pages)

***

## Sprint 3 Goals

**Overall status target:** Implement live connections and main configuration so GMAD can use real repos and real models.

- **GitHub:** OAuth + real PR creation.
- **AI Providers:** Workspace-level multi-provider config (OpenRouter default).
- **Agent Config:** Agents wired to providers/models with budgets.
- **Settings UI:** Clear workspace vs project settings.

***

## Step 0: Pre-Implementation Checklist

| Item | Status |
|------|---------|
| `ai_providers` table | ✅ New |
| `workspace_integrations` table (GitHub, environment) | ✅ New |
| Settings routes | ✅ `/dashboard/settings/...` (workspace) |
| Project settings routes | ✅ `/dashboard/[projectId]/settings/...` |

### Sprint 2 Route Baseline (Reference)

- `/dashboard` (dashboard home)
- `/dashboard/[projectId]` (project roadmap)
- `/dashboard/[projectId]/agents`
- `/dashboard/[projectId]/workflows`
- `/dashboard/[projectId]/settings` (project settings)
- `/dashboard/new-project`

**Sprint 3 adds:** Workspace-level `/dashboard/settings` with sub-routes.

***

## Step 1: Workspace Settings Shell ✅

### Spec

- Add **workspace-level** settings entry in left sidebar:
  - "Settings" under workspace section (separate from per-project items).
- Routes:
  - `/dashboard/settings` → redirects to `/dashboard/settings/integrations` (for now).
  - `/dashboard/settings/integrations`
  - `/dashboard/settings/billing` (stub)
  - `/dashboard/settings/security` (stub)

### Done when

- Settings item is visible in sidebar.
- Hitting `/dashboard/settings` lands you in Integrations.
- Only accessible if user has an organization/workspace.

***

## Step 2: GitHub Integration (Live Connection) ✅

### Backend

- Create `user_integrations` (or `workspace_integrations`) table:
  - `id`
  - `workspace_id` (FK → `organizations`)
  - `service` (`'github'`)
  - `encrypted_token`
  - `refresh_token`
  - `expires_at`
  - `metadata` (JSONB: username, avatar, etc.)
  - Timestamps
- Implement GitHub OAuth:
  - `/api/auth/github` → redirect to GitHub.
  - `/api/auth/github/callback` → exchange code for token, store in `user_integrations`.

### Frontend (Settings → Integrations → GitHub)

- If not connected:
  - Show "Connect GitHub" button.
- If connected:
  - Show GitHub username, avatar, and "Reconnect / Disconnect".
  - "Test connection" button.

### Project-level settings (Repository tab)

- `/dashboard/[projectId]/settings/repository`:
  - Repo selector (list from GitHub API).
  - Default branch selector (main/master).
  - "Save" and "Test PR creation" (dry run).

### Done when

- User can connect GitHub once at workspace level.
- Project can be linked to a specific repo + branch.
- A test run can create a real PR against the configured repo (from a stub change or placeholder branch).

***

## Step 3: AI Providers Configuration ✅

### Backend

- New `ai_providers` table (workspace-scoped):
  - `id`
  - `workspace_id`
  - `name` (`'openrouter' | 'openai' | 'anthropic' | 'google' | 'perplexity' | 'custom'`)
  - `is_default` (boolean)
  - `config` JSONB (`api_key`, `base_url`, `org_id`, etc.)
  - Timestamps

- API:
  - `GET /api/settings/ai-providers`
  - `POST /api/settings/ai-providers`
  - `PATCH /api/settings/ai-providers/:id` (edit, set default)
  - `DELETE /api/settings/ai-providers/:id`

### Frontend (Settings → Integrations → AI Providers)

- List view:
  - Rows: Provider name, status (Connected/Error), `is_default`, last used.
  - Actions: Edit, Set default, Delete.
- **Add Provider** flow:
  - Step 1: Multi-select providers:
    - OpenRouter (pre-selected, "Recommended").
    - OpenAI.
    - Anthropic.
    - Google AI (Gemini).
    - Perplexity.
  - Step 2: For each selected provider:
    - API key input (password).
    - Optional org/project ID / base URL fields.
    - "Test connection" button (ping simple endpoint; for OpenRouter, e.g., list models).
  - Step 3: Default provider select (OpenRouter pre-selected) + Save.

### Done when

- Workspace can store multiple AI providers securely.
- OpenRouter is configured and can be set as default.
- "Test connection" feedback works (success/error per provider).

***

## Step 4: Agent Configuration → Provider/Model Wiring ✅

### Backend

- Extend `agents` table:
  - Add `provider_id` (FK → `ai_providers`).
  - Add `model_name` (string).
- Ensure existing default config maps to OpenRouter-based models (e.g., Sonnet, Gemini, GPT-4 via OpenRouter).

### Frontend (Agents page / Agent config modal)

- Model section becomes:
  - Provider select:
    - Options only from configured `ai_providers`.
    - If none configured, show blocking state: "Add an AI provider in Settings → Integrations → AI Providers".
  - Model select:
    - Static list per provider for now (OpenRouter: Sonnet 3.5, GPT-4 Turbo, Gemini 2.0 Flash, etc.).
- Validation:
  - If chosen provider is invalid (no key, failing test), disable save and show inline error + link to Settings.
- Budget:
  - Reuse/extend existing per-agent budget fields (max per run, monthly cap).

### Done when

- Editing an agent lets you choose provider + model.
- Saving updates the DB and subsequent workflow runs use the new provider/model.
- If no provider configured, agent config clearly directs user to AI Providers settings.

***

## Step 5: Replace Simulated Workflow Calls with Real Providers ✅

### Scope (MVP-level)

- For Sprint 3, keep Agent Zero still "simulated" if needed, but:
  - The actual model calls should go through the selected provider (OpenRouter etc.).
- Update the workflow executor:
  - Read `agent.provider_id` and `agent.model_name`.
  - Resolve to provider config from `ai_providers.config`.
  - Route requests accordingly (starting with OpenRouter).

### Done when

- A GMAD workflow run:
  - Uses configured AI provider key.
  - Fails fast with a clear error if provider/keys are missing.
  - Logs which provider/model were used in `workflow_steps`.

***

## API Keys Tab ✅

### Implemented

- **Keys tab** in Integrations nav (`/dashboard/integrations/keys`)
- **Storage:** `workspace_integrations` with `service: 'environment'`, `metadata.keys`
- **Encryption:** AES-256-GCM at rest (graceful fallback if no `ENCRYPTION_KEY`)
- **Validation:** Test endpoint for OpenRouter, Sentry DSN, Slack webhook, Resend
- **Consumption:** `getApiKey()`, `getApiKeys()`, `getApiKeyForOrg()` with env fallback
- **Integrations wired:** GitHub OAuth, AI Providers test, agent execution use Keys fallback

### Done when

- User can add/edit/delete keys in Keys tab
- Keys are encrypted when `ENCRYPTION_KEY` is set
- Test button validates supported key types
- Workflows and OAuth use keys from database when provider config has no key

***

## Step 6: UX + Safety Polish (Partial)

- In workflow progress modal:
  - Display provider and model for each step (e.g., "Research · OpenRouter · Sonnet 3.5").
- In Settings:
  - Show warning banner if:
    - No GitHub connected but project tries to run Sync step.
    - No AI providers configured but user tries to start workflow.
- Error handling:
  - Graceful failures with actionable messages instead of generic "workflow failed".

***

## Setup & Deployment (Completed)

| Step | Status |
|------|---------|
| GitHub OAuth App created (github.com/settings/developers) | ✅ |
| Callback URL: `http://localhost:3001/api/auth/github/callback` | ✅ |
| GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET in .env.local | ✅ |
| OPENROUTER_API_KEY in .env.local | ✅ |
| NEXT_PUBLIC_APP_URL set to match dev port (3001) | ✅ |
| Dev script uses `next dev -p 3001` for port consistency | ✅ |
| Vercel + Supabase connections verified (Infrastructure tab) | ✅ |

***

## After Running – Sprint 3 Checklist

| Item | Status |
|------|---------|
| Workspace Settings visible | ✅ |
| GitHub OAuth connects and stores token | ✅ |
| GitHub OAuth reads from Keys tab (fallback) | ✅ |
| Project repo/branch selection works | ✅ |
| "Test PR" or real PR from workflow works | ⏳ (stub PR URL) |
| AI Providers page lists providers | ✅ |
| Add/edit/delete providers works | ✅ |
| AI Providers test falls back to Keys tab | ✅ |
| OpenRouter configured and set as default | ✅ |
| Agent config can select provider + model | ✅ |
| Workflow runs use configured provider/model | ✅ |
| Workflow executor uses real LLM calls | ✅ |
| Keys fallback for agent execution | ✅ |
| Clear errors when keys/providers missing | ✅ |
| **API Keys tab** | ✅ |
| Keys storage (encrypted at rest) | ✅ |
| Key validation/testing (OpenRouter, Sentry, Slack, Resend) | ✅ |
| `getApiKey` / `getApiKeyForOrg` consumption layer | ✅ |
| GitHub OAuth one-click connect (end users) | ✅ |
| Live credentials configured (.env.local) | ✅ |

***

## Open Question

**Per-project AI provider overrides:** Do you want per-project AI provider overrides in Sprint 3 (project chooses a non-default provider), or keep all AI config strictly workspace-level for now?
