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
  Plug,
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
import type { LucideIcon } from 'lucide-react';

interface User {
  email?: string;
}

interface Organization {
  name: string;
}

interface Project {
  id: string;
  name: string;
  color?: string;
}

interface DashboardShellProps {
  children: React.ReactNode;
  user: User;
  organization: Organization;
  projects: Project[];
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
              <DropdownMenuItem
                onClick={() => router.push('/dashboard/integrations')}
              >
                <Plug className="w-4 h-4 mr-2" />
                Integrations
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/dashboard/settings')}
              >
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
            <nav className="flex-1 overflow-y-auto p-3 space-y-1 flex flex-col">
              <div className="space-y-1">
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
              </div>

              <Separator className="my-3" />

              {/* Settings & Integrations (bottom) */}
              <div className="mt-auto pt-3 space-y-1 border-t">
                <NavItem
                  href="/dashboard/settings"
                  icon={Settings}
                  label="Settings"
                  collapsed={sidebarCollapsed}
                  active={pathname.startsWith('/dashboard/settings')}
                />
                <NavItem
                  href="/dashboard/integrations"
                  icon={Plug}
                  label="Integrations"
                  collapsed={sidebarCollapsed}
                  active={pathname.startsWith('/dashboard/integrations')}
                />
              </div>
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
  icon: LucideIcon;
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
  project: Project;
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
            style={{ backgroundColor: project.color || '#3B82F6' }}
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
          style={{ backgroundColor: project.color || '#3B82F6' }}
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
  const match = pathname.match(/^\/dashboard\/([^\/]+)/);
  const segment = match?.[1];
  // Exclude non-project routes
  if (segment && !['new-project', 'settings', 'integrations'].includes(segment)) {
    return segment;
  }
  return undefined;
}

function getCurrentBreadcrumb(pathname: string, projects: Project[]) {
  // Workspace-level settings (no project context)
  if (pathname === '/dashboard/settings' || pathname.startsWith('/dashboard/settings/')) {
    let page = 'General';
    if (pathname.includes('/billing')) page = 'Billing';
    if (pathname.includes('/security')) page = 'Security';
    return (
      <>
        <ChevronRight className="w-4 h-4" />
        <span>Settings</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">{page}</span>
      </>
    );
  }

  // Workspace-level integrations
  if (pathname === '/dashboard/integrations' || pathname.startsWith('/dashboard/integrations/')) {
    let page = 'Code & Repos';
    if (pathname.includes('/ai-providers')) page = 'AI Providers';
    if (pathname.includes('/infrastructure')) page = 'Infrastructure';
    if (pathname.includes('/keys')) page = 'API Keys';
    return (
      <>
        <ChevronRight className="w-4 h-4" />
        <span>Integrations</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">{page}</span>
      </>
    );
  }

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
