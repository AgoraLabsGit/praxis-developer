# Praxis Developer: Project Overview

**Version:** 1.0  
**Last Updated:** February 23, 2026  
**Status:** MVP Development (Sprint 2)  
**Author:** AgoraLabs

***

## Executive Summary

**Praxis Developer** is an AI-powered development platform that enables teams to ship features **10x faster** through autonomous agent workflows. Unlike traditional development tools that augment human developers, Praxis Developer orchestrates specialized AI agents that handle the entire feature lifecycle—from research to production deployment. [smartsheet](https://www.smartsheet.com/content/free-product-requirements-document-template)

**Core Value Proposition:** Chat-driven development where users describe what they want to build in natural language, and GMAD agents (Research, Builder, Review, Sync) collaborate to deliver production-ready code with GitHub pull requests in ~26 minutes.

**Target Users:** Solo developers, startups, and small engineering teams (2-10 people) who need to move fast without sacrificing code quality.

**Business Model:** Usage-based SaaS with transparent per-workflow pricing. Future: Enterprise self-hosted deployments.

***

## Product Vision & Market Position

### The Problem

1. **Development velocity bottleneck** - Traditional development requires research, planning, implementation, review, and deployment—all manual steps
2. **Knowledge distribution** - Best practices, security patterns, and modern frameworks require constant learning
3. **Context switching overhead** - Developers waste 40%+ time on non-coding tasks (research, PRs, deployment)
4. **Code review delays** - Waiting for human reviewers slows iteration cycles

### The Solution

**Praxis Developer** introduces the **GMAD workflow architecture**:
- **Research Agent** - Finds best practices, libraries, security patterns (2 min)
- **Builder Agent** - Generates technical PRDs and implements features (15 min)
- **Review Agent** - Adversarial code review, finds bugs/security issues (5 min)
- **Sync Agent** - Creates GitHub PRs with conventional commits (1 min)

**Total:** ~26 minutes from idea to pull request. [airfocus](https://airfocus.com/templates/product-requirements-document/)

### Market Differentiation

| Feature | Praxis Developer | Cursor/GitHub Copilot | Linear/Jira |
|---------|------------------|----------------------|-------------|
| **Autonomous workflows** | ✅ Full GMAD pipeline | ❌ Manual orchestration | ❌ Task tracking only |
| **Multi-agent collaboration** | ✅ 4 specialized agents | ⚠️ Single model | N/A |
| **GitHub integration** | ✅ Auto PR creation | ⚠️ Manual commits | ⚠️ External linking |
| **Code review built-in** | ✅ Adversarial Review Agent | ❌ Human-only | ❌ External |
| **Real-time monitoring** | ✅ Chat + progress modal | ❌ Terminal output | N/A |

***

## Major Architectural Decisions

### Pivot 1: Multi-Project Support (Sprint 1)

**Original Plan:** Single hardcoded project  
**Final Decision:** Full multi-project architecture from MVP  

**Rationale:**
- Better UX for users managing multiple codebases
- Prepares for team collaboration features
- Visual hierarchy (workspace → projects → roadmap/agents)

**Impact:** Added project selector, project cards, hierarchical navigation. [insaim](https://www.insaim.design/blog/20-best-practices-for-saas-product-design)

***

### Pivot 2: Workflow Architecture (Sprint 1)

**Original Plan:** Workflow builder UI for custom workflows  
**Final Decision:** Hardcoded GMAD workflow only for MVP  

**Rationale:**
- Faster MVP delivery (4 weeks vs 8 weeks)
- 90% of users need feature development workflow
- Custom workflows = future premium feature

**Implementation:**
- Single workflow per team: "Feature Development"
- 5 hardcoded steps (Research → PRD → Build → Review → Sync)
- Database supports multiple workflows (future-proof)

**Tradeoff:** Less flexibility now, but validates core value faster. [airfocus](https://airfocus.com/templates/product-requirements-document/)

***

### Pivot 3: UI/UX Overhaul (Sprint 2)

**Original Plan:** Basic Bootstrap-style UI  
**Final Decision:** Modern SaaS UI with light/dark theme, collapsible sidebars, professional design system  

**Rationale:**
- First impressions matter for user acquisition
- Professional UI = perceived product quality
- Better UX = clearer feature gaps during user testing

**Key Features:**
1. **Collapsible left sidebar** - Project hierarchy (workspace → projects → roadmap/agents/workflows)
2. **Collapsible + expandable chat** - No input field, monitoring-only (workflow-driven)
3. **Dashboard with cards** - Recent activity, project previews, stats
4. **Light/dark theme** - Modern font stack (Geist), proper spacing/shadows

**Result:** Production-ready SaaS appearance. [eleken](https://www.eleken.co/blog-posts/how-to-design-a-saas-product-six-best-practices)

***

### Pivot 4: Chat Interaction Model (Sprint 2)

**Original Plan:** Chat as primary input method with text field  
**Final Decision:** Chat sidebar is **monitoring-only**, no input field  

**Rationale:**
- Workflows are triggered from roadmap/tasks, not chat
- Chat shows agent activity in real-time (like a log)
- Reduces confusion ("Should I chat or use the UI?")

**Future:** May add chat input for ad-hoc commands ("pause workflow", "explain this step")

***

### Pivot 5: Backend Hosting Strategy (Sprint 1)

**Original Plan:** User-hosted Agent Zero instances from day 1  
**Final Decision:** Praxis-hosted backend for MVP, self-hosting as future enterprise feature  

**Rationale:**
- Removes onboarding friction (no VPS setup)
- Faster iteration (we control infrastructure)
- Better security/monitoring

**Future Roadmap:**
- **Phase 1 (MVP):** Praxis-hosted, multi-tenant Agent Zero
- **Phase 2 (Q3 2026):** Enterprise option to link own VPS/database
- **Phase 3 (Q4 2026):** Full on-premise deployments

***

## Technical Architecture

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Geist font (modern, professional)
- next-themes (light/dark mode)

**Backend:**
- Supabase (Auth, PostgreSQL, Realtime, Storage)
- Row-Level Security (RLS) for multi-tenancy
- Server-side rendering for security

**Deployment:**
- Vercel (frontend)
- Supabase Cloud (backend)

**AI/Agents:**
- OpenRouter (multi-model routing)
- Agent Zero (workflow orchestration)
- Models: Claude Sonnet 3.5, Gemini 2.0 Flash, GPT-4 Turbo

***

### Database Schema (Simplified)

```
organizations (1) ──→ (n) projects ──→ (n) teams ──→ (n) agents
                                                 └──→ (n) workflows ──→ (n) workflow_runs
                                  └──→ (n) tasks
                                  └──→ (n) chat_messages
```

**Key Tables:**
- `organizations` - Workspace level (owner + settings)
- `projects` - Code repositories (GitHub repo link, color, status)
- `teams` - Development teams (1 per project in MVP: "Development")
- `agents` - GMAD stack (Research, Builder, Review, Sync) with model configs
- `workflows` - Workflow definitions (hardcoded "Feature Development")
- `workflow_runs` - Execution history (status, cost, PR URL)
- `workflow_steps` - Step-by-step logs (agent output, duration, cost)
- `tasks` - Roadmap items (status, priority, assignee)
- `chat_messages` - Real-time agent activity feed

**Security:** RLS policies ensure users only see their own data. [document360](https://document360.com/blog/technical-specification-document/)

***

### Agent Configuration System

Each agent has:
1. **Model selection** - Choose provider (Anthropic, Google, OpenAI) + specific model
2. **System prompt** - Editable instructions (templates provided)
3. **Budget limits** - Max cost per run + monthly cap
4. **Status** - Active, paused, archived

**Default GMAD Configuration:**
- **Research:** Perplexity Sonar Pro ($0.50/run, $50/month)
- **Builder:** Claude Sonnet 3.5 ($3.00/run, $150/month)
- **Review:** Claude Sonnet 3.5 ($1.00/run, $80/month)
- **Sync:** Gemini 2.0 Flash ($0.10/run, $20/month)

**Total:** ~$4.60 per workflow, $300/month budget.

***

## Feature Roadmap

### MVP (Weeks 1-4) ✅

**Core Workflow:**
- [x] GMAD workflow (Research → PRD → Build → Review → Sync)
- [x] Workflow progress modal (real-time updates)
- [x] Chat sidebar (monitoring-only, collapsible)
- [x] GitHub PR creation (simulated in MVP)

**UI/UX:**
- [x] Multi-project dashboard with cards
- [x] Collapsible left sidebar (project hierarchy)
- [x] Light/dark theme toggle
- [x] Roadmap with Kanban/List/Timeline views
- [x] Agent management page

**Auth & Onboarding:**
- [x] Email/password authentication (8+ chars, complexity)
- [x] Onboarding flow (org → project → team → agents)
- [x] RLS policies for multi-tenancy

***

### Sprint 2 (Weeks 5-6) 🔄

**GitHub Integration:**
- [ ] GitHub OAuth (real PR creation)
- [ ] Repository selection
- [ ] Branch/commit management

**Task Management:**
- [ ] Create/edit/delete tasks manually
- [ ] Drag-drop task status updates
- [ ] Task detail modal with comments

**Agent Configuration:**
- [ ] Save agent model/prompt changes
- [ ] Cost tracking dashboard
- [ ] Agent pause/resume controls

**Workflows:**
- [ ] Workflows page (stats, history)
- [ ] Workflow run details page
- [ ] Retry failed workflows

***

### Phase 2: Real Agent Zero (Weeks 7-10)

**Replace Simulation:**
- [ ] Deploy Agent Zero on VPS (Docker per user)
- [ ] Replace `executeWorkflowAsync()` with real API calls
- [ ] Webhook callbacks for step updates

**Advanced Features:**
- [ ] Workflow halting/resuming
- [ ] Manual approval gates (e.g., "approve review before sync")
- [ ] Custom instructions per workflow run

**Performance:**
- [ ] Parallel agent execution where possible
- [ ] Caching for common research queries
- [ ] Streaming updates (SSE) for better UX

***

### Phase 3: Collaboration (Q3 2026)

- [ ] Team members (invite users to projects)
- [ ] Role-based permissions (admin, developer, viewer)
- [ ] Activity feed with @mentions
- [ ] Shared chat threads per workflow
- [ ] Approval workflows (reviewers required)

***

### Phase 4: Enterprise (Q4 2026)

- [ ] Self-hosted deployments (Docker Compose)
- [ ] Link own VPS/database/LLM keys
- [ ] SSO (SAML, OAuth)
- [ ] Audit logs
- [ ] Custom model providers
- [ ] SLA guarantees

***

## User Flows

### Primary Flow: Feature Development

1. **User logs in** → Dashboard shows recent activity
2. **User clicks project** → Navigates to Roadmap (Kanban view)
3. **User clicks "New Task"** → Modal to create task
4. **User fills task details** → Title, description, priority
5. **User clicks "Start Workflow"** → GMAD workflow begins
6. **Workflow progress modal opens** → Real-time step updates
7. **Agents execute sequentially**:
   - Research Agent finds best practices (2 min)
   - Builder Agent generates PRD (3 min)
   - Builder Agent implements code (15 min)
   - Review Agent checks code (5 min)
   - Sync Agent creates GitHub PR (1 min)
8. **User receives notification** → PR URL in chat + modal
9. **User reviews PR on GitHub** → Merge or request changes
10. **Task moves to "Done"** → Workflow complete

**Total Time:** ~26 minutes from task creation to PR.

***

### Secondary Flow: Agent Configuration

1. **User navigates to Agents page** → Shows 4 GMAD agents
2. **User clicks agent card** → Opens config modal
3. **User edits settings**:
   - Change model (e.g., GPT-4 → Claude)
   - Modify system prompt (add custom instructions)
   - Adjust budget limits
4. **User saves changes** → Updates persist to database
5. **Next workflow run uses new config** → Cost/behavior changes

***

## Success Metrics

### North Star Metric
**Time from idea to production** (target: <30 minutes)

### Key Performance Indicators (KPIs)

**Product Metrics:**
- Workflow completion rate (target: >85%)
- Average workflow duration (target: <26 min)
- Cost per workflow (target: <$5.00)
- PR merge rate (target: >70%)

**User Engagement:**
- DAU/MAU ratio (target: >40%)
- Workflows per user per week (target: >5)
- Project creation rate (target: >1.5 projects/user)
- Agent config changes per month (target: >2/user)

**Business Metrics:**
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn rate (target: <5%/month)

**Technical Metrics:**
- Workflow success rate (target: >90%)
- Average agent latency (target: <2s per step)
- Infrastructure cost per workflow (target: <$1.00)
- Uptime (target: 99.9%)

***

## Open Questions & Risks

### Technical Risks

1. **Agent reliability** - What if Builder Agent generates broken code?
   - **Mitigation:** Review Agent adversarial checks, fallback to simpler models
   
2. **GitHub rate limits** - Heavy API usage per workflow
   - **Mitigation:** Batch operations, caching, user's own GitHub tokens

3. **Cost control** - Users triggering expensive workflows repeatedly
   - **Mitigation:** Per-agent budget caps, monthly limits, alerts

4. **Realtime scalability** - Supabase Realtime limits at scale
   - **Mitigation:** Polling fallback, Redis for high-frequency updates

### Product Risks

1. **Value perception** - Is 26 min fast enough vs manual development?
   - **Validation:** User testing, compare against actual dev time

2. **Trust in AI code** - Will users trust code they didn't write?
   - **Mitigation:** Transparent Review Agent output, confidence scores

3. **Workflow customization demand** - Do users need custom workflows immediately?
   - **Validation:** MVP with hardcoded GMAD, collect feedback

4. **Pricing model** - Usage-based vs flat subscription?
   - **Validation:** A/B test pricing, survey early adopters

***

## Competitive Analysis

### Direct Competitors

**GitHub Copilot Workspace**
- Strengths: Deep GitHub integration, familiar interface
- Weaknesses: Single AI model, no multi-agent collaboration, manual orchestration
- **Our Advantage:** Autonomous GMAD workflow, specialized agents

**Cursor**
- Strengths: IDE integration, fast autocomplete
- Weaknesses: Developer still writes code, no workflow automation
- **Our Advantage:** Zero coding required, end-to-end automation

**Replit Agent**
- Strengths: Full-stack code generation, deployment
- Weaknesses: Limited to Replit environment, no GitHub integration
- **Our Advantage:** Works with existing GitHub repos, flexible deployment

### Indirect Competitors

**Linear/Jira**
- Category: Project management
- **Our Position:** Replaces task tracking + implements tasks automatically

**Vercel v0**
- Category: UI generation
- **Our Position:** Full-stack features, not just UI components

***

## Go-to-Market Strategy

### Launch Plan (Q2 2026)

**Phase 1: Private Beta (Weeks 1-4)**
- 50 hand-picked users (indie hackers, early adopters)
- Free access, collect feedback
- Focus: Workflow reliability, UX polish

**Phase 2: Public Beta (Weeks 5-8)**
- Open waitlist, 500 users
- Introduce usage limits (10 workflows/month free)
- Focus: Scalability, pricing validation

**Phase 3: General Availability (Week 9+)**
- Remove waitlist, public launch
- Paid tiers: $29/mo (50 workflows), $99/mo (unlimited)
- Focus: Growth, retention, enterprise pipeline

### Marketing Channels

1. **Developer Communities**
   - Hacker News (Show HN post)
   - Reddit (r/SideProject, r/webdev)
   - Product Hunt launch
   - Indie Hackers showcase

2. **Content Marketing**
   - Blog: "How we ship features 10x faster with AI agents"
   - YouTube: Demo videos, case studies
   - Twitter: Thread on GMAD architecture

3. **Partnerships**
   - GitHub Marketplace listing
   - Vercel templates
   - OpenRouter featured integration

***

## Team & Roles

**Current Team:**
- **Technical Lead** - Full-stack development, architecture
- **Product Owner** - Roadmap, user research, specs
- **Designer** (Part-time) - UI/UX, branding

**Needed Roles:**
- **DevOps Engineer** (Q3) - Agent Zero infrastructure, scaling
- **Backend Engineer** (Q3) - Workflow orchestration, APIs
- **Growth Marketer** (Q4) - User acquisition, analytics

***

## Budget & Funding

### MVP Development Cost (Q2 2026)
- **Engineering:** $0 (founder-built)
- **Infrastructure:** $200/month (Vercel + Supabase + OpenRouter testing)
- **Design:** $2,000 (contract designer for brand + UI system)
- **Legal:** $1,500 (incorporation, terms of service)
- **Total:** ~$5,000 for 3-month MVP

### Operational Cost (Post-Launch)
- **Infrastructure:** $2,000/month (agent compute, database)
- **AI API costs:** $0.50-$5.00 per workflow (pass-through to users)
- **Salary:** $15,000/month (3 FTE post-seed)
- **Marketing:** $5,000/month (ads, content)
- **Total:** ~$22,000/month burn

**Funding Strategy:** Bootstrap to $10K MRR, then raise $1-2M seed for growth.

***

## Appendix

### Links
- **GitHub Repository:** [github.com/agoralabs/praxis-developer](https://github.com/agoralabs/praxis-developer)
- **Production URL:** [praxis-developer-4mjkfbbnz-agoralabs.vercel.app](https://praxis-developer-4mjkfbbnz-agoralabs.vercel.app)
- **Supabase Project:** [kzcdbnznpshplbikbgub.supabase.co](https://kzcdbnznpshplbikbgub.supabase.co)
- **Design System:** shadcn/ui + Tailwind CSS + Geist font

### Glossary
- **GMAD:** Research, Builder, Review, Sync agent workflow architecture
- **Agent Zero:** Workflow orchestration framework (Python-based)
- **OpenRouter:** Multi-model API gateway (Anthropic, Google, OpenAI)
- **RLS:** Row-Level Security (Supabase feature for multi-tenancy)
- **PRD:** Product Requirements Document (generated by Builder Agent)

***

**This document serves as the single source of truth for Praxis Developer's vision, architecture, and roadmap. Update as major decisions are made.**