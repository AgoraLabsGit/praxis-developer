import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectSettingsNav } from './project-settings-nav';

export default async function ProjectSettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .single();

  if (!project) {
    redirect('/dashboard');
  }

  const navItems = [
    { href: `/dashboard/${projectId}/settings`, label: 'General', icon: 'settings' },
    { href: `/dashboard/${projectId}/settings/repository`, label: 'Repository', icon: 'github' },
  ];

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/dashboard/${projectId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>
      <h2 className="text-2xl font-bold mb-6">Project Settings</h2>

      <ProjectSettingsNav items={navItems} projectId={projectId} />

      <div className="mt-6">{children}</div>
    </div>
  );
}
