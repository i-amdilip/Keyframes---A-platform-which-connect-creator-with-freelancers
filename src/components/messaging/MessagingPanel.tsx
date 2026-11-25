import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Paperclip, Send } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  markConversationRead,
  sendMessage,
  subscribeConversations,
  subscribeMessages,
} from '@/src/lib/firestoreService';
import { formatTimestamp, isSafeHttpUrl } from '@/src/lib/utils';
import { Button, Input } from '@/src/components/ui/primitives';
import type { ChatMessage, Conversation } from '@/src/types/marketplace';

interface MessagingPanelProps {
  initialConversationId?: string | null;
}

export function MessagingPanel({ initialConversationId }: MessagingPanelProps) {
  const { firebaseUser, userAccount } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialConversationId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;
    return subscribeConversations(firebaseUser.uid, (list) => {
      setConversations(list);
      if (!activeId && list.length > 0) {
        setActiveId(initialConversationId || list[0].id);
      }
    });
  }, [firebaseUser, initialConversationId]);

  useEffect(() => {
    if (initialConversationId) {
      setActiveId(initialConversationId);
    }
  }, [initialConversationId]);

  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  useEffect(() => {
    if (!activeConversation || !firebaseUser) {
      setMessages([]);
      return;
    }
    void markConversationRead(activeConversation, firebaseUser.uid);
    return subscribeMessages(activeConversation.id, (msgs) => {
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    });
  }, [activeConversation?.id, firebaseUser]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || !firebaseUser) return;
    if (!body.trim()) return;
    if (attachmentUrl.trim() && !isSafeHttpUrl(attachmentUrl.trim())) {
      setError('Attachment link must start with https:// or http://.');
      return;
    }
    setError('');
    setSending(true);
    try {
      await sendMessage({
        conversation: activeConversation,
        senderUid: firebaseUser.uid,
        senderName: userAccount?.displayName || firebaseUser.displayName || 'User',
        body: body.trim(),
        attachmentName: attachmentName.trim() || undefined,
        attachmentUrl: attachmentUrl.trim() || undefined,
      });
      setBody('');
      setAttachmentName('');
      setAttachmentUrl('');
      setShowAttach(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  if (!firebaseUser) return null;

  return (
    <div className="bg-[#1A1A20] border border-[#2A2A33] rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[540px]">
      <aside className="md:col-span-4 border-b md:border-b-0 md:border-r border-[#2A2A33] flex flex-col">
        <div className="p-4 border-b border-[#2A2A33]">
          <h2 className="font-display text-base font-semibold text-white">Conversations</h2>
          <p className="text-xs text-zinc-400 mt-0.5 tabular-nums">
            {conversations.length} active {conversations.length === 1 ? 'thread' : 'threads'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#24242C]">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-400">
              No messages yet. Contact a freelancer or accept a proposal to open a collaboration thread.
            </div>
          ) : (
            conversations.map((conv) => {
              const isCreator = conv.creatorUid === firebaseUser.uid;
              const partnerName = isCreator ? conv.freelancerName : conv.creatorName;
              const unread = isCreator ? conv.unreadByCreator : conv.unreadByFreelancer;
              const isSelected = conv.id === activeId;

              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setActiveId(conv.id)}
                  className={`w-full text-left p-4 transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#23232B]' : 'hover:bg-[#1E1E25]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-white truncate">
                      {partnerName}
                    </span>
                    {unread && (
                      <span className="text-[11px] font-semibold text-[#E8F553] shrink-0">
                        Unread
                      </span>
                    )}
                  </div>
                  {conv.projectTitle && (
                    <p className="text-xs text-[#E8F553] truncate mb-1">{conv.projectTitle}</p>
                  )}
                  <p className="text-xs text-zinc-400 truncate">
                    {conv.lastMessage || 'Thread opened'}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="md:col-span-8 flex flex-col bg-[#141418]">
        {!activeConversation ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <h3 className="font-display text-base font-semibold text-white">
                Select a conversation
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Real-time project messages and shared deliverable links appear here.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-[#1A1A20] px-5 py-4 border-b border-[#2A2A33] flex items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-base font-semibold text-white">
                  {activeConversation.creatorUid === firebaseUser.uid
                    ? activeConversation.freelancerName
                    : activeConversation.creatorName}
                </h3>
                {activeConversation.projectTitle && (
                  <p className="text-xs text-zinc-400">{activeConversation.projectTitle}</p>
                )}
              </div>
            </div>

            <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[400px]">
              {messages.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-8">
                  Start the conversation by sharing project notes or deliverable links below.
                </p>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderUid === firebaseUser.uid;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[82%] rounded-xl px-4 py-2.5 text-sm ${
                          isMine
                            ? 'bg-[#E8F553] text-[#131316] font-medium'
                            : 'bg-[#1E1E25] border border-[#2D2D37] text-zinc-100'
                        }`}
                      >
                        <p className="whitespace-pre-line leading-relaxed">{msg.body}</p>
                        {msg.attachmentUrl && isSafeHttpUrl(msg.attachmentUrl) && (
                          <a
                            href={msg.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold underline ${
                              isMine ? 'text-[#131316]' : 'text-[#E8F553]'
                            }`}
                          >
                            <Paperclip className="w-3 h-3" />
                            {msg.attachmentName || 'Shared File'}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-500 mt-1 tabular-nums">
                        {msg.senderName} · {formatTimestamp(msg.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={handleSend}
              className="bg-[#1A1A20] border-t border-[#2A2A33] p-4 space-y-2.5"
            >
              {showAttach && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-1">
                  <Input
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    placeholder="File label (e.g. Rough Cut v2)"
                  />
                  <Input
                    type="url"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="https://drive.google.com/... or frame.io"
                  />
                </div>
              )}
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAttach((prev) => !prev)}
                  aria-label="Attach file link"
                  title="Share file or review link"
                  className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                    showAttach
                      ? 'border-[#E8F553] bg-[#E8F553]/15 text-[#E8F553]'
                      : 'border-[#2E2E38] text-zinc-400 hover:bg-[#24242C] hover:text-white'
                  }`}
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <Input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write a message..."
                />
                <Button type="submit" disabled={sending || !body.trim()}>
                  <Send className="w-4 h-4" />
                  Send
                </Button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
