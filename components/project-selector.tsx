'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Project } from '@/lib/types';

export function ProjectSelector({
  projects,
  currentProjectId,
}: {
  projects: Project[];
  currentProjectId?: string;
}) {
  const router = useRouter();

  if (!projects || projects.length === 0) {
    return (
      <Link
        href="/dashboard/new-project"
        className="text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        + New Project
      </Link>
    );
  }

  return (
    <Select
      value={currentProjectId ?? ''}
      onValueChange={(value) => {
        if (value === '__new__') {
          router.push('/dashboard/new-project');
        } else {
          router.push(`/dashboard/${value}`);
        }
      }}
    >
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Select project" />
      </SelectTrigger>
      <SelectContent>
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: project.color || '#3B82F6' }}
              />
              {project.name}
            </div>
          </SelectItem>
        ))}
        <SelectItem value="__new__">+ New Project</SelectItem>
      </SelectContent>
    </Select>
  );
}
