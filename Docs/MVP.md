Here’s the updated MVP v2 spec, incorporating the original Project Overview (UI/layout/core pages) plus the Agent0/BMAD + config-sync decisions.

***

## 1. Product Direction

Praxis Developer v2 is a **Dashboard for Agent0 projects**: a web UI (Next.js + Supabase + Vercel) that acts as mission control for Agent0 + BMAD feature development.  

Agent0 runs in Docker/VPS, edits the repo, commits/pushes to GitHub; Vercel builds from GitHub and connects to Supabase. Praxis is the UI/API layer on top.

***

## 2. Core UX & Layout (from original Project Overview, adapted)

- **Tech stack**: Next.js 14 (App Router), TypeScript, Tailwind + shadcn/ui, Geist font, light/dark mode via `next-themes`. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_58149ea4-eb69-4f79-88a6-2212a14d10eb/96cab420-30d1-45a9-8a7b-2e5e444d916d/pasted-text.txt)
- **Layout**:
  - **Collapsible left sidebar**:  
    - Workspace → Projects → (Overview / Stories / Agents / Runs).  
    - “Projects” now represent Agent0 instances (one repo + one Agent0 deployment). [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_58149ea4-eb69-4f79-88a6-2212a14d10eb/96cab420-30d1-45a9-8a7b-2e5e444d916d/pasted-text.txt)
  - **Main content area (per project)**:
    - “Overview” tab: cards for Agent0 status, recent runs, latest Vercel preview, GitHub link.  
    - “Stories” tab: table of BMAD `stories` (from Supabase) with status chips (draft, approved, ready_for_review, done).  
    - “Docs” tab: read‑only views of `docs/brainstorm.md`, `docs/prd.md`, `docs/architecture.md`.  
    - “Agents” tab: agent configuration UI for BMAD/Agent0 roles.  
    - “Runs” tab: list of recent Agent0 runs per story (optional MVP+).  
  - **Right-hand chat/log sidebar**:
    - Collapsible, **monitoring-only** chat that shows Agent0 activity (runs, git operations, story status changes), no input field for MVP. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_58149ea4-eb69-4f79-88a6-2212a14d10eb/96cab420-30d1-45a9-8a7b-2e5e444d916d/pasted-text.txt)

- **Dashboard (home)**:
  - Multi-project dashboard with cards: project name, Agent0 connection status, last run, latest Vercel preview link. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_58149ea4-eb69-4f79-88a6-2212a14d10eb/96cab420-30d1-45a9-8a7b-2e5e444d916d/pasted-text.txt)
  - Quick filters for “Active”, “Idle”, “Error”.

***

## 3. Core MVP Features

### 3.1 Projects & Agent0 integration

- Project = one GitHub repo + Agent0 instance + Vercel project.
- For MVP:
  - Store in Supabase `projects` table: name, GitHub repo URL, Vercel URL, Agent0 notes (VPS host, etc.). [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_58149ea4-eb69-4f79-88a6-2212a14d10eb/96cab420-30d1-45a9-8a7b-2e5e444d916d/pasted-text.txt)
  - Agent0 **does not** talk to Supabase; it only clones/pulls the repo and pushes changes.

### 3.2 BMAD docs & stories in the UI

- **Docs tab**:
  - Display `brainstorm`, `prd`, `architecture` (either from Supabase or directly from repo synced into Supabase).  
- **Stories tab**:
  - Table bound to Supabase `stories` table with fields: `id`, `epic`, `title`, `status`, `priority`, `last_commit_sha`, `git_path`.
  - Status lifecycle (BMAD): `draft → approved → ready_for_review → done`.  
  - MVP interaction: **user can change `draft → approved`** via dropdown; other transitions are updated by A0 later.

### 3.3 Stories as the main control surface

- Stories replace “tasks/roadmap” from the original GMAD spec. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_58149ea4-eb69-4f79-88a6-2212a14d10eb/96cab420-30d1-45a9-8a7b-2e5e444d916d/pasted-text.txt)
- The “Roadmap” concept becomes the Stories tab:
  - Filters by epic, status, and project.  
  - Optional Kanban view in later iterations; MVP uses table.

### 3.4 Agent configuration page (Praxis-owned, git-synced)

