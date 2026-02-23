'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VercelIntegrationCardProps {
  configured: boolean;
  projectId?: string | null;
}

export function VercelIntegrationCard({
  configured,
  projectId,
}: VercelIntegrationCardProps) {
  const router = useRouter();
  const [apiToken, setApiToken] = useState('');
  const [projectIdInput, setProjectIdInput] = useState(projectId ?? '');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  async function handleTestConnection() {
    if (!apiToken.trim() && !configured) return;
    // When configured, we test with stored credentials (no token in body)
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/integrations/vercel/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiToken: apiToken.trim() || undefined,
          projectId: projectIdInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      setTestResult(data.success ? 'success' : 'error');
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    if (!apiToken.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/integrations/vercel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiToken: apiToken.trim(),
          projectId: projectIdInput.trim() || undefined,
        }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {configured ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-sm font-medium">Connected</span>
              {projectId && (
                <span className="ml-2 text-xs text-muted-foreground">
                  Project: {projectId}
                </span>
              )}
              {testResult === 'success' && (
                <span className="ml-2 text-xs text-success">✓ Verified</span>
              )}
              {testResult === 'error' && (
                <span className="ml-2 text-xs text-destructive">Connection failed</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={testing}
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test connection'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={async () => {
                  if (!confirm('Disconnect Vercel?')) return;
                  await fetch('/api/integrations/vercel', { method: 'DELETE' });
                  router.refresh();
                }}
              >
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>API Token</Label>
            <Input
              type="password"
              placeholder="Enter your Vercel API token"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Project ID (optional)</Label>
            <Input
              type="text"
              placeholder="prj_..."
              value={projectIdInput}
              onChange={(e) => setProjectIdInput(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={!apiToken.trim() || testing}
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test connection'}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!apiToken.trim() || saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Create a token at{' '}
            <a
              href="https://vercel.com/account/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              vercel.com/account/tokens
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
