'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { KanbanBoard } from '@/components/kanban-board';
import { ListView } from '@/components/list-view';
import { TimelineView } from '@/components/timeline-view';
import { Button } from '@/components/ui/button';
import { Settings, Users } from 'lucide-react';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [view, setView] = useState<'kanban' | 'list' | 'timeline'>('kanban');
  const [groupBy, setGroupBy] = useState<'status' | 'agent' | 'date'>('status');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Roadmap</h2>

        <div className="flex items-center gap-3">
          <Link href={`/dashboard/${projectId}/agents`}>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Agents
            </Button>
          </Link>
          <Link href={`/dashboard/${projectId}/settings`}>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
          <Select value={groupBy} onValueChange={(v: 'status' | 'agent' | 'date') => setGroupBy(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status">Group by Status</SelectItem>
              <SelectItem value="agent">Group by Agent</SelectItem>
              <SelectItem value="date">Group by Date</SelectItem>
            </SelectContent>
          </Select>

          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
            <TabsList>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button>+ New Task</Button>
        </div>
      </div>

      {view === 'kanban' && (
        <KanbanBoard projectId={projectId} groupBy={groupBy} />
      )}
      {view === 'list' && (
        <ListView projectId={projectId} groupBy={groupBy} />
      )}
      {view === 'timeline' && <TimelineView projectId={projectId} />}
    </div>
  );
}
