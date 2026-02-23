## Sprint 3.5: Codebase Viewer (Read-Only)

**Goal:** Display generated code files in workflow progress modal for transparency and trust before PR creation. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_58149ea4-eb69-4f79-88a6-2212a14d10eb/96cab420-30d1-45a9-8a7b-2e5e444d916d/pasted-text.txt)

**Scope:** Read-only file tree + syntax-highlighted preview. No editing, no approval gates (Phase 2).

**Timeline:** +4-6 hours after Sprint 3 core (GitHub + AI Providers).

***

## Step 0: Pre-Implementation Checklist

| Item | Status target |
|------|---------------|
| `react-syntax-highlighter` | Install |
| Supabase Storage bucket `workflow-artifacts` | Create |
| `workflow_steps.artifacts` column (JSONB) | Add if not exists |
| File tree component library | Use shadcn Accordion or custom |

***

## Step 1: Storage Strategy Decision

**Option A: Supabase Storage (recommended for large files)**

- Bucket: `workflow-artifacts`
- Path: `/{workspace_id}/{workflow_run_id}/code/{file_path}`
- Pros: Handles large codebases, no DB bloat, can serve files directly.
- Cons: Extra API calls to list/fetch files.

**Option B: JSON in `workflow_steps` (simpler for MVP)**

- Store in `workflow_steps.artifacts` JSONB:
  ```json
  {
    "files": [
      {
        "path": "src/components/Button.tsx",
        "content": "export const Button = ...",
        "language": "typescript",
        "size": 1234
      }
    ]
  }
  ```
- Pros: Single query to get all files, simpler implementation.
- Cons: DB row size limits (~1MB per step), not ideal for 50+ files.

**Recommendation for Sprint 3.5:** Start with **Option B** (JSON in DB). Migrate to Storage in Phase 2 if needed.

***

## Step 2: Database Schema (if using Option B)

**Migration:**

```sql
-- Add artifacts column to workflow_steps if not exists
ALTER TABLE workflow_steps
ADD COLUMN IF NOT EXISTS artifacts JSONB DEFAULT '{}'::jsonb;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_workflow_steps_artifacts 
ON workflow_steps USING gin (artifacts);
```

**Done when:** Column exists and Builder Agent can store files there.

***

## Step 3: Builder Agent Integration (Simulated for now)

**In your workflow executor (where Builder step runs):**

```typescript
// After Builder generates code
const generatedFiles = [
  {
    path: 'src/components/NewFeature.tsx',
    content: '// Generated TypeScript...',
    language: 'typescript',
    size: 1234,
  },
  {
    path: 'src/styles/NewFeature.module.css',
    content: '/* Generated CSS... */',
    language: 'css',
    size: 456,
  },
];

// Store in workflow_steps
await supabase
  .from('workflow_steps')
  .update({
    artifacts: { files: generatedFiles },
    status: 'completed',
  })
  .eq('id', buildStepId);
```

**Done when:** Build step completion stores file artifacts in DB.

***

## Step 4: Fetch Files API

**New API route:** `/api/workflow-runs/[runId]/files`

```typescript
// app/api/workflow-runs/[runId]/files/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { runId: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  // Get Build step artifacts
  const { data, error } = await supabase
    .from('workflow_steps')
    .select('artifacts')
    .eq('workflow_run_id', params.runId)
    .eq('step_name', 'Build') // Or step_type = 'build'
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    files: data?.artifacts?.files || [],
  });
}
```

**Done when:** API returns file list for a given workflow run.

***

## Step 5: File Tree Component

**New component:** `components/code-viewer/file-tree.tsx`

```typescript
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react';
import { useState } from 'react';

interface FileNode {
  path: string;
  content: string;
  language: string;
  size: number;
}

interface FileTreeProps {
  files: FileNode[];
  onSelect: (file: FileNode) => void;
  selectedPath?: string;
}

export function FileTree({ files, onSelect, selectedPath }: FileTreeProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Build tree structure from flat file list
  const tree = buildTree(files);

  const toggleCollapse = (path: string) => {
    const next = new Set(collapsed);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    setCollapsed(next);
  };

  const renderNode = (node: TreeNode, depth = 0) => {
    if (node.type === 'file') {
      return (
        <div
          key={node.path}
          className={`flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-accent ${
            selectedPath === node.path ? 'bg-accent' : ''
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => onSelect(node.file!)}
        >
          <File className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{node.name}</span>
        </div>
      );
    }

    const isCollapsed = collapsed.has(node.path);
    return (
      <div key={node.path}>
        <div
          className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-accent"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => toggleCollapse(node.path)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          <Folder className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{node.name}</span>
        </div>
        {!isCollapsed &&
          node.children?.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return <div className="text-sm">{renderNode(tree)}</div>;
}

// Helper: Convert flat file list to tree
interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  file?: FileNode;
}

function buildTree(files: FileNode[]): TreeNode {
  const root: TreeNode = { name: 'root', path: '', type: 'folder', children: [] };

  files.forEach((file) => {
    const parts = file.path.split('/');
    let current = root;

    parts.forEach((part, i) => {
      const isLast = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join('/');

      let child = current.children?.find((c) => c.name === part);
      if (!child) {
        child = {
          name: part,
          path,
          type: isLast ? 'file' : 'folder',
          children: isLast ? undefined : [],
          file: isLast ? file : undefined,
        };
        current.children!.push(child);
      }
      if (!isLast) {
        current = child;
      }
    });
  });

  return root;
}
```

**Done when:** Component renders collapsible folder tree from flat file list.

***

## Step 6: Code Preview Component

**New component:** `components/code-viewer/code-preview.tsx`

```typescript
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface CodePreviewProps {
  file: {
    path: string;
    content: string;
    language: string;
    size: number;
  } | null;
}

