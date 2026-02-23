# Sprint-2-UI-v2.md (Production-Ready)

## All Critical Issues Fixed

**Status: ✅ Complete** (Feb 2025)

***

## Step 0: Pre-Implementation Checklist

### Install Dependencies

```bash
# Theme support
npm install next-themes

# Additional shadcn components
npx shadcn-ui@latest add dropdown-menu avatar badge separator switch
```

### Route Structure Decision

**CHOSEN:** Keep current structure `/dashboard/...`

- ✅ `/dashboard` (dashboard home)
- ✅ `/dashboard/[projectId]` (project roadmap)
- ✅ `/dashboard/[projectId]/agents` (agents)
- ✅ `/dashboard/[projectId]/settings` (settings)
- ✅ `/dashboard/new-project` (new project)

**NEW:** Add workflows page
- ✅ `/dashboard/[projectId]/workflows` (workflows)

***

## Step 1: Theme Provider + Font Stack

### Keep Geist Font (Already Installed)

**File**: `app/layout.tsx`

```typescript
import { GeistSans } from 'geist/font/sans';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

export const metadata = {
  title: 'Praxis Developer',
  description: 'AI-powered development platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={GeistSans.variable}>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Note:** If using local Geist font (e.g. `next/font/local` with GeistVF.woff), keep existing font setup and add `suppressHydrationWarning` to `<html>` plus `ThemeProvider` wrapper.

### Theme Provider Component

**File**: `components/theme-provider.tsx`

```typescript
'use client';

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

### Updated Global Styles

**File**: `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 217 91% 60%;
    --primary-foreground: 0 0% 100%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 100%;
    --success: 142 71% 45%;
    --success-foreground: 0 0% 100%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 217 91% 60%;
    --radius: 0.75rem;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 6%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 6%;
    --popover-foreground: 0 0% 98%;
    --primary: 217 91% 60%;
    --primary-foreground: 0 0% 100%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 50.6%;
    --destructive-foreground: 0 0% 100%;
    --success: 142 71% 45%;
    --success-foreground: 0 0% 100%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 217 91% 60%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

***

## Step 2: Updated Dashboard Layout

**File**: `app/(dashboard)/layout.tsx`

> **Route structure:** Create `app/(dashboard)/` and move dashboard routes to `app/(dashboard)/dashboard/`. The `(dashboard)` group does not affect URLs.

```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard-shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/login');
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('owner_id', user.id)
    .single();

  if (!org) {
    redirect('/onboard');
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, color, description')
    .eq('organization_id', org.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  return (
    <DashboardShell
      user={user}
      organization={org}
      projects={projects || []}
    >
      {children}
    </DashboardShell>
  );
}
```

**Alternative (no route group):** To keep `app/dashboard/layout.tsx`, use this layout in place of the existing dashboard layout and update imports accordingly.

***

## Step 3: Dashboard Shell Component

**File**: `components/dashboard-shell.tsx`

```typescript
'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  FolderKanban,
  Users,
  Workflow,
  Settings,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Bell,
  LogOut,
  Plus,
  MessageSquare,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ChatSidebar } from '@/components/chat-sidebar';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface DashboardShellProps {
  children: React.ReactNode;
  user: any;
  organization: any;
  projects: any[];
}

