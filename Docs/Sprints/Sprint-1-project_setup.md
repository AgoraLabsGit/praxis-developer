**Cursor Instructions: Praxis Developer MVP**

***

## Project Overview

**What we're building**: Praxis Developer - AI agent platform for shipping features 10x faster

**Core concept**: Chat-driven development where GMAD agents (Research, Builder, Review, Sync) work together to build features from natural language requests

**Tech stack**:
- Frontend: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- Backend: Supabase (Auth, Database, Realtime, Storage)
- Deployment: Vercel
- AI: OpenRouter (multi-model routing)

**MVP Scope** (4 weeks):
- ✅ Multi-project support (can create/switch between projects)
- ✅ GMAD workflow (hardcoded, no custom workflows yet)
- ✅ Roadmap with multiple views (Kanban, List, Timeline)
- ✅ Agent configuration (model selection, system prompts)
- ✅ Chat interface (primary interaction)
- ✅ GitHub integration (OAuth)

***

## Sprint 1 Progress

### ✅ Completed
- [x] **Step 1: Initialize Project** – Next.js 14, Tailwind, shadcn/ui, all dependencies
- [x] **Step 2: Supabase Setup** – Client/server/admin clients, middleware, migration schema
- [x] **Step 3: Core UI Components**
  - [x] Dashboard layout (multi-project, project selector, chat sidebar)
  - [x] Dashboard home (project cards, empty state)
  - [x] Project view (Kanban, List, Timeline with view switcher)
  - [x] Agent management page
  - [x] Project settings page
  - [x] New project flow
- [x] **Auth** – Login, signup, protected routes, onboarding with org/project/team/agents creation
- [x] **Agent prompts** – GMAD system prompts in `lib/agent-prompts.ts`
- [x] **Deployment** – Repo pushed to GitHub (AgoraLabsGit/praxis-developer), Vercel-ready
- [x] **Onboarding fix** – Admin client for RLS bypass during user setup

### 🔲 Remaining
- [x] Workflow run API (`/api/workflows/run`) — ✅ Sprint 3
- [x] GitHub OAuth (`/api/auth/github`, callback) — ✅ Sprint 3
- [x] Chat → workflow trigger (wire chat input to start GMAD) — ✅ Sprint 3
- [ ] New Task / Add task functionality
- [x] Agent config modal save — ✅ Sprint 3
- [ ] `workflow-progress.tsx` component

***

## Architecture Decisions

### 1. Multi-Project UI (Added to MVP)

**Why**: Visual hierarchy, better UX, prepares for scale

**UI Change**:
```
Before: Single project hardcoded
After: Project selector in sidebar + project cards on dashboard
```

### 2. Workflows = GMAD Only (Simplified)

**No workflow builder** - Just one workflow hardcoded: "Feature Development"

**Steps** (always the same):
1. Research Agent → Finds best practices
2. Builder Agent → Generates PRD
3. Builder Agent → Implements code
4. Review Agent → Reviews code (adversarial)
5. Sync Agent → Creates GitHub PR

**Why**: Faster MVP, users don't need customization yet

### 3. Roadmap Views (Enhanced)

**Views**:
- Kanban (default): 4 columns (Todo, In Progress, Review, Done)
- List: Simple table view with filters/sorting
- Timeline: Gantt chart showing dates/dependencies

**Grouping options**:
- By status (default)
- By agent (which agent owns the task)
- By date (when due)
- By project (if viewing all projects)

### 4. Agent Configuration (Detailed)

**Per-agent settings**:
- Name (editable)
- Model selection (Claude Sonnet 3.5, Gemini 2.0 Flash, etc.)
- System prompt (editable, with templates)
- Budget limits (max cost per run, monthly cap)
- Status (active, paused, archived)

***

## File Structure

