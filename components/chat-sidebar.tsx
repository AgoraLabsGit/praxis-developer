'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send } from 'lucide-react';

export function ChatSidebar({ projectId }: { projectId?: string }) {
  const pathname = usePathname();
  const resolvedProjectId = projectId ?? pathname?.split('/')[2];
  const [message, setMessage] = useState('');

  if (!resolvedProjectId || resolvedProjectId === 'new-project' || resolvedProjectId === 'dashboard') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground">
        <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">Select a project to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Chat</h3>
        <p className="text-xs text-muted-foreground">
          Ask about features or tasks
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-center text-muted-foreground text-sm py-8">
          <p>No messages yet.</p>
          <p className="mt-2">Describe a feature to get started.</p>
        </div>
      </div>

      <div className="p-4 border-t">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (message.trim()) {
              // TODO: Send message to workflow
              setMessage('');
            }
          }}
        >
          <Input
            placeholder="Describe a feature..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
