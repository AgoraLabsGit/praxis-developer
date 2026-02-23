import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIProvidersList } from './ai-providers-list';
import { AddAIProviderButton } from './add-ai-provider-button';

export default async function AIProvidersPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: org } = user
    ? await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single()
    : { data: null };

  if (!user || !org) {
    redirect('/dashboard/settings/integrations');
  }

  const { data: providers } = await supabase
    .from('ai_providers')
    .select('id, name, is_default, last_used_at')
    .eq('organization_id', org.id)
    .order('is_default', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/settings/integrations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Integrations
          </Button>
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-1">AI Providers</h2>
        <p className="text-sm text-muted-foreground">
          Configure API keys for OpenRouter, OpenAI, Anthropic, and more.
        </p>
      </div>

      <AIProvidersList providers={providers ?? []} />
      <AddAIProviderButton />
    </div>
  );
}