```
praxis-developer/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Main dashboard shell
│   │   ├── page.tsx                # Dashboard home (project cards)
│   │   ├── [projectId]/
│   │   │   ├── page.tsx            # Project view (roadmap + chat)
│   │   │   ├── agents/
│   │   │   │   └── page.tsx        # Agent management
│   │   │   └── settings/
│   │   │       └── page.tsx        # Project settings
│   │   └── new-project/
│   │       └── page.tsx            # Create new project
│   │
│   ├── (marketing)/
│   │   └── page.tsx                # Landing page
│   │
│   ├── api/
│   │   ├── workflows/
│   │   │   └── run/
│   │   │       └── route.ts        # Trigger GMAD workflow
│   │   ├── integrations/
│   │   │   └── github/
│   │   │       ├── authorize/
│   │   │       │   └── route.ts
│   │   │       └── callback/
│   │   │           └── route.ts
│   │   └── onboard/
│   │       └── route.ts            # User onboarding
│   │
│   └── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                         # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   └── ... (30+ components)
│   │
│   ├── chat-sidebar.tsx            # Chat interface
│   ├── kanban-board.tsx            # Kanban view
│   ├── list-view.tsx               # List view
│   ├── timeline-view.tsx           # Timeline/Gantt view
│   ├── workflow-progress.tsx      # Progress modal
│   ├── agent-card.tsx              # Agent display
│   ├── agent-config-modal.tsx     # Agent configuration
│   ├── project-card.tsx            # Project card
│   ├── project-selector.tsx       # Project dropdown
│   └── empty-state.tsx             # Empty states
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Client-side Supabase
│   │   ├── server.ts              # Server-side Supabase
│   │   └── middleware.ts          # Auth middleware
│   ├── types.ts                   # TypeScript types
│   └── utils.ts                   # Utility functions
│
├── public/
│   └── (static assets)
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
│
├── .env.local
├── middleware.ts
├── next.config.js
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

***

## Step 1: Initialize Project

```bash
# Create Next.js app
npx create-next-app@latest praxis-developer --typescript --tailwind --app --no-src-dir

cd praxis-developer

# Install dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install @hello-pangea/dnd # Drag and drop for Kanban
npm install date-fns # Date formatting
npm install lucide-react # Icons
npm install recharts # Charts for timeline
npm install zustand # State management

# Install shadcn/ui
npx shadcn-ui@latest init

# Add shadcn components we'll need
npx shadcn-ui@latest add button card dialog input select textarea dropdown-menu tabs alert badge avatar
```

***

## Step 2: Supabase Setup

### Create Supabase Project

1. Go to https://supabase.com
2. Create new project: "praxis-developer"
3. Save credentials:
   - Project URL: `https://xxx.supabase.co`
   - Anon key: `eyJxxx...`
   - Service role key: `eyJxxx...` (keep secret)

### Environment Variables

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... # Secret, server-only

# GitHub OAuth (get from github.com/settings/developers)
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

# OpenRouter
OPENROUTER_API_KEY=sk-or-xxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Schema

Run in Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For encryption

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
  github_repo TEXT, -- Format: "owner/repo"
  color TEXT DEFAULT '#3B82F6', -- UI color
  status TEXT DEFAULT 'active', -- active, archived
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
  name TEXT NOT NULL, -- Research, Builder, Review, Sync
  type TEXT NOT NULL, -- research, builder, review, sync
  
  -- Model configuration
  model_provider TEXT DEFAULT 'anthropic', -- anthropic, google, openai
  model_name TEXT DEFAULT 'claude-3-5-sonnet-20241022',
  
  -- System prompt
  system_prompt TEXT NOT NULL DEFAULT 'You are a helpful AI agent.',
  
  -- Budget controls
  max_cost_per_run DECIMAL(10,4) DEFAULT 5.00,
  monthly_budget DECIMAL(10,2) DEFAULT 200.00,
  current_month_spend DECIMAL(10,2) DEFAULT 0.00,
  
  -- Status
  status TEXT DEFAULT 'active', -- active, paused, archived
  
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
  
  -- Status
  status TEXT DEFAULT 'running', -- queued, running, completed, failed, halted
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 5, -- GMAD = 5 steps
  
  -- Input/Output
  input_task TEXT NOT NULL, -- User's request
  pr_url TEXT, -- GitHub PR URL (output)
  
  -- Cost tracking
  total_cost DECIMAL(10,4) DEFAULT 0.00,
  
  -- Timestamps
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  estimated_completion TIMESTAMP -- When we think it'll finish
);

