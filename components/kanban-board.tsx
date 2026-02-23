'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { Task } from '@/lib/types';

const COLUMNS = [
  { id: 'todo', title: 'Todo' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'Review' },
  { id: 'done', title: 'Done' },
] as const;

export function KanbanBoard({
  projectId,
}: {
  projectId: string;
  groupBy?: 'status' | 'agent' | 'date';
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true });

    setTasks(data ?? []);
    setLoading(false);
  }, [projectId, supabase]);

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel('tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        fetchTasks
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks, projectId, supabase]);

  async function handleDragEnd(result: {
    destination?: { droppableId: string; index: number } | null;
    source: { droppableId: string; index: number };
    draggableId: string;
  }) {
    if (!result.destination || (result.destination.droppableId === result.source.droppableId && result.destination.index === result.source.index)) {
      return;
    }

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId as Task['status'];

    await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      )
    );
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const tasksByColumn = COLUMNS.reduce(
    (acc, col) => ({
      ...acc,
      [col.id]: tasks.filter((t) => t.status === col.id),
    }),
    {} as Record<string, Task[]>
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided) => (
              <Card
                className="min-w-[280px] flex-shrink-0"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                  <h4 className="font-medium">{column.title}</h4>
                  <Badge variant="secondary">
                    {tasksByColumn[column.id]?.length ?? 0}
                  </Badge>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {(tasksByColumn[column.id] ?? []).map((task, index) => (
                    <Draggable
                      key={task.id}
                      draggableId={task.id}
                      index={index}
                    >
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="py-2 px-3 cursor-grab active:cursor-grabbing"
                        >
                          <p className="text-sm font-medium">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {task.description}
                            </p>
                          )}
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add task
                  </Button>
                  {provided.placeholder}
                </CardContent>
              </Card>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
