import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
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

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!org) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('ai_providers')
    .select('id, name, is_default, last_used_at, created_at')
    .eq('organization_id', org.id)
    .order('is_default', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ providers: data ?? [] });
}

export async function POST(req: NextRequest) {
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

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!org) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }

  const body = await req.json();
  const { name, config, is_default } = body;

  if (!name || typeof config !== 'object') {
    return NextResponse.json(
      { error: 'name and config required' },
      { status: 400 }
    );
  }

  const validNames = ['openrouter', 'openai', 'anthropic', 'google', 'perplexity', 'custom'];
  if (!validNames.includes(name)) {
    return NextResponse.json({ error: 'Invalid provider name' }, { status: 400 });
  }

  if (is_default) {
    await supabase
      .from('ai_providers')
      .update({ is_default: false })
      .eq('organization_id', org.id);
  }

  const { data: provider, error } = await supabase
    .from('ai_providers')
    .insert({
      organization_id: org.id,
      name,
      config,
      is_default: !!is_default,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ provider });
}
