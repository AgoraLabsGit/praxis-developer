'use client';

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

export function AgentConfigModal({
  agent,
  open,
  onOpenChange,
}: {
  agent: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure {agent.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue={agent.name} />
          </div>
          <div className="space-y-2">
            <Label>Model</Label>
            <Select defaultValue={agent.model_name}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claude-3-5-sonnet-20241022">
                  Claude 3.5 Sonnet
                </SelectItem>
                <SelectItem value="gemini-2.0-flash-exp">
                  Gemini 2.0 Flash
                </SelectItem>
                <SelectItem value="sonar-pro">Perplexity Sonar Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt">System Prompt</Label>
            <Textarea
              id="prompt"
              defaultValue={agent.system_prompt}
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
                defaultValue={agent.max_cost_per_run}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly-budget">Monthly budget ($)</Label>
              <Input
                id="monthly-budget"
                type="number"
                step="0.01"
                defaultValue={agent.monthly_budget}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