-- Workflow steps (execution log)
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_run_id UUID REFERENCES workflow_runs(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id),
  
  step_number INTEGER NOT NULL, -- 1-5 for GMAD
  name TEXT NOT NULL, -- "Research", "Generate PRD", etc.
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  
  -- Input/Output
  input_data TEXT, -- What the agent received
  output_data TEXT, -- What the agent produced
  
  -- Cost/Performance
  cost DECIMAL(10,4) DEFAULT 0.00,
  tokens_used INTEGER DEFAULT 0,
  
  -- Timestamps
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_seconds INTEGER
);

-- Tasks (roadmap items)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  
  -- Status/Priority
  status TEXT DEFAULT 'todo', -- todo, in_progress, in_review, done, blocked
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  
  -- Assignment
  assigned_agent_id UUID REFERENCES agents(id),
  workflow_run_id UUID REFERENCES workflow_runs(id), -- If created by workflow
  
  -- Dates
  due_date DATE,
  completed_at TIMESTAMP,
  
  -- Position (for drag-drop ordering within column)
  position INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  workflow_run_id UUID REFERENCES workflow_runs(id), -- If part of workflow
  
  -- Message content
  sender_type TEXT NOT NULL, -- 'user', 'agent', 'system'
  sender_name TEXT, -- Agent name if sender_type='agent'
  content TEXT NOT NULL,
  
  -- Optional metadata (action buttons, links, etc.)
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Integrations (MVP: GitHub only)
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL DEFAULT 'GitHub',
  type TEXT NOT NULL DEFAULT 'github',
  
  -- Config (encrypted)
  config JSONB NOT NULL, -- { access_token, username, repos: [] }
  
  status TEXT DEFAULT 'connected', -- connected, disconnected, error
  last_sync_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity log (for feed)
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  project_id UUID REFERENCES projects(id),
  
  event_type TEXT NOT NULL, -- workflow_started, task_completed, agent_paused, etc.
  description TEXT NOT NULL,
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policies (Multi-tenant security)
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

-- Organizations: User sees only their org
CREATE POLICY "Users see own org"
  ON organizations FOR ALL
  USING (owner_id = auth.uid());

-- Projects: User sees projects in their org
CREATE POLICY "Users see own projects"
  ON projects FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Teams: User sees teams in their projects
CREATE POLICY "Users see own teams"
  ON teams FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE organization_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
      )
    )
  );

-- Agents: User sees agents in their teams
CREATE POLICY "Users see own agents"
  ON agents FOR ALL
  USING (
    team_id IN (
      SELECT id FROM teams WHERE project_id IN (
        SELECT id FROM projects WHERE organization_id IN (
          SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
      )
    )
  );

-- Workflow runs: User sees their own runs
CREATE POLICY "Users see own workflow runs"
  ON workflow_runs FOR ALL
  USING (user_id = auth.uid());

-- Workflow steps: User sees steps for their runs
CREATE POLICY "Users see own workflow steps"
  ON workflow_steps FOR ALL
  USING (
    workflow_run_id IN (
      SELECT id FROM workflow_runs WHERE user_id = auth.uid()
    )
  );

-- Tasks: User sees tasks in their projects
CREATE POLICY "Users see own tasks"
  ON tasks FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE organization_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
      )
    )
  );

-- Chat messages: User sees messages in their projects
CREATE POLICY "Users see own chat messages"
  ON chat_messages FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE organization_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
      )
    )
  );

-- Integrations: User sees integrations in their org
CREATE POLICY "Users see own integrations"
  ON integrations FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Activity log: User sees activity in their org/projects
CREATE POLICY "Users see own activity"
  ON activity_log FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE workflow_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE workflow_steps;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;

-- Indexes for performance
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

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

***

## Step 3: Core UI Components

### 1. Dashboard Layout (Multi-Project)

**File**: `app/(dashboard)/layout.tsx`

