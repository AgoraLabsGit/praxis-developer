import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/utils/encrypt';

async function testOpenRouter(apiKey: string): Promise<void> {
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error('Invalid OpenRouter API key');
}

function testSentry(dsn: string): void {
  const match = dsn.match(
    /https:\/\/(.+)@(.+)\.ingest\.sentry\.io\/(\d+)/
  );
  if (!match) throw new Error('Invalid Sentry DSN format');
}

async function testSlack(webhookUrl: string): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Test from Praxis Developer' }),
  });
  if (!res.ok) throw new Error('Invalid Slack webhook URL');
}

async function testResend(apiKey: string): Promise<void> {
  const res = await fetch('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (res.status === 401) throw new Error('Invalid Resend API key');
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

  const body = await req.json();
  const name = (body.name as string)?.trim();

  if (!name) {
    return NextResponse.json(
      { error: 'Key name is required' },
      { status: 400 }
    );
  }

  const { data: integration } = await supabase
    .from('workspace_integrations')
    .select('metadata')
    .eq('organization_id', org.id)
    .eq('service', 'environment')
    .maybeSingle();

  const keys = (integration?.metadata as { keys?: Record<string, string> } | null)
    ?.keys;
  const rawValue = keys?.[name];

  if (!rawValue) {
    return NextResponse.json(
      { error: `Key "${name}" not found` },
      { status: 404 }
    );
  }

  let value: string;
  try {
    value = decrypt(rawValue);
  } catch {
    value = rawValue;
  }

  try {
    switch (name) {
      case 'OPENROUTER_API_KEY':
        await testOpenRouter(value);
        break;
      case 'SENTRY_DSN':
        testSentry(value);
        break;
      case 'SLACK_WEBHOOK_URL':
        await testSlack(value);
        break;
      case 'RESEND_API_KEY':
        await testResend(value);
        break;
      default:
        return NextResponse.json(
          { error: 'No test available for this key' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, message: 'Key is valid' });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Key validation failed',
      },
      { status: 400 }
    );
  }
}
