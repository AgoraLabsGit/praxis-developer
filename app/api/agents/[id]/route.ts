import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  const body = await req.json();
  const {
    name,
    system_prompt,
    provider_id,
    model_name,
    max_cost_per_run,
    monthly_budget,
  } = body;

  const updates: Record<string, unknown> = {};
  if (typeof name === 'string') updates.name = name;
  if (typeof system_prompt === 'string') updates.system_prompt = system_prompt;
  if (provider_id !== undefined) {
    updates.provider_id = provider_id || null;
    if (provider_id) {
      const { data: provider } = await supabase
        .from('ai_providers')
        .select('name')
        .eq('id', provider_id)
        .single();
      if (provider) updates.model_provider = provider.name;
    }
  }
  if (typeof model_name === 'string') updates.model_name = model_name;
  if (typeof max_cost_per_run === 'number') updates.max_cost_per_run = max_cost_per_run;
  if (typeof monthly_budget === 'number') updates.monthly_budget = monthly_budget;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid updates' }, { status: 400 });
  }

  const { data: agent } = await supabase
    .from('agents')
    .select('id, team_id')
    .eq('id', id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const { error } = await supabase
    .from('agents')
    .update(updates)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
