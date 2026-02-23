import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/settings/integrations?error=config`
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/settings/integrations?error=${error}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/settings/integrations?error=missing_params`
    );
  }

  let orgId: string;
  try {
    const decoded = JSON.parse(
      Buffer.from(state, 'base64url').toString('utf-8')
    );
    orgId = decoded.orgId;
  } catch {
    return NextResponse.redirect(
      `${appUrl}/dashboard/settings/integrations?error=invalid_state`
    );
  }

  const tokenRes = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${appUrl}/api/auth/github/callback`,
    }),
  });

  const tokenData = await tokenRes.json();
  if (tokenData.error) {
    console.error('GitHub token error:', tokenData);
    return NextResponse.redirect(
      `${appUrl}/dashboard/settings/integrations?error=token_exchange`
    );
  }

  const accessToken = tokenData.access_token as string;

  const userRes = await fetch(GITHUB_USER_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  const githubUser = await userRes.json();
  const metadata = {
    login: githubUser.login,
    avatar_url: githubUser.avatar_url,
    name: githubUser.name,
  };

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/settings/integrations?error=unauthorized`
    );
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', orgId)
    .eq('owner_id', user.id)
    .single();

  if (!org) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/settings/integrations?error=org_mismatch`
    );
  }

  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;

  await supabase.from('workspace_integrations').upsert(
    {
      organization_id: orgId,
      service: 'github',
      encrypted_token: accessToken,
      refresh_token: tokenData.refresh_token ?? null,
      expires_at: expiresAt,
      metadata,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'organization_id,service',
    }
  );

  return NextResponse.redirect(
    `${appUrl}/dashboard/settings/integrations?connected=github`
  );
}
