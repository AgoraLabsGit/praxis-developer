import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const GITHUB_REPOS_URL = 'https://api.github.com/user/repos?per_page=100&sort=updated';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: project } = await supabase
    .from('projects')
    .select('organization_id')
    .eq('id', projectId)
    .single();

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', project.organization_id)
    .eq('owner_id', user.id)
    .single();

  if (!org) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: integration } = await supabase
    .from('workspace_integrations')
    .select('encrypted_token')
    .eq('organization_id', org.id)
    .eq('service', 'github')
    .single();

  if (!integration?.encrypted_token) {
    return NextResponse.json(
      { error: 'GitHub not connected. Connect in Workspace Settings → Integrations.' },
      { status: 400 }
    );
  }

  const res = await fetch(GITHUB_REPOS_URL, {
    headers: {
      Authorization: `Bearer ${integration.encrypted_token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 502 }
    );
  }

  const repos = await res.json();
  const list = repos.map((r: { full_name: string; default_branch: string }) => ({
    full_name: r.full_name,
    default_branch: r.default_branch || 'main',
  }));

  return NextResponse.json({ repos: list });
}
