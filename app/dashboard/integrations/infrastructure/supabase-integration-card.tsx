'use client';

import { useState } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SupabaseIntegrationCardProps {
  configured: boolean;
  projectUrl?: string | null;
}

function maskUrl(url: string) {
  if (!url || url.length < 20) return '••••••••';
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname.slice(0, 12)}...`;
  } catch {
    return '••••••••';
  }
}

export function SupabaseIntegrationCard({
  configured,
  projectUrl,
}: SupabaseIntegrationCardProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/integrations/supabase/test', {
        method: 'POST',
      });
      const data = await res.json();
      setTestResult(data.success ? 'success' : 'error');
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-3">
      {configured ? (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-sm font-medium">Connected</span>
            {projectUrl && (
              <span className="ml-2 text-xs text-muted-foreground block mt-1">
                {maskUrl(projectUrl)}
              </span>
            )}
            {testResult === 'success' && (
              <span className="ml-2 text-xs text-success">✓ Verified</span>
            )}
            {testResult === 'error' && (
              <span className="ml-2 text-xs text-destructive">Connection failed</span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={testing}
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test connection'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Supabase is configured via environment variables. Add{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{' '}
            and{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{' '}
            to your .env file.
          </p>
          <a
            href="https://supabase.com/dashboard/project/_/settings/api"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm inline-flex items-center gap-1"
          >
            Get credentials from Supabase Dashboard
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