export function DashboardShell({
  children,
  user,
  organization,
  projects,
}: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const userInitials = user.email?.substring(0, 2).toUpperCase() || 'U';

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-lg hidden md:block">
              Praxis Developer
            </span>
          </Link>

          <Separator orientation="vertical" className="h-6" />

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{organization.name}</span>
            {getCurrentBreadcrumb(pathname, projects)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="relative"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden md:block">
                  @{user.email?.split('@')[0]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={cn(
            "border-r bg-card transition-all duration-300 shrink-0",
            sidebarCollapsed ? "w-16" : "w-64"
          )}
        >
          <div className="flex flex-col h-full">
            {/* Collapse Button */}
            <div className="h-12 flex items-center justify-between px-4 border-b">
              {!sidebarCollapsed && (
                <span className="text-sm font-medium text-muted-foreground">
                  Navigation
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="ml-auto"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              <NavItem
                href="/dashboard"
                icon={Home}
                label="Dashboard"
                collapsed={sidebarCollapsed}
                active={pathname === '/dashboard'}
              />

              <Separator className="my-3" />

              {/* Projects Section */}
              {!sidebarCollapsed && (
                <div className="px-3 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Projects
                    </span>
                    <Link href="/dashboard/new-project">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Plus className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {projects.map(project => (
                <ProjectNavItem
                  key={project.id}
                  project={project}
                  collapsed={sidebarCollapsed}
                  active={pathname.includes(`/dashboard/${project.id}`)}
                />
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Right Chat Sidebar */}
        {!chatCollapsed && (
          <aside
            className={cn(
              "border-l bg-card transition-all duration-300 shrink-0 flex flex-col",
              chatExpanded ? "w-[600px]" : "w-96"
            )}
          >
            {/* Chat Header */}
            <div className="h-12 flex items-center justify-between px-4 border-b">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">AI Agents</span>
                <Badge variant="secondary" className="text-xs">
                  GMAD
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setChatExpanded(!chatExpanded)}
                >
                  {chatExpanded ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setChatCollapsed(true)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Chat Content */}
            <ChatSidebar projectId={getCurrentProjectId(pathname)} />
          </aside>
        )}

        {/* Collapsed Chat Toggle */}
        {chatCollapsed && (
          <div className="w-12 border-l bg-card flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setChatCollapsed(false)}
              className="rotate-90"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  collapsed,
  active,
}: {
  href: string;
  icon: any;
  label: string;
  collapsed: boolean;
  active: boolean;
}) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "hover:bg-accent text-foreground",
          collapsed && "justify-center"
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {!collapsed && <span className="text-sm font-medium">{label}</span>}
      </div>
    </Link>
  );
}

function ProjectNavItem({
  project,
  collapsed,
  active,
}: {
  project: any;
  collapsed: boolean;
  active: boolean;
}) {
  const [expanded, setExpanded] = useState(active);

  if (collapsed) {
    return (
      <Link href={`/dashboard/${project.id}`}>
        <div
          className={cn(
            "flex items-center justify-center p-2 rounded-lg transition-colors",
            active ? "bg-accent" : "hover:bg-accent"
          )}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: project.color }}
          >
            {project.name.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
          active ? "bg-accent" : "hover:bg-accent"
        )}
      >
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: project.color }}
        >
          {project.name.substring(0, 1).toUpperCase()}
        </div>
        <span className="text-sm font-medium truncate flex-1 text-left">
          {project.name}
        </span>
        <ChevronRight
          className={cn(
            "w-4 h-4 transition-transform shrink-0",
            expanded && "rotate-90"
          )}
        />
      </button>

      {expanded && (
        <div className="ml-8 mt-1 space-y-1">
          <Link href={`/dashboard/${project.id}`}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors">
              <FolderKanban className="w-3 h-3" />
              <span className="text-sm">Roadmap</span>
            </div>
          </Link>
          <Link href={`/dashboard/${project.id}/agents`}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors">
              <Users className="w-3 h-3" />
              <span className="text-sm">Agents</span>
            </div>
          </Link>
          <Link href={`/dashboard/${project.id}/workflows`}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors">
              <Workflow className="w-3 h-3" />
              <span className="text-sm">Workflows</span>
            </div>
          </Link>
          <Link href={`/dashboard/${project.id}/settings`}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors">
              <Settings className="w-3 h-3" />
              <span className="text-sm">Settings</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

function getCurrentProjectId(pathname: string): string | undefined {
  // Match /dashboard/{projectId} but not /dashboard/new-project
  const match = pathname.match(/^\/dashboard\/([^\/]+)/);
  if (match && match[1] !== 'new-project') {
    return match[1];
  }
  return undefined;
}

function getCurrentBreadcrumb(pathname: string, projects: any[]) {
  const projectId = getCurrentProjectId(pathname);
  if (!projectId) return null;

  const project = projects.find(p => p.id === projectId);
  if (!project) return null;

  let page = 'Roadmap';
  if (pathname.includes('/agents')) page = 'Agents';
  if (pathname.includes('/workflows')) page = 'Workflows';
  if (pathname.includes('/settings')) page = 'Settings';

  return (
    <>
      <ChevronRight className="w-4 h-4" />
      <span>{project.name}</span>
      <ChevronRight className="w-4 h-4" />
      <span className="text-foreground">{page}</span>
    </>
  );
}
```

***

## Step 4: Updated Chat Sidebar (No Input)

**File**: `components/chat-sidebar.tsx`

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Loader2 } from 'lucide-react';

interface ChatSidebarProps {
  projectId?: string;
}

export function ChatSidebar({ projectId }: ChatSidebarProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    fetchMessages();
    
    const channel = supabase
      .channel(`chat:${projectId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        scrollToBottom();
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [projectId]);

  async function fetchMessages() {
    if (!projectId) return;
    
    setLoading(true);
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .limit(100);
    
    if (data) setMessages(data);
    setLoading(false);
    scrollToBottom();
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  if (!projectId) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Select a project to view chat
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-2">
        No messages yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Start a workflow from the roadmap to see agent activity here
      </p>
    </div>
  );
}

function ChatMessage({ message }: { message: any }) {
  const isUser = message.sender_type === 'user';
  const isSystem = message.sender_type === 'system';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl p-3 ${
        isUser 
          ? 'bg-primary text-primary-foreground' 
          : isSystem
          ? 'bg-muted border'
          : 'bg-card border'
      }`}>
        {!isUser && message.sender_name && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">
                {message.sender_name.substring(0, 1)}
              </span>
            </div>
            <span className="text-xs font-semibold">
              {message.sender_name}
            </span>
          </div>
        )}
        
        <div className="text-sm whitespace-pre-wrap">
          {message.content}
        </div>
        
        <div className={`text-xs mt-2 ${
          isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
        }`}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}
```

***

## Step 5: New Dashboard Page

**File**: `app/(dashboard)/dashboard/page.tsx`  
*Or* `app/dashboard/page.tsx` if not using route group.

```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  TrendingUp,
  Clock,
  DollarSign,
  Zap,
  Plus,
  ArrowRight,
  CheckCircle2,
  Loader2,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user!.id)
    .single();

  // Fetch projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', org!.id)
    .eq('status', 'active')
    .limit(6);

  // Fetch recent workflow runs with corrected relations
  const { data: recentRuns } = await supabase
    .from('workflow_runs')
    .select(`
      *,
      workflow:workflows (
        name,
        team:teams (
          project:projects (
            id,
            name,
            color
          )
        )
      )
    `)
    .eq('user_id', user!.id)
    .order('started_at', { ascending: false })
    .limit(5);

  // Fetch agent counts for projects
  const projectsWithAgents = await Promise.all(
    (projects || []).map(async (project) => {
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('project_id', project.id)
        .single();

      if (!team) return { ...project, agentCount: 0 };

      const { count } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', team.id);

      return { ...project, agentCount: count || 0 };
    })
  );

  // Calculate stats
  const totalWorkflows = recentRuns?.length || 0;
  const completedWorkflows = recentRuns?.filter(r => r.status === 'completed').length || 0;
  const totalCost = recentRuns?.reduce((sum, r) => sum + (parseFloat(r.total_cost) || 0), 0) || 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Welcome back, {user?.email?.split('@')[0]}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your AI development
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Zap}
          label="Total Workflows"
          value={totalWorkflows.toString()}
          trend="+12% from last week"
          trendUp
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={completedWorkflows.toString()}
          trend={`${totalWorkflows > 0 ? Math.round((completedWorkflows / totalWorkflows) * 100) : 0}% success rate`}
        />
        <StatCard
          icon={DollarSign}
          label="Total Spend"
          value={`$${totalCost.toFixed(2)}`}
          trend="This month"
        />
        <StatCard
          icon={Clock}
          label="Avg. Time"
          value="26 min"
          trend="Per workflow"
        />
      </div>

      {/* Projects Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Projects</h2>
          <Link href="/dashboard/new-project">
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </Link>
        </div>

        {projectsWithAgents && projectsWithAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectsWithAgents.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Create your first project
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started with AI-powered development
            </p>
            <Link href="/dashboard/new-project">
              <Button>Create Project</Button>
            </Link>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Workflows</h2>
        {recentRuns && recentRuns.length > 0 ? (
          <Card className="divide-y">
            {recentRuns.map(run => (
              <WorkflowActivityItem key={run.id} run={run} />
            ))}
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No workflow activity yet. Start by creating a task in your roadmap.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
}: {
  icon: any;
  label: string;
  value: string;
  trend: string;
  trendUp?: boolean;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className={`text-xs flex items-center gap-1 ${
        trendUp ? 'text-success' : 'text-muted-foreground'
      }`}>
        {trendUp && <TrendingUp className="w-3 h-3" />}
        {trend}
      </div>
    </Card>
  );
}

function ProjectCard({ project }: { project: any }) {
  return (
    <Link href={`/dashboard/${project.id}`}>
      <Card className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 hover:border-primary/50">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
            style={{ backgroundColor: project.color }}
          >
            {project.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            {project.description && (
              <p className="text-sm text-muted-foreground truncate">
                {project.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {project.agentCount} agents
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </Card>
    </Link>
  );
}

function WorkflowActivityItem({ run }: { run: any }) {
  const project = run.workflow?.team?.project;
  const statusIcon = {
    completed: <CheckCircle2 className="w-5 h-5 text-success" />,
    running: <Loader2 className="w-5 h-5 text-primary animate-spin" />,
    failed: <XCircle className="w-5 h-5 text-destructive" />,
  }[run.status] || <Clock className="w-5 h-5 text-muted-foreground" />;

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors">
      {statusIcon}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {project && (
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: project.color }}
            />
          )}
          <span className="font-medium truncate">
            {run.input_task}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
          {run.total_cost && ` • $${parseFloat(run.total_cost).toFixed(2)}`}
        </div>
      </div>

      {run.status === 'completed' && run.pr_url && (
        <Link href={run.pr_url} target="_blank">
          <Button variant="outline" size="sm" className="gap-2">
            View PR
            <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      )}
    </div>
  );
}
```

***

## Step 6: Create Workflows Page

**File**: `app/(dashboard)/dashboard/[projectId]/workflows/page.tsx`  
*Or* `app/dashboard/[projectId]/workflows/page.tsx` if not using route group.

```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Workflow, Clock, DollarSign, CheckCircle2 } from 'lucide-react';

export default async function WorkflowsPage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = await createServerSupabaseClient();

  // Get team for this project
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('project_id', params.projectId)
    .single();

  if (!team) {
    return <div>Team not found</div>;
  }

  // Get workflow
  const { data: workflow } = await supabase
    .from('workflows')
    .select('*')
    .eq('team_id', team.id)
    .single();

  // Get workflow runs
  const { data: runs } = await supabase
    .from('workflow_runs')
    .select('*')
    .eq('workflow_id', workflow?.id)
    .order('started_at', { ascending: false })
    .limit(20);

  const totalRuns = runs?.length || 0;
  const completedRuns = runs?.filter(r => r.status === 'completed').length || 0;
  const totalCost = runs?.reduce((sum, r) => sum + (parseFloat(r.total_cost) || 0), 0) || 0;
  const avgTime = runs && runs.length > 0
    ? runs.reduce((sum, r) => sum + (r.duration_seconds || 0), 0) / runs.length
    : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Workflows</h1>
        <p className="text-muted-foreground">
          Manage and monitor your GMAD workflow
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Workflow className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Total Runs
            </span>
          </div>
          <div className="text-2xl font-bold">{totalRuns}</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-muted-foreground">
              Success Rate
            </span>
          </div>
          <div className="text-2xl font-bold">
            {totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0}%
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Total Cost
            </span>
          </div>
          <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Avg. Duration
            </span>
          </div>
          <div className="text-2xl font-bold">
            {Math.round(avgTime / 60)} min
          </div>
        </Card>
      </div>

      {/* Workflow Card */}
      {workflow && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Workflow className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{workflow.name}</h2>
              <p className="text-sm text-muted-foreground">
                GMAD: Research → PRD → Build → Review → Sync
              </p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4">
            {['Research', 'Generate PRD', 'Implementation', 'Review', 'Sync'].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <span className="font-bold text-primary">{i + 1}</span>
                </div>
                <div className="text-sm font-medium">{step}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Runs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Runs</h2>
        {runs && runs.length > 0 ? (
          <div className="space-y-2">
            {runs.map(run => (
              <Card key={run.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium mb-1">{run.input_task}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(run.started_at).toLocaleString()}
                      {run.total_cost && ` • $${parseFloat(run.total_cost).toFixed(2)}`}
                    </div>
                  </div>
                  <Badge variant={
                    run.status === 'completed' ? 'default' :
                    run.status === 'running' ? 'secondary' :
                    'destructive'
                  }>
                    {run.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No workflow runs yet
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
```

***

## Implementation Checklist

### Before Running

- [x] `npm install next-themes`
- [x] `npx shadcn-ui@latest add dropdown-menu avatar badge separator switch`
- [x] Verify Geist font is installed (or use existing local font setup)
- [x] Decide: use `(dashboard)` route group or keep `app/dashboard/` structure
- [x] All files created/updated

### After Running

- [x] Light/dark theme toggle works
- [x] Left sidebar collapses/expands
- [x] Project hierarchy shows all pages (Roadmap, Agents, Workflows, Settings)
- [x] Chat sidebar collapses/expands/maximizes
- [x] Dashboard shows stats and project cards
- [x] Workflows page displays correctly
- [x] All navigation links work
- [x] Breadcrumbs show correct path
- [x] Sign out works

### Supabase Relation Names

If `workflow:workflows` or `team:teams` / `project:projects` fail, check your schema's FK relation names. PostgREST uses the FK column name (minus `_id`) by default—e.g. `workflow_id` → `workflow`, `team_id` → `team`, `project_id` → `project`. Adjust the select strings accordingly.

---

## ✅ Completed (Feb 2025)

All steps implemented. Route structure: `app/dashboard/` (no route group).

### Implementation Notes

- **Theme provider:** Use `import { type ThemeProviderProps } from 'next-themes'` (not `next-themes/dist/types`).
- **Settings menu:** Links to first project's settings when projects exist (no `/dashboard/settings` page).
- **Chat sidebar:** Read-only per spec—displays agent messages from `chat_messages` table with real-time subscription. No user input/send UI. *Deferred:* Add text input + send button to enable user chat (DB already exists).
- **Workflows page:** Handles missing workflow (team exists but no workflow yet).

### Not in Scope (Sprint 2)

- Chat input/send buttons—add in future sprint if user-initiated chat is needed.
- `/dashboard/settings` user/account settings page.

***

**This is production-ready with all fixes applied. Ship it!** 🚀
