'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface RepositorySettingsFormProps {
  projectId: string;
  githubRepo: string;
  defaultBranch: string;
  githubConnected: boolean;
}

export function RepositorySettingsForm({
  projectId,
  githubRepo,
  defaultBranch,
  githubConnected,
}: RepositorySettingsFormProps) {
  const router = useRouter();
  const [repos, setRepos] = useState<{ full_name: string; default_branch: string }[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(githubRepo);
  const [branch, setBranch] = useState(defaultBranch);

  useEffect(() => {
    if (githubConnected) {
      setLoadingRepos(true);
      fetch(`/api/projects/${projectId}/repos`)
        .then((r) => r.json())
        .then((data) => {
          if (data.repos) setRepos(data.repos);
        })
        .finally(() => setLoadingRepos(false));
    }
  }, [projectId, githubConnected]);

  useEffect(() => {
    const repo = repos.find((r) => r.full_name === selectedRepo);
    if (repo) setBranch(repo.default_branch);
  }, [selectedRepo, repos]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          github_repo: selectedRepo || null,
          default_branch: branch || 'main',
        }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!githubConnected) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Connect GitHub in Workspace Settings to select a repository.
        </p>
        <Link href="/dashboard/settings/integrations">
          <Button variant="outline">Connect GitHub</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-2">Repository</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Link this project to a GitHub repository for PR creation.
        </p>
        {loadingRepos ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading repositories...
          </div>
        ) : (
          <Select value={selectedRepo || ''} onValueChange={setSelectedRepo}>
            <SelectTrigger>
              <SelectValue placeholder="Select repository" />
            </SelectTrigger>
            <SelectContent>
              {repos.map((r) => (
                <SelectItem key={r.full_name} value={r.full_name}>
                  {r.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div>
        <Label htmlFor="branch">Default branch</Label>
        <Input
          id="branch"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          placeholder="main"
          className="mt-2"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save
        </Button>
        <Button variant="outline" disabled>
          Test PR creation (Step 2)
        </Button>
      </div>
    </div>
  );
}
