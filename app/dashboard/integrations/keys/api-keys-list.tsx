'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Key, Plus, Loader2, Pencil, Trash2, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const KEY_SUGGESTIONS = [
  { id: 'SENTRY_DSN', label: 'Sentry DSN' },
  { id: 'SLACK_WEBHOOK_URL', label: 'Slack Webhook URL' },
  { id: 'OPENROUTER_API_KEY', label: 'OpenRouter API Key' },
  { id: 'RESEND_API_KEY', label: 'Resend API Key' },
  { id: 'CUSTOM', label: 'Custom' },
];

function maskKey(value: string): string {
  if (!value || value.length <= 8) return '••••••••';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

const TESTABLE_KEYS = [
  'OPENROUTER_API_KEY',
  'SENTRY_DSN',
  'SLACK_WEBHOOK_URL',
  'RESEND_API_KEY',
];

export function ApiKeysList({ keys }: { keys: Record<string, string> }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  const keyEntries = Object.entries(keys);

  async function handleTest(name: string) {
    setTesting(name);
    try {
      const res = await fetch('/api/integrations/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Key is valid');
      } else {
        alert(data.error || 'Key validation failed');
      }
    } catch {
      alert('Test request failed');
    } finally {
      setTesting(null);
    }
  }

  return (
    <div className="space-y-4">
      {keyEntries.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <Key className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            No API keys configured. Add your first key below.
          </p>
          <AddKeyButton
            onSaved={() => router.refresh()}
            trigger={
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add API Key
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {keyEntries.map(([name, value]) => (
              <div
                key={name}
                className="rounded-lg border bg-card p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium font-mono text-sm">{name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      Connected
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono truncate">
                    {maskKey(value)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {TESTABLE_KEYS.includes(name) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={testing === name}
                      onClick={() => handleTest(name)}
                    >
                      {testing === name ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <TestTube className="w-4 h-4 mr-1" />
                      )}
                      Test
                    </Button>
                  )}
                  <AddKeyButton
                    mode="edit"
                    initialName={name}
                    initialValue={value}
                    onSaved={() => router.refresh()}
                    trigger={
                      <Button variant="ghost" size="sm">
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={deleting === name}
                    onClick={async () => {
                      if (!confirm(`Remove ${name}?`)) return;
                      setDeleting(name);
                      try {
                        await fetch('/api/integrations/keys', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name }),
                        });
                        router.refresh();
                      } finally {
                        setDeleting(null);
                      }
                    }}
                  >
                    {deleting === name ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <AddKeyButton
            onSaved={() => router.refresh()}
            trigger={
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add API Key
              </Button>
            }
          />
        </>
      )}
    </div>
  );
}

function AddKeyButton({
  mode = 'add',
  initialName,
  initialValue,
  onSaved,
  trigger,
}: {
  mode?: 'add' | 'edit';
  initialName?: string;
  initialValue?: string;
  onSaved: () => void;
  trigger: React.ReactNode;
}) {
  const [keyName, setKeyName] = useState(initialName ?? '');
  const [customName, setCustomName] = useState(
    initialName && !KEY_SUGGESTIONS.some((k) => k.id === initialName)
      ? initialName
      : ''
  );
  const [keyValue, setKeyValue] = useState(initialValue ?? '');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const effectiveName =
    mode === 'edit'
      ? (initialName ?? '')
      : keyName === 'CUSTOM'
        ? customName.trim()
        : keyName;

  async function handleSave() {
    if (!effectiveName || !keyValue.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/integrations/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: effectiveName,
          value: keyValue.trim(),
        }),
      });
      if (res.ok) {
        setOpen(false);
        setKeyName('');
        setCustomName('');
        setKeyValue('');
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit API Key' : 'Add API Key'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Update the key value. The key name cannot be changed.'
              : 'Add a new API key. Keys are stored securely.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Key name</Label>
            {mode === 'edit' ? (
              <Input value={effectiveName} disabled className="font-mono" />
            ) : (
              <>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                >
                  {KEY_SUGGESTIONS.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </select>
                {keyName === 'CUSTOM' && (
                  <Input
                    placeholder="e.g. MY_SERVICE_API_KEY"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="font-mono mt-2"
                  />
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>Key value</Label>
            <Input
              type="password"
              placeholder="sk-... or https://..."
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              className="font-mono"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              saving ||
              !keyValue.trim() ||
              !effectiveName ||
              (keyName === 'CUSTOM' && !customName.trim())
            }
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {mode === 'edit' ? 'Update' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
