'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Github, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GitHubIntegrationCardProps {
  connected: boolean;
  metadata?: Record<string, unknown>;
  error?: string;
  connectedService?: string;
}

export function GitHubIntegrationCard({
  connected,
  metadata,
  error,
  connectedService,
}: GitHubIntegrationCardProps) {
  const router = useRouter();
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const login = metadata?.login as string | undefined;
  const avatarUrl = metadata?.avatar_url as string | undefined;

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/integrations/github/test', { method: 'POST' });
      setTestResult(res.ok ? 'success' : 'error');
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect GitHub? You will need to reconnect to create PRs.')) return;
    setDisconnecting(true);
    try {
      await fetch('/api/integrations/github/disconnect', { method: 'POST' });
      router.refresh();
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-3 py-2">
          {error === 'config' && 'GitHub OAuth not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.'}
          {error === 'token_exchange' && 'Failed to exchange code for token.'}
          {error === 'org_mismatch' && 'Organization mismatch.'}
          {!['config', 'token_exchange', 'org_mismatch'].includes(error) && `Error: ${error}`}
        </div>
      )}
      {connectedService === 'github' && (
        <div className="rounded-lg bg-success/10 text-success text-sm px-3 py-2">
          GitHub connected successfully.
        </div>
      )}

      {connected ? (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- External GitHub avatar URL
                <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full" />
            )}
            <div>
              <span className="text-sm font-medium">{login || 'Connected'}</span>
              {testResult === 'success' && (
                <span className="ml-2 text-xs text-success">✓ Verified</span>
              )}
              {testResult === 'error' && (
                <span className="ml-2 text-xs text-destructive">Connection failed</span>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testing}
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test connection'}
            </Button>
            <Link href="/api/auth/github">
              <Button variant="outline" size="sm">
                Reconnect
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disconnect'}
            </Button>
          </div>
        </div>
      ) : (
        <Link href="/api/auth/github">
          <Button>
            <Github className="w-4 h-4 mr-2" />
            Connect GitHub
          </Button>
        </Link>
      )}
    </div>
  );
}
