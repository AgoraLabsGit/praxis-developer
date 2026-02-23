'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AgentConfigModal } from '@/components/agent-config-modal';
import type { Agent } from '@/lib/types';
import { Settings } from 'lucide-react';

export function AgentCard({ agent }: { agent: Agent }) {
  const [configOpen, setConfigOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 flex flex-row items-start justify-between">
          <div>
            <h3 className="font-semibold">{agent.name}</h3>
            <Badge variant="secondary" className="mt-1 text-xs">
              {agent.type}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setConfigOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {agent.model_provider ?? '—'} / {agent.model_name}
          </p>
          <p className="text-xs text-muted-foreground">
            ${agent.current_month_spend?.toFixed(2) ?? '0.00'} of $
            {agent.monthly_budget}/mo
          </p>
          <Badge
            variant={agent.status === 'active' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {agent.status}
          </Badge>
        </CardContent>
      </Card>
      <AgentConfigModal
        agent={agent}
        open={configOpen}
        onOpenChange={setConfigOpen}
        onSaved={() => router.refresh()}
      />
    </>
  );
}
