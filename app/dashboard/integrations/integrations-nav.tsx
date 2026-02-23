'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Github, Bot, Server, Key } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/dashboard/integrations/code', label: 'Code & Repos', icon: Github },
  { href: '/dashboard/integrations/ai-providers', label: 'AI Providers', icon: Bot },
  { href: '/dashboard/integrations/infrastructure', label: 'Infrastructure', icon: Server },
  { href: '/dashboard/integrations/keys', label: 'API Keys', icon: Key },
];

export function IntegrationsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 p-1 rounded-lg bg-muted/50 w-fit">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          pathname === tab.href || pathname.startsWith(tab.href + '/');
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
