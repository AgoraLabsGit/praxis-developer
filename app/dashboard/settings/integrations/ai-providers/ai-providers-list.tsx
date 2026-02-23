'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2, Star } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Provider {
  id: string;
  name: string;
  is_default: boolean;
  last_used_at: string | null;
}

export function AIProvidersList({ providers }: { providers: Provider[] }) {
  const router = useRouter();

  async function setDefault(id: string) {
    await fetch(`/api/settings/ai-providers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_default: true }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm('Remove this provider?')) return;
    await fetch(`/api/settings/ai-providers/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  if (providers.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        No AI providers configured. Add one below.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {providers.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between rounded-lg border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <span className="font-medium capitalize">{p.name}</span>
            {p.is_default && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                <Star className="w-3 h-3" />
                Default
              </span>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!p.is_default && (
                <DropdownMenuItem onClick={() => setDefault(p.id)}>
                  Set as default
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => remove(p.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
}
