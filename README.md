# Praxis Developer

AI agent platform for shipping features 10x faster. Chat-driven development with GMAD agents (Research, Builder, Review, Sync).

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth, Database, Realtime, Storage)
- **AI**: OpenRouter (multi-model routing)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor
3. Copy `.env.example` to `.env.local` and add your credentials:

```bash
cp .env.example .env.local
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
praxis-developer/
├── app/
│   ├── (auth)/          # Login, signup
│   ├── (marketing)/     # Landing page
│   ├── dashboard/       # Main app (projects, roadmap, agents)
│   ├── onboard/        # User onboarding
│   └── api/            # API routes (workflows, GitHub)
├── components/
│   ├── ui/             # shadcn/ui components
│   ├── kanban-board.tsx
│   ├── list-view.tsx
│   ├── timeline-view.tsx
│   ├── chat-sidebar.tsx
│   ├── agent-card.tsx
│   └── project-card.tsx
└── lib/
    ├── supabase/       # Client & server Supabase
    ├── types.ts
    └── agent-prompts.ts
```

## MVP Features

- ✅ Multi-project support
- ✅ GMAD workflow (Research → Builder → Review → Sync)
- ✅ Roadmap views (Kanban, List, Timeline)
- ✅ Agent configuration
- ✅ Chat interface
- 🔲 GitHub integration (OAuth)
- 🔲 Workflow execution API
