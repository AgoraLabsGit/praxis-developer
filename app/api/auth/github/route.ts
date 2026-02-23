import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getApiKey } from '@/lib/utils/get-api-key';

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const SCOPES = ['repo', 'read:user', 'user:email'].join(' ');

export async function GET() {
  const clientId =
    (await getApiKey('GITHUB_CLIENT_ID')) || process.env.GITHUB_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!clientId) {
    return NextResponse.json(
      { error: 'GitHub OAuth not configured' },
      { status: 500 }
    );
  }

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
    return NextResponse.redirect(new URL('/login', appUrl));
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!org) {
    return NextResponse.redirect(new URL('/onboard', appUrl));
  }

  const state = Buffer.from(JSON.stringify({ orgId: org.id })).toString('base64url');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl}/api/auth/github/callback`,
    scope: SCOPES,
    state,
  });

  return NextResponse.redirect(`${GITHUB_AUTH_URL}?${params.toString()}`);
}