```typescript
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProjectSelector } from '@/components/project-selector';
import { ChatSidebar } from '@/components/chat-sidebar';

export default async function DashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { projectId?: string };
}) {
  const supabase = createServerClient();
  
  // Check auth
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/login');
  }

  // Fetch user's projects
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!org) {
    redirect('/onboard');
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', org.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 border-b flex items-center justify-between px-6 bg-white">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Praxis Developer</h1>
          <ProjectSelector projects={projects || []} />
        </div>
        
        <div className="flex items-center gap-4">
          <button className="text-sm text-gray-600 hover:text-gray-900">
            Docs
          </button>
          <button className="text-sm text-gray-600 hover:text-gray-900">
            @{user.email?.split('@')[0]}
          </button>
        </div>
      </header>

      {/* Main Content + Chat (2-column on desktop, stacked on mobile) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content (70% on desktop, 100% on mobile) */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>

        {/* Chat Sidebar (30% on desktop, hidden on mobile - toggle button) */}
        <aside className="hidden lg:flex w-96 border-l bg-white flex-col">
          <ChatSidebar projectId={params.projectId} />
        </aside>
      </div>
    </div>
  );
}
```

***

### 2. Dashboard Home (Project Cards)

**File**: `app/(dashboard)/page.tsx`

```typescript
import { createServerClient } from '@/lib/supabase/server';
import { ProjectCard } from '@/components/project-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = createServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user!.id)
    .single();

  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      teams (
        id,
        agents (count)
      )
    `)
    .eq('organization_id', org!.id)
    .eq('status', 'active');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Your Projects</h1>
          <p className="text-gray-600">
            Manage your AI-powered development projects
          </p>
        </div>
        
        <Link href="/new-project">
          <Button>+ New Project</Button>
        </Link>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first project to get started
          </p>
          <Link href="/new-project">
            <Button>Create Project</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
```

***

### 3. Project View (Roadmap + Views)

**File**: `app/(dashboard)/[projectId]/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select } from '@/components/ui/select';
import { KanbanBoard } from '@/components/kanban-board';
import { ListView } from '@/components/list-view';
import { TimelineView } from '@/components/timeline-view';
import { Button } from '@/components/ui/button';

export default function ProjectPage({
  params
}: {
  params: { projectId: string };
}) {
  const [view, setView] = useState<'kanban' | 'list' | 'timeline'>('kanban');
  const [groupBy, setGroupBy] = useState<'status' | 'agent' | 'date'>('status');

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Roadmap</h2>
        
        <div className="flex items-center gap-3">
          {/* Group By */}
          <Select value={groupBy} onValueChange={setGroupBy}>
            <option value="status">Group by Status</option>
            <option value="agent">Group by Agent</option>
            <option value="date">Group by Date</option>
          </Select>

          {/* View Switcher */}
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="kanban">
                📋 Kanban
              </TabsTrigger>
              <TabsTrigger value="list">
                📝 List
              </TabsTrigger>
              <TabsTrigger value="timeline">
                📅 Timeline
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* New Task */}
          <Button>+ New Task</Button>
        </div>
      </div>

      {/* Views */}
      {view === 'kanban' && (
        <KanbanBoard projectId={params.projectId} groupBy={groupBy} />
      )}
      {view === 'list' && (
        <ListView projectId={params.projectId} groupBy={groupBy} />
      )}
      {view === 'timeline' && (
        <TimelineView projectId={params.projectId} />
      )}
    </div>
  );
}
```

***

### 4. Agent Management Page

**File**: `app/(dashboard)/[projectId]/agents/page.tsx`

```typescript
import { createServerClient } from '@/lib/supabase/server';
import { AgentCard } from '@/components/agent-card';
import { Button } from '@/components/ui/button';

