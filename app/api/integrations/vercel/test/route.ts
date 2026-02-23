import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const VERCEL_API_URL = 'https://api.vercel.com/v2/user';

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

  let apiToken: string | null = null;

  try {
    const body = await request.json();
    apiToken = (body.apiToken as string)?.trim() || null;
  } catch {
    // No body or invalid JSON - will try stored token
  }

  if (!apiToken) {
    const { data: integration } = await supabase
      .from('workspace_integrations')
      .select('encrypted_token')
      .eq('organization_id', org.id)
      .eq('service', 'vercel')
      .single();

    apiToken = integration?.encrypted_token ?? null;
  }

  if (!apiToken) {
    return NextResponse.json(
      { success: false, error: 'No API token provided or stored' },
      { status: 400 }
    );
  }

  const res = await fetch(VERCEL_API_URL, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { success: false, error: 'Connection failed' },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
