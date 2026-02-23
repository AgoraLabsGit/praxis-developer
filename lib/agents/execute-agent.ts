import type { SupabaseClient } from '@supabase/supabase-js';
import { getApiKeyForOrg } from '@/lib/utils/get-api-key';

const PROVIDER_KEY_NAMES: Record<string, string> = {
  openrouter: 'OPENROUTER_API_KEY',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  google: 'GOOGLE_AI_API_KEY',
  perplexity: 'PERPLEXITY_API_KEY',
};

interface AgentRow {
  id: string;
  provider_id: string | null;
  model_name: string;
  system_prompt: string;
  model_provider: string;
}

interface ProviderRow {
  id: string;
  name: string;
  config: Record<string, unknown>;
}

/**
 * Resolves the API key for an AI provider.
 * Provider config.api_key takes precedence; falls back to Keys tab via getApiKeyForOrg.
 */
async function resolveApiKey(
  provider: ProviderRow,
  organizationId: string
): Promise<string> {
  const fromConfig = (provider.config?.api_key as string)?.trim();
  if (fromConfig) return fromConfig;

  const keyName = PROVIDER_KEY_NAMES[provider.name];
  if (keyName) {
    const fromKeys =
      (await getApiKeyForOrg(organizationId, keyName)) ||
      process.env[keyName] ||
      '';
    if (fromKeys) return fromKeys;
  }

  throw new Error(
    `No API key for ${provider.name}. Add one in Settings → Integrations → AI Providers or API Keys.`
  );
}

/**
 * Calls the LLM and returns the assistant message content.
 */
async function callLLM(
  providerName: string,
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  if (providerName === 'anthropic') {
    return callAnthropic(apiKey, modelName, systemPrompt, userMessage);
  }
  if (providerName === 'google') {
    return callGoogle(apiKey, modelName, systemPrompt, userMessage);
  }
  return callOpenAICompatible(providerName, apiKey, modelName, systemPrompt, userMessage);
}

async function callOpenAICompatible(
  providerName: string,
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const baseUrls: Record<string, string> = {
    openrouter: 'https://openrouter.ai/api/v1',
    openai: 'https://api.openai.com/v1',
    perplexity: 'https://api.perplexity.ai',
  };
  const baseUrl = baseUrls[providerName] || 'https://api.openai.com/v1';

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...(providerName === 'openrouter' && {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Praxis Developer',
      }),
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM request failed (${providerName}): ${err}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
}

async function callAnthropic(
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelName,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic request failed: ${err}`);
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const textBlock = data.content?.find((c) => c.type === 'text');
  return (textBlock as { text?: string })?.text ?? '';
}

async function callGoogle(
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] }],
        generationConfig: { maxOutputTokens: 4096 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google AI request failed: ${err}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return text;
}

/**
 * Executes an agent with the given prompt.
 * Uses provider's config.api_key first, then Keys tab via getApiKeyForOrg.
 *
 * @param supabase - Admin client (for background execution)
 * @param agentId - Agent UUID
 * @param userPrompt - User message to send
 * @param organizationId - Org ID for Keys fallback
 */
export async function executeAgent(
  supabase: SupabaseClient,
  agentId: string,
  userPrompt: string,
  organizationId: string
): Promise<string> {
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('id, provider_id, model_name, system_prompt, model_provider')
    .eq('id', agentId)
    .single();

  if (agentError || !agent) {
    throw new Error('Agent not found');
  }

  const agentRow = agent as AgentRow;
  const providerId = agentRow.provider_id;

  if (!providerId) {
    throw new Error('Agent has no AI provider configured');
  }

  const { data: provider, error: providerError } = await supabase
    .from('ai_providers')
    .select('id, name, config')
    .eq('id', providerId)
    .single();

  if (providerError || !provider) {
    throw new Error('AI provider not configured');
  }

  const providerRow = provider as ProviderRow;
  const apiKey = await resolveApiKey(providerRow, organizationId);

  const output = await callLLM(
    providerRow.name,
    apiKey,
    agentRow.model_name,
    agentRow.system_prompt,
    userPrompt
  );

  await supabase
    .from('ai_providers')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', providerId);

  return output;
}
