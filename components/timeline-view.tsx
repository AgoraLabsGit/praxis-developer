'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format, addDays } from 'date-fns';
import type { Task } from '@/lib/types';

export function TimelineView({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchTasks() {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true });

      setTasks(data ?? []);
      setLoading(false);
    }
    fetchTasks();
  }, [projectId, supabase]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 7);
  const endDate = addDays(today, 30);
  const days: Date[] = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="grid gap-2" style={{ gridTemplateColumns: `200px repeat(${days.length}, 1fr)` }}>
          <div className="font-medium p-2 border-b">Task</div>
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={`p-2 text-xs text-center border-b ${
                format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
                  ? 'bg-muted'
                  : ''
              }`}
            >
              {format(day, 'MMM d')}
            </div>
          ))}
        </div>
        {tasks.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No tasks with due dates. Add due dates to see them on the timeline.
          </div>
        ) : (
          tasks.map((task) => {
            const taskStart = task.due_date
              ? new Date(task.due_date)
              : new Date(today);
            const dayIndex = days.findIndex(
              (d) => format(d, 'yyyy-MM-dd') === format(taskStart, 'yyyy-MM-dd')
            );

            return (
              <div
                key={task.id}
                className="grid gap-2 items-center py-1 border-b last:border-0"
                style={{ gridTemplateColumns: `200px repeat(${days.length}, 1fr)` }}
              >
                <div className="p-2 truncate font-medium text-sm">
                  {task.title}
                </div>
                {days.map((day, i) => (
                  <div key={i} className="p-1 min-h-[24px]">
                    {dayIndex === i && (
                      <div
                        className="h-6 rounded bg-foreground/10 border border-foreground/20"
                        title={task.title}
                      />
                    )}
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
