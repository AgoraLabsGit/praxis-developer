'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { Task } from '@/lib/types';

export function ListView({
  projectId,
}: {
  projectId: string;
  groupBy?: 'status' | 'agent' | 'date';
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchTasks() {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      setTasks(data ?? []);
      setLoading(false);
    }
    fetchTasks();
  }, [projectId, supabase]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="rounded-lg border bg-card">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4 font-medium">Title</th>
            <th className="text-left p-4 font-medium">Status</th>
            <th className="text-left p-4 font-medium">Priority</th>
            <th className="text-left p-4 font-medium">Due Date</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b last:border-0 hover:bg-muted/50">
              <td className="p-4">
                <p className="font-medium">{task.title}</p>
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {task.description}
                  </p>
                )}
              </td>
              <td className="p-4">
                <Badge variant="secondary">{task.status}</Badge>
              </td>
              <td className="p-4">
                <Badge variant="outline">{task.priority}</Badge>
              </td>
              <td className="p-4 text-muted-foreground text-sm">
                {task.due_date
                  ? format(new Date(task.due_date), 'MMM d, yyyy')
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tasks.length === 0 && (
        <div className="p-12 text-center text-muted-foreground">
          No tasks yet. Create one to get started.
        </div>
      )}
    </div>
  );
}