export function CodePreview({ file }: CodePreviewProps) {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a file to preview
      </div>
    );
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{file.path}</span>
          <span className="text-xs text-muted-foreground">
            {(file.size / 1024).toFixed(1)} KB
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </Button>
      </div>

      {/* Code */}
      <div className="flex-1 overflow-auto">
        <SyntaxHighlighter
          language={file.language}
          style={theme === 'dark' ? vscDarkPlus : vs}
          showLineNumbers
          customStyle={{
            margin: 0,
            borderRadius: 0,
            fontSize: '0.875rem',
          }}
        >
          {file.content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
```

**Done when:** Component displays syntax-highlighted code with copy button.

***

## Step 7: Integrate into Workflow Progress Modal

**Update:** `components/workflow-progress-modal.tsx`

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileTree } from '@/components/code-viewer/file-tree';
import { CodePreview } from '@/components/code-viewer/code-preview';
import { useState, useEffect } from 'react';

// Inside modal component
const [files, setFiles] = useState([]);
const [selectedFile, setSelectedFile] = useState(null);

// Fetch files when Build step completes
useEffect(() => {
  if (currentStep?.step_name === 'Build' && currentStep?.status === 'completed') {
    fetch(`/api/workflow-runs/${workflowRunId}/files`)
      .then((res) => res.json())
      .then((data) => setFiles(data.files));
  }
}, [currentStep, workflowRunId]);

// Add to modal body (after steps list)
<Tabs defaultValue="overview" className="mt-4">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="code" disabled={!files.length}>
      Generated Code {files.length > 0 && `(${files.length})`}
    </TabsTrigger>
    <TabsTrigger value="review">Review Notes</TabsTrigger>
  </TabsList>

  <TabsContent value="overview">
    {/* Existing step-by-step progress */}
  </TabsContent>

  <TabsContent value="code" className="h-[500px]">
    <div className="flex h-full border rounded-md overflow-hidden">
      {/* File tree */}
      <div className="w-64 border-r overflow-auto bg-muted/20">
        <FileTree
          files={files}
          onSelect={setSelectedFile}
          selectedPath={selectedFile?.path}
        />
      </div>

      {/* Code preview */}
      <div className="flex-1 overflow-hidden">
        <CodePreview file={selectedFile} />
      </div>
    </div>
  </TabsContent>

  <TabsContent value="review">
    {/* Future: Review Agent comments inline */}
  </TabsContent>
</Tabs>
```

**Done when:** 
- "Generated Code" tab appears when Build step completes.
- File tree + code preview work together.
- Tab is disabled/hidden when no files generated.

***

## Step 8: Empty States & Error Handling

**Add:**

1. **No files generated:**
   ```typescript
   {files.length === 0 && (
     <div className="flex items-center justify-center h-full text-muted-foreground">
       No files generated in this workflow run
     </div>
   )}
   ```

2. **Large file warning:**
   ```typescript
   {file.size > 100_000 && (
     <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b">
       <p className="text-sm text-yellow-800 dark:text-yellow-200">
         ⚠️ Large file ({(file.size / 1024).toFixed(0)} KB). Preview may be slow.
       </p>
     </div>
   )}
   ```

3. **Binary file handling:**
   ```typescript
   const isBinary = /\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/.test(file.path);
   if (isBinary) {
     return <div className="p-4 text-muted-foreground">Binary file (no preview)</div>;
   }
   ```

***

## Step 9: Testing Checklist

| Test | Expected Result |
|------|-----------------|
| Workflow runs without code generation | "Generated Code" tab disabled or hidden |
| Workflow generates 1 file | File tree shows single file, preview works |
| Workflow generates 20+ files in nested folders | Tree renders correctly, collapse/expand works |
| Click file in tree | Preview loads with syntax highlighting |
| Copy button | Clipboard receives file content |
| Large file (>100 KB) | Warning shown, preview still works |
| Light/dark theme toggle | Syntax highlighting theme switches |
| Workflow in progress (Build not complete) | Tab shows loading or "In progress" |

***

## After Running – Sprint 3.5 Checklist

| Item | Status target |
|------|---------------|
| `react-syntax-highlighter` installed | |
| `workflow_steps.artifacts` column exists | |
| Builder stores files in DB | |
| `/api/workflow-runs/[runId]/files` returns files | |
| File tree component renders nested folders | |
| Code preview shows syntax-highlighted code | |
| Copy button works | |
| "Generated Code" tab in progress modal | |
| Empty states handled | |
| Light/dark theme support | |

***

## Future Enhancements (Phase 2)

- **Inline editing** (Monaco editor instead of read-only preview).
- **Diff view** (show changes vs current codebase).
- **Approval gates** ("Approve" button before Sync step).
- **Download as ZIP** (export all generated files).
- **Search across files** (Cmd+P style file finder).

***

Sprint 3.5 adds critical transparency without blocking Sprint 3 core delivery. Start after GitHub + AI Providers are stable.