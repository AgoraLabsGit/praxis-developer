import { Octokit } from '@octokit/rest';
import { createAdminClient } from '@/lib/supabase/admin';

interface PROptions {
  organizationId: string;
  projectId: string;
  title: string;
  body: string;
  files: Array<{ path: string; content: string }>;
}

export async function createPullRequest(options: PROptions): Promise<string> {
  const { organizationId, projectId, title, body, files } = options;

  const supabase = createAdminClient();

  // 1. Get GitHub token from workspace_integrations
  const { data: integration } = await supabase
    .from('workspace_integrations')
    .select('encrypted_token')
    .eq('organization_id', organizationId)
    .eq('service', 'github')
    .single();

  if (!integration?.encrypted_token) {
    throw new Error(
      'GitHub not connected. Connect GitHub in Settings → Integrations → Code & Repos.'
    );
  }

  // 2. Get project repository info
  const { data: project } = await supabase
    .from('projects')
    .select('github_repo, default_branch')
    .eq('id', projectId)
    .single();

  if (!project?.github_repo) {
    throw new Error(
      'No repository configured for this project. Add one in Project Settings → Repository.'
    );
  }

  // 3. Parse owner/repo - github_repo is stored as "owner/repo"
  const [owner, repo] = project.github_repo.split('/');
  if (!owner || !repo) {
    throw new Error(`Invalid repository format: ${project.github_repo}`);
  }

  const baseBranch = project.default_branch || 'main';

  // 4. Initialize Octokit
  const octokit = new Octokit({ auth: integration.encrypted_token });

  // 5. Create branch
  const branchName = `praxis/${Date.now()}`;

  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`,
  });

  const baseSha = ref.object.sha;

  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: baseSha,
  });

  // 6. Commit files
  const { data: baseCommit } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: baseSha,
  });

  // Create blobs for each file
  const blobs = await Promise.all(
    files.map(async (file) => {
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo,
        content: Buffer.from(file.content).toString('base64'),
        encoding: 'base64',
      });
      return {
        path: file.path,
        sha: blob.sha,
        mode: '100644' as const,
        type: 'blob' as const,
      };
    })
  );

  // Create new tree
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseCommit.tree.sha,
    tree: blobs,
  });

  // Create commit
  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo,
    message: title,
    tree: tree.sha,
    parents: [baseSha],
  });

  // Update branch reference
  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branchName}`,
    sha: commit.sha,
  });

  // 7. Create pull request
  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title,
    body,
    head: branchName,
    base: baseBranch,
  });

  return pr.html_url ?? pr.url;
}
