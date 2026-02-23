/**
 * Extracts file paths and content from LLM output.
 * Expects markdown code blocks with file paths as headers.
 */
export function parseCodeFiles(
  markdown: string
): Array<{ path: string; content: string }> {
  const files: Array<{ path: string; content: string }> = [];

  // Match: ## path/to/file.ts\n```\ncode\n```
  const headerPattern = /##\s+([^\n]+)\n```[^\n]*\n([\s\S]*?)```/g;
  let match;

  while ((match = headerPattern.exec(markdown)) !== null) {
    const path = match[1].trim();
    const content = match[2].trim();
    files.push({ path, content });
  }

  // Fallback: match ```lang:path/to/file.ts or ```path/to/file.ts
  if (files.length === 0) {
    const inlinePattern = /```(?:[\w-]+:)?([^\s\n]+)\n([\s\S]*?)```/g;
    while ((match = inlinePattern.exec(markdown)) !== null) {
      const path = match[1].trim();
      const content = match[2].trim();
      if (path.includes('.') || path.includes('/')) {
        files.push({ path, content });
      }
    }
  }

  // Fallback: if no files parsed, create a single file with all code
  if (files.length === 0) {
    const codeBlocks = markdown.match(/```[^\n]*\n([\s\S]*?)```/g);
    if (codeBlocks && codeBlocks.length > 0) {
      const content = codeBlocks[0].replace(/```[^\n]*\n|```$/g, '').trim();
      files.push({
        path: 'implementation.ts',
        content,
      });
    }
  }

  return files;
}

export function extractPRTitle(markdown: string): string | null {
  const match = markdown.match(/(?:PR )?Title:\s*(.+)/i);
  return match ? match[1].trim() : null;
}

export function extractPRBody(markdown: string): string | null {
  const match = markdown.match(
    /(?:PR )?(?:Description|Body):\s*([\s\S]+?)(?=\n##|$)/i
  );
  return match ? match[1].trim() : null;
}
