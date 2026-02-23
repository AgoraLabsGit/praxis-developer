import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
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

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!org) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }

  const body = await request.json();
  const apiToken = body.apiToken as string | undefined;
  const projectId = body.projectId as string | undefined;

  if (!apiToken?.trim()) {
    return NextResponse.json(
      { error: 'API token is required' },
      { status: 400 }
    );
  }

  // Store token in workspace_integrations (encrypt in production)
  const { error: upsertError } = await supabase
    .from('workspace_integrations')
    .upsert(
      {
        organization_id: org.id,
        service: 'vercel',
        encrypted_token: apiToken.trim(),
        metadata: { project_id: projectId?.trim() || null },
      },
      {
        onConflict: 'organization_id,service',
      }
    );

  if (upsertError) {
    return NextResponse.json(
      { error: upsertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE() {
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

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!org) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }

  await supabase
    .from('workspace_integrations')
    .delete()
    .eq('organization_id', org.id)
    .eq('service', 'vercel');

  return NextResponse.json({ success: true });
}
