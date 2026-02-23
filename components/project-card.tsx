'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/lib/types';

export function ProjectCard({ project }: { project: Project }) {
  const agentCount =
    project.teams?.reduce(
      (acc, team) => acc + (team.agents?.length ?? 0),
      0
    ) ?? 0;

  return (
    <Link href={`/dashboard/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div
              className="h-3 w-3 rounded-full flex-shrink-0 mt-1"
              style={{ backgroundColor: project.color || '#3B82F6' }}
            />
            <h3 className="font-semibold text-lg truncate">{project.name}</h3>
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {agentCount} agents
            </Badge>
            {project.github_repo && (
              <Badge variant="outline" className="text-xs">
                {project.github_repo}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
