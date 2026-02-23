export const MODELS_BY_PROVIDER: Record<string, { id: string; label: string }[]> = {
  openrouter: [
    { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { id: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo' },
    { id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
    { id: 'anthropic/claude-3-opus', label: 'Claude 3 Opus' },
  ],
  openai: [
    { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
  ],
  google: [
    { id: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  ],
  perplexity: [
    { id: 'llama-3.1-sonar-small-128k-online', label: 'Sonar Small' },
    { id: 'sonar-pro', label: 'Sonar Pro' },
  ],
  custom: [],
};
