'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Agent } from '@/lib/types';
import { MODELS_BY_PROVIDER } from '@/lib/provider-models';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface AIProvider {
  id: string;
  name: string;
  is_default: boolean;
}

export function AgentConfigModal({
  agent,
  open,
  onOpenChange,
  onSaved,
}: {
  agent: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(agent.name);
  const [providerId, setProviderId] = useState<string | null>(agent.provider_id ?? null);
  const [modelName, setModelName] = useState(agent.model_name);
  const [systemPrompt, setSystemPrompt] = useState(agent.system_prompt);
  const [maxCost, setMaxCost] = useState(String(agent.max_cost_per_run));
  const [monthlyBudget, setMonthlyBudget] = useState(String(agent.monthly_budget));

  const selectedProvider = providers.find((p) => p.id === providerId);
  const providerName = selectedProvider?.name ?? 'openrouter';
  const models = MODELS_BY_PROVIDER[providerName] ?? MODELS_BY_PROVIDER.openrouter;

  useEffect(() => {
    if (open) {
      setName(agent.name);
      setModelName(agent.model_name);
      setSystemPrompt(agent.system_prompt);
      setMaxCost(String(agent.max_cost_per_run));
      setMonthlyBudget(String(agent.monthly_budget));

      setLoading(true);
      fetch('/api/settings/ai-providers')
        .then((r) => r.json())
        .then((data) => {
          const list = data.providers ?? [];
          setProviders(list);
          const defaultOrFirst = list.find((p: AIProvider) => p.is_default) ?? list[0];
          setProviderId(agent.provider_id ?? defaultOrFirst?.id ?? null);
        })
        .finally(() => setLoading(false));
    }
  }, [open, agent]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          provider_id: providerId,
          model_name: modelName,
          system_prompt: systemPrompt,
          max_cost_per_run: parseFloat(maxCost) || 5,
          monthly_budget: parseFloat(monthlyBudget) || 200,
        }),
      });
      if (res.ok) {
        onOpenChange(false);
        onSaved?.();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure {agent.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </div>
          ) : providers.length === 0 ? (
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-sm">
              <p className="font-medium mb-2">No AI providers configured</p>
              <p className="text-muted-foreground mb-3">
                Add an AI provider in Settings → Integrations → AI Providers to configure agents.
              </p>
              <Link href="/dashboard/settings/integrations/ai-providers">
                <Button variant="outline" size="sm">
                  Add AI Provider
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={providerId ?? ''}
                  onValueChange={(v) => {
                    setProviderId(v || null);
                    const p = providers.find((x) => x.id === v);
                    const firstModel = p ? MODELS_BY_PROVIDER[p.name]?.[0] : null;
                    if (firstModel) setModelName(firstModel.id);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name.charAt(0).toUpperCase() + p.name.slice(1)}
                        {p.is_default && ' (default)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Select value={modelName} onValueChange={setModelName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prompt">System Prompt</Label>
                <Textarea
                  id="prompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max-cost">Max cost per run ($)</Label>
                  <Input
                    id="max-cost"
                    type="number"
                    step="0.01"
                    value={maxCost}
                    onChange={(e) => setMaxCost(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly-budget">Monthly budget ($)</Label>
                  <Input
                    id="monthly-budget"
                    type="number"
                    step="0.01"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
        </div>
        {providers.length > 0 && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