export default async function AgentsPage({
  params
}: {
  params: { projectId: string };
}) {
  const supabase = createServerClient();

  // Get project's team
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('project_id', params.projectId)
    .single();

  // Get agents
  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('team_id', team!.id)
    .order('created_at', { ascending: true });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Agents</h2>
          <p className="text-gray-600">
            Configure your GMAD agent stack
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {agents?.map(agent => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Agent Stats */}
      <div className="mt-8 grid grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-lg border">
          <div className="text-2xl font-bold">$12.34</div>
          <div className="text-sm text-gray-600">Total Spend (This Month)</div>
        </div>
        <div className="p-6 bg-white rounded-lg border">
          <div className="text-2xl font-bold">42</div>
          <div className="text-sm text-gray-600">Workflows Completed</div>
        </div>
        <div className="p-6 bg-white rounded-lg border">
          <div className="text-2xl font-bold">26 min</div>
          <div className="text-sm text-gray-600">Avg. Workflow Time</div>
        </div>
      </div>
    </div>
  );
}
```

***

## Agent System Prompts (Templates)

**File**: `lib/agent-prompts.ts`

```typescript
export const AGENT_PROMPTS = {
  research: `You are the Research Agent in the GMAD workflow.

Your role:
1. Research best practices for the requested feature
2. Find relevant libraries, frameworks, and code examples
3. Identify potential challenges and solutions
4. Summarize findings in clear, actionable format

Guidelines:
- Use Perplexity for up-to-date information
- Focus on production-ready solutions
- Consider security, performance, scalability
- Cite sources when possible

Output format:
## Research Summary
[2-3 sentence overview]

## Recommended Approach
[Step-by-step implementation plan]

## Libraries/Tools
- [Library 1]: [Why it's suitable]
- [Library 2]: [Why it's suitable]

## Potential Challenges
- [Challenge 1]: [How to address]
- [Challenge 2]: [How to address]`,

  builder: `You are the Builder Agent in the GMAD workflow.

Your role:
1. Generate technical PRDs from research
2. Implement features based on PRDs
3. Write clean, production-ready code
4. Follow project conventions and best practices

Guidelines:
- Write TypeScript/JavaScript for web projects
- Include error handling and edge cases
- Add comments for complex logic
- Follow existing code style
- Write tests when appropriate

Code quality standards:
- No hardcoded values (use env vars/config)
- Proper type safety (TypeScript)
- Clean function names (descriptive, not generic)
- DRY principle (don't repeat yourself)

Output format:
## Files Created/Modified
\`\`\`typescript:path/to/file.ts
[Full file content]
\`\`\`

## Implementation Notes
[Any important context for reviewers]`,

  review: `You are the Review Agent in the GMAD workflow.

Your role:
1. Review code generated by Builder Agent
2. Find bugs, security issues, performance problems
3. Be adversarial but constructive
4. Halt workflow if 3+ critical issues found

Review checklist:
- [ ] Security (XSS, SQL injection, auth bypass, secrets in code)
- [ ] Performance (N+1 queries, memory leaks, unnecessary re-renders)
- [ ] Logic errors (off-by-one, race conditions, edge cases)
- [ ] Code quality (readability, maintainability, testability)
- [ ] Best practices (proper error handling, type safety, DRY)

Issue severity:
- CRITICAL: Security vulnerability, data loss, crash
- HIGH: Major bug, poor performance, bad UX
- MEDIUM: Code smell, minor bug, style issue
- LOW: Nitpick, suggestion, improvement

Output format:
## Review Summary
[Overall assessment]

## Critical Issues (count: X)
1. [Issue description]
   - File: [filename:line]
   - Impact: [What could go wrong]
   - Fix: [How to resolve]

## Recommendations
[Other improvements]

## Decision
APPROVE / REQUEST_CHANGES / HALT`,

  sync: `You are the Sync Agent in the GMAD workflow.

Your role:
1. Create GitHub branches from approved code
2. Commit changes with clear messages
3. Create pull requests with detailed descriptions
4. Link to relevant issues/tasks

Guidelines:
- Branch naming: feature/[task-name] or fix/[bug-name]
- Commit messages: Conventional Commits format
- PR descriptions: What, why, how
- Include screenshots/videos if UI changes

Commit message format:
type(scope): description

Types: feat, fix, refactor, docs, test, chore
Scope: component/module affected
Description: imperative mood, lowercase

Examples:
- feat(auth): add social login with Google
- fix(api): handle null response from database
- refactor(components): extract Button to shared UI

PR template:
## What
[What changed]

## Why
[Why this change is needed]

## How
[How it was implemented]

## Testing
[How to test this change]

## Screenshots
[If applicable]`
};

