'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatMessageType {
  id: string;
  sender_type: string;
  sender_name?: string;
  content: string;
  created_at: string;
}

interface ChatSidebarProps {
  projectId?: string;
}

export function ChatSidebar({ projectId: propProjectId }: ChatSidebarProps) {
  const pathname = usePathname();
  const resolvedProjectId = propProjectId ?? pathname?.split('/')[2];
  const nonProjectSegments = ['new-project', 'settings'];
  const projectId =
    resolvedProjectId && !nonProjectSegments.includes(resolvedProjectId)
      ? resolvedProjectId
      : undefined;

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function sendMessage() {
    if (!input.trim() || !projectId) return;
    setSending(true);
    try {
      const supabase = createClient();
      await supabase.from('chat_messages').insert({
        project_id: projectId,
        sender_type: 'user',
        content: input.trim(),
      });
      const taskInput = input.trim();
      setInput('');

      const res = await fetch('/api/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, task: taskInput }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to start workflow');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert(err instanceof Error ? err.message : 'Failed to start workflow');
    } finally {
      setSending(false);
    }
  }

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) setMessages(data as ChatMessageType[]);
    setLoading(false);
    scrollToBottom();
  }, [projectId, scrollToBottom]);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      setMessages([]);
      return;
    }

    fetchMessages();

    const supabaseClient = createClient();
    const channel = supabaseClient
      .channel(`chat:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessageType]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [projectId, fetchMessages, scrollToBottom]);

  if (!projectId) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Select a project to view chat
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <div className="p-4 border-t bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Describe a task to start GMAD workflow..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={sending || !input.trim()}>
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-2">No messages yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Start a workflow from the roadmap to see agent activity here
      </p>
    </div>
  );
}

function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.sender_type === 'user';
  const isSystem = message.sender_type === 'system';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl p-3 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : isSystem
              ? 'bg-muted border'
              : 'bg-card border'
        }`}
      >
        {!isUser && message.sender_name && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">
                {message.sender_name.substring(0, 1)}
              </span>
            </div>
            <span className="text-xs font-semibold">{message.sender_name}</span>
          </div>
        )}

        <div className="text-sm whitespace-pre-wrap">{message.content}</div>

        <div
          className={`text-xs mt-2 ${
            isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}
        >
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}
