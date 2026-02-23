import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const GITHUB_USER_URL = 'https://api.github.com/user';

export async function POST() {
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

  const { data: integration } = await supabase
    .from('workspace_integrations')
    .select('encrypted_token')
    .eq('organization_id', org.id)
    .eq('service', 'github')
    .single();

  if (!integration?.encrypted_token) {
    return NextResponse.json(
      { error: 'GitHub not connected' },
      { status: 400 }
    );
  }

  const res = await fetch(GITHUB_USER_URL, {
    headers: {
      Authorization: `Bearer ${integration.encrypted_token}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Connection failed', status: res.status },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
