'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Github } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  settings: Settings,
  github: Github,
};

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export function ProjectSettingsNav({
  items,
  projectId,
}: {
  items: NavItem[];
  projectId: string;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 border-b pb-4">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const isActive =
          item.href === pathname ||
          (item.href !== `/dashboard/${projectId}/settings` &&
            pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
