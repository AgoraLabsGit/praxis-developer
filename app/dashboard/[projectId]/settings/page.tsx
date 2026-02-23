import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default async function SettingsPage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = await createServerSupabaseClient();

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.projectId)
    .single();

  if (!project) {
    redirect('/dashboard');
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/dashboard/${params.projectId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>
      <h2 className="text-2xl font-bold mb-6">Project Settings</h2>
      <div className="space-y-6 rounded-lg border bg-card p-6">
        <div>
          <h3 className="font-medium mb-2">Project Name</h3>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
        <div>
          <h3 className="font-medium mb-2">Description</h3>
          <p className="text-muted-foreground">
            {project.description || 'No description'}
          </p>
        </div>
        <div>
          <h3 className="font-medium mb-2">GitHub Repository</h3>
          <p className="text-muted-foreground">
            {project.github_repo || 'Not connected'}
          </p>
        </div>
      </div>
    </div>
  );
}
