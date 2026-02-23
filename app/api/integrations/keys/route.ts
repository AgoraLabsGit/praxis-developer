import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { encrypt } from '@/lib/utils/encrypt';

const ENV_PLACEHOLDER = 'env_keys';

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
  const name = (body.name as string)?.trim();
  const value = (body.value as string)?.trim();

  if (!name || !value) {
    return NextResponse.json(
      { error: 'Key name and value are required' },
      { status: 400 }
    );
  }

  // Validate key name format (alphanumeric + underscore)
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
    return NextResponse.json(
      { error: 'Key name must start with a letter and contain only letters, numbers, and underscores' },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from('workspace_integrations')
    .select('id, metadata')
    .eq('organization_id', org.id)
    .eq('service', 'environment')
    .maybeSingle();

  const existingKeys =
    (existing?.metadata as { keys?: Record<string, string> } | null)?.keys ?? {};
  const newKeys = { ...existingKeys, [name]: encrypt(value) };

  const { error: upsertError } = await supabase
    .from('workspace_integrations')
    .upsert(
      {
        organization_id: org.id,
        service: 'environment',
        encrypted_token: ENV_PLACEHOLDER,
        metadata: { keys: newKeys },
      },
      { onConflict: 'organization_id,service' }
    );

  if (upsertError) {
    return NextResponse.json(
      { error: upsertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
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
  const name = (body.name as string)?.trim();

  if (!name) {
    return NextResponse.json(
      { error: 'Key name is required' },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from('workspace_integrations')
    .select('id, metadata')
    .eq('organization_id', org.id)
    .eq('service', 'environment')
    .maybeSingle();

  const existingKeys =
    (existing?.metadata as { keys?: Record<string, string> } | null)?.keys ?? {};
  const restKeys = { ...existingKeys };
  delete restKeys[name];

  const { error: upsertError } = await supabase
    .from('workspace_integrations')
    .upsert(
      {
        organization_id: org.id,
        service: 'environment',
        encrypted_token: ENV_PLACEHOLDER,
        metadata: { keys: restKeys },
      },
      { onConflict: 'organization_id,service' }
    );

  if (upsertError) {
    return NextResponse.json(
      { error: upsertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
