'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plug, CreditCard, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  plug: Plug,
  'credit-card': CreditCard,
  shield: Shield,
};

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export function SettingsNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="w-48 shrink-0 space-y-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
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
