import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const PROVIDER_ENDPOINTS: Record<string, string> = {
  openrouter: 'https://openrouter.ai/api/v1/models',
  openai: 'https://api.openai.com/v1/models',
  anthropic: 'https://api.anthropic.com/v1/messages',
  google: 'https://generativelanguage.googleapis.com/v1beta/models',
  perplexity: 'https://api.perplexity.ai/chat/completions',
};

function getAuthHeader(name: string, config: Record<string, unknown>): string {
  const key = config.api_key as string | undefined;
  if (!key) return '';

  if (name === 'openrouter') return `Bearer ${key}`;
  if (name === 'openai') return `Bearer ${key}`;
  if (name === 'anthropic') return `Bearer ${key}`;
  if (name === 'google') return `Bearer ${key}`;
  if (name === 'perplexity') return `Bearer ${key}`;
  return `Bearer ${key}`;
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

  const body = await req.json();
  const { name, config } = body;

  if (!name || !config?.api_key) {
    return NextResponse.json(
      { error: 'name and config.api_key required' },
      { status: 400 }
    );
  }

  const url = PROVIDER_ENDPOINTS[name] || (config.base_url as string);
  if (!url) {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
  }

  const auth = getAuthHeader(name, config);

  try {
    if (name === 'openrouter') {
      const res = await fetch(url, {
        headers: { Authorization: auth },
      });
      return NextResponse.json({
        success: res.ok,
        error: res.ok ? undefined : await res.text(),
      });
    }
    if (name === 'openai') {
      const res = await fetch(url, {
        headers: { Authorization: auth },
      });
      return NextResponse.json({
        success: res.ok,
        error: res.ok ? undefined : await res.text(),
      });
    }
    if (name === 'anthropic') {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: auth,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });
      return NextResponse.json({
        success: res.ok || res.status === 400,
        error: res.ok ? undefined : await res.text(),
      });
    }
    if (name === 'google') {
      const key = config.api_key as string;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
      );
      return NextResponse.json({
        success: res.ok,
        error: res.ok ? undefined : await res.text(),
      });
    }
    if (name === 'perplexity') {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: auth,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1,
        }),
      });
      return NextResponse.json({
        success: res.ok,
        error: res.ok ? undefined : await res.text(),
      });
    }

    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 502 }
    );
  }
}
