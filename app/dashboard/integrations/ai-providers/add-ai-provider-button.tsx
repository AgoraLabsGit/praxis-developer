'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
import { Loader2, Plus } from 'lucide-react';

const PROVIDERS = [
  { id: 'openrouter', label: 'OpenRouter', recommended: true },
  { id: 'openai', label: 'OpenAI', recommended: false },
  { id: 'anthropic', label: 'Anthropic', recommended: false },
  { id: 'google', label: 'Google AI (Gemini)', recommended: false },
  { id: 'perplexity', label: 'Perplexity', recommended: false },
];

export function AddAIProviderButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string[]>(['openrouter']);
  const [configs, setConfigs] = useState<Record<string, { api_key: string }>>({});
  const [defaultProvider, setDefaultProvider] = useState('openrouter');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  function toggleProvider(id: string) {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );
  }

  async function handleTest(name: string) {
    const cfg = configs[name];
    if (!cfg?.api_key) return;
    setTesting(name);
    try {
      const res = await fetch('/api/settings/ai-providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, config: cfg }),
      });
      const data = await res.json();
      alert(data.success ? 'Connection successful!' : `Failed: ${data.error || 'Unknown error'}`);
    } finally {
      setTesting(null);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      for (const name of selected) {
        const cfg = configs[name];
        if (!cfg?.api_key) continue;
        await fetch('/api/settings/ai-providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            config: cfg,
            is_default: name === defaultProvider,
          }),
        });
      }
      setOpen(false);
      setStep(1);
      setSelected(['openrouter']);
      setConfigs({});
      setDefaultProvider('openrouter');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add AI Provider
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'Select providers' : 'Configure API keys'}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Choose which AI providers to add.'
              : 'Enter your API keys. Keys are stored securely.'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-2 py-4">
            {PROVIDERS.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={() => toggleProvider(p.id)}
                  className="rounded"
                />
                <span className="font-medium">{p.label}</span>
                {p.recommended && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                    Recommended
                  </span>
                )}
              </label>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4">
            {selected.map((name) => (
              <div key={name} className="space-y-2">
                <Label className="capitalize">{name} API Key</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={configs[name]?.api_key ?? ''}
                    onChange={(e) =>
                      setConfigs((c) => ({
                        ...c,
                        [name]: { ...c[name], api_key: e.target.value },
                      }))
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(name)}
                    disabled={testing !== null}
                  >
                    {testing === name ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Test'
                    )}
                  </Button>
                </div>
              </div>
            ))}
            <div className="space-y-2">
              <Label>Default provider</Label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={defaultProvider}
                onChange={(e) => setDefaultProvider(e.target.value)}
              >
                {selected.map((id) => (
                  <option key={id} value={id}>
                    {PROVIDERS.find((p) => p.id === id)?.label ?? id}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={selected.length === 0}
              >
                Next
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