export const DEFAULT_AGENT_CONFIGS = {
  research: {
    name: 'Research',
    type: 'research',
    model_provider: 'perplexity',
    model_name: 'sonar-pro',
    system_prompt: AGENT_PROMPTS.research,
    max_cost_per_run: 0.50,
    monthly_budget: 50.00
  },
  builder: {
    name: 'Builder',
    type: 'builder',
    model_provider: 'anthropic',
    model_name: 'claude-3-5-sonnet-20241022',
    system_prompt: AGENT_PROMPTS.builder,
    max_cost_per_run: 3.00,
    monthly_budget: 150.00
  },
  review: {
    name: 'Review',
    type: 'review',
    model_provider: 'anthropic',
    model_name: 'claude-3-5-sonnet-20241022',
    system_prompt: AGENT_PROMPTS.review,
    max_cost_per_run: 1.00,
    monthly_budget: 80.00
  },
  sync: {
    name: 'Sync',
    type: 'sync',
    model_provider: 'google',
    model_name: 'gemini-2.0-flash-exp',
    system_prompt: AGENT_PROMPTS.sync,
    max_cost_per_run: 0.10,
    monthly_budget: 20.00
  }
};
```

***

## Next Steps for Cursor

### Prompt 1: Initialize Project

```
Create a new Next.js 14 project called "praxis-developer" with:
- TypeScript
- Tailwind CSS
- App Router
- No src directory

Install dependencies:
- @supabase/supabase-js
- @supabase/ssr
- @hello-pangea/dnd
- date-fns
- lucide-react
- recharts
- zustand

Initialize shadcn/ui and add these components:
button, card, dialog, input, select, textarea, dropdown-menu, tabs, alert, badge, avatar

Set up the file structure as specified above.
```

### Prompt 2: Supabase Configuration

```
Create Supabase client utilities:

1. lib/supabase/client.ts - Client-side Supabase client
2. lib/supabase/server.ts - Server-side Supabase client with cookies
3. middleware.ts - Auth middleware for protected routes

Use the environment variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

Reference: https://supabase.com/docs/guides/auth/server-side/nextjs
```

### Prompt 3: Auth Pages

```
Create authentication pages:

1. app/(auth)/login/page.tsx - Login form with email/password
2. app/(auth)/signup/page.tsx - Signup form with email/password
3. app/(auth)/layout.tsx - Centered layout for auth pages

Use shadcn/ui components (Button, Input, Card).
Style with Tailwind CSS.
Handle Supabase auth (signInWithPassword, signUp).
```

### Prompt 4: Dashboard Layout

```
Create dashboard layout with:

1. app/(dashboard)/layout.tsx
   - Header with logo and user menu
   - Project selector dropdown
   - 2-column layout (main content + chat sidebar)
   - Responsive (stack on mobile)

2. components/project-selector.tsx
   - Dropdown to switch between projects
   - Show project name and color indicator
   - "New Project" option at bottom

Use shadcn/ui Select component.
Fetch projects from Supabase.
```

### Prompt 5: Project Cards & Dashboard Home

```
Create dashboard home page:

1. app/(dashboard)/page.tsx
   - Grid of project cards
   - "New Project" button
   - Empty state if no projects

2. components/project-card.tsx
   - Show project name, description, color
   - Show team count, workflow count
   - Progress indicator
   - Click to navigate to project

Use shadcn/ui Card component.
Make it responsive (1 col mobile, 2 cols tablet, 3 cols desktop).
```

Continue with similar prompts for each component...

***

## Design System (Tailwind Config)

**File**: `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

***

**This is your complete blueprint. Start with Prompt 1 in Cursor and build component by component. Each piece is production-ready. Let's ship this in 4 weeks.**