- Reuse the existing **Agent config UI** from GMAD (model, system prompt, budget, status). [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_58149ea4-eb69-4f79-88a6-2212a14d10eb/96cab420-30d1-45a9-8a7b-2e5e444d916d/pasted-text.txt)
- Instead of GMAD agents, list BMAD+Agent0 roles:
  - Orchestrator, Analyst, PM, Architect, Product Owner, Scrum Master, Developer, Reviewer.  
- **Praxis is source of truth for config**:
  - Agent config is stored in Supabase (`agent_configs` table) and mirrored into repo files under `config/agents/*.json` or similar.
  - Agent0 reads these config files from the repo (no direct API to Supabase needed).

***

## 4. Config Sync Strategy (Praxis ↔ Agent0)

### 4.1 Source of truth

- **Praxis owns agent configuration**:
  - Users edit agents in the Praxis UI.  
  - Changes are written to Supabase and then persisted into versioned config files in the repo (e.g. `config/agents/dev.json`, `config/agents/reviewer.json`).

### 4.2 How Agent0 sees config (MVP)

- Agent0 only needs **git access**:
  - It pulls the repo and reads `config/agents/*.json` + BMAD prompt files.  
  - No Supabase client and no direct HTTP connection required for MVP.

### 4.3 Future: push/pull via HTTP (beyond MVP)

- Later, you can add a thin Agent0 HTTP API:
  - `GET /config` for live status; `POST /config` to push updates immediately.  
  - Praxis remains the source of truth and uses GitHub for history; the API is just a live sync channel.

For MVP, we explicitly **avoid** this and rely solely on git for sync.

***

## 5. Agent0 + BMAD development pipeline (MVP flow)

1. **You (human) / BMAD Phase 1 (outside Praxis)**  
   - Create `docs/brainstorm.md`, `docs/prd.md`, `docs/architecture.md`, `epics/`, `stories/` in the repo.  
   - Commit/push.

2. **Praxis ingests metadata**  
   - Either: one-time script populates `stories` table from the repo.  
   - Or: simple backend job that parses stories and updates Supabase.

3. **You approve stories in the UI**  
   - In “Stories” tab, change status `draft → approved` for chosen stories.  
   - Praxis writes status to Supabase; optionally writes back into story markdown later.

4. **Agent0 implements stories**  
   - Agent0 reads stories + config/agents from the repo.  
   - For stories with status `approved`, it:
     - changes code,  
     - updates story file status to `ready_for_review`,  
     - commits to GitHub,  
     - pushes to a branch.

5. **Vercel builds + preview**  
   - Vercel picks up the branch push, builds, and exposes a preview URL.  
   - Praxis Dashboard shows the latest preview + PR link on the Project Overview card.

6. **Review & merge**  
   - You review the PR and preview, comment/adjust.  
   - When merged, story can move to `done` (either via A0 or via UI).

***

## 6. Minimal Supabase usage for this MVP

Supabase tables used:

- `projects`: project metadata (name, GitHub repo, Vercel URL, color, status).  
- `stories`: BMAD stories with status and linkage to repo paths.  
- `agent_configs`: Praxis-owned BMAD/Agent0 agent configuration (per project).  
- Optional later: `agent_runs` for run history.

All Supabase access is from the **Next.js backend (Vercel)** using `@supabase/supabase-js` server-side only; A0 never touches Supabase directly. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_58149ea4-eb69-4f79-88a6-2212a14d10eb/96cab420-30d1-45a9-8a7b-2e5e444d916d/pasted-text.txt)

***

## 7. Immediate implementation tasks

1. **Schema & backend**
   - Create/adjust Supabase tables: `projects`, `stories`, `agent_configs`.  
   - Implement API routes:
     - `GET /api/projects`, `GET /api/projects/:id`.  
     - `GET /api/projects/:id/stories`, `PATCH /api/stories/:id` (status updates).  
     - `GET /api/projects/:id/agents`, `PATCH /api/agents/:id` (config changes).

2. **Front‑end pages**
   - Dashboard: multi-project cards with Agent0/Vercel/GitHub links.  
   - Project detail:
     - Overview tab.  
     - Stories tab (table + status controls).  
     - Docs tab (render docs).  
     - Agents tab (config editor).

3. **Git sync for config (MVP)**
   - Small backend job or script that, on agent config change:
     - writes `config/agents/<name>.json` into the repo,  
     - A0 picks this up on next pull.

Once these are in place, you have a working **Praxis ↔ Supabase ↔ GitHub ↔ Agent0 ↔ Vercel** loop, with BMAD structure and the UI/UX preserved from the original Project Overview.