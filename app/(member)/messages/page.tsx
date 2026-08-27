'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  Send,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  Search,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import ServerBusyModal from '@/components/ServerBusyModal';

interface ConversationListItem {
  id: string;
  profile: {
    id: string;
    name: string;
    slug: string;
    avatarUrl: string;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface MessageItem {
  id: string;
  content: string;
  senderType: 'MEMBER' | 'ADMIN_PROFILE';
  isOwn: boolean;
  createdAt: string;
}

function MessagesComponent() {
  const searchParams = useSearchParams();
  const requestedConversationId = searchParams.get('conversation');

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (requestedConversationId) {
      selectConversation(requestedConversationId);
    } else if (conversations.length > 0 && !activeConversationId) {
      selectConversation(conversations[0].id);
    }
  }, [requestedConversationId, conversations]);

  // Polling for live incoming replies
  useEffect(() => {
    if (!activeConversationId) return;
    const interval = setInterval(() => {
      fetchMessages(activeConversationId, false);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  };

  const selectConversation = async (conversationId: string) => {
    setActiveConversationId(conversationId);
    await fetchMessages(conversationId, true);
  };

  const fetchMessages = async (conversationId: string, showLoader = false) => {
    if (showLoader) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setActiveProfile(data.conversation.profile);
        // Refresh unread count in conversations
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoader) setLoadingMessages(false);
    }
  };

  const [busyModalOpen, setBusyModalOpen] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyModalOpen(true);
  };

  const filteredConversations = conversations.filter((c) =>
    c.profile.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div
      className="glass-card"
      style={{
        display: 'grid',
        gridTemplateColumns: activeConversationId ? '320px 1fr' : '1fr',
        minHeight: '650px',
        maxHeight: '80vh',
        overflow: 'hidden',
      }}
    >
      {/* Conversations Sidebar */}
      <div
        style={{
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(11, 16, 28, 0.4)',
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px' }}>
            Private Inquiries
          </h2>
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search conversations..."
              className="input-field"
              style={{
                padding: '8px 10px 8px 30px',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-md)',
              }}
            />
          </div>
        </div>

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingList ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
              <Loader2 size={24} className="animate-spin" color="var(--primary-light)" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.85rem' }}>No conversations yet.</p>
              <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                Visit a profile to start a private conversation.
              </p>
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isSelected = c.id === activeConversationId;
              return (
                <div
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <img
                    src={c.profile.avatarUrl}
                    alt={c.profile.name}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid var(--border-highlight)',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff' }}>
                        {c.profile.name}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {c.lastMessageAt ? formatDistanceToNow(new Date(c.lastMessageAt), { addSuffix: false }) : ''}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '0.78rem',
                        color: c.unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontWeight: c.unreadCount > 0 ? 600 : 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {c.lastMessage}
                    </p>
                  </div>

                  {c.unreadCount > 0 && (
                    <span
                      style={{
                        background: 'var(--primary)',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Active Conversation Chat Window */}
      {activeConversationId && activeProfile ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Chat Header */}
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(14, 20, 34, 0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src={activeProfile.avatarUrl}
                alt={activeProfile.name}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid var(--border-highlight)',
                }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{activeProfile.name}</span>
                  <ShieldCheck size={16} color="var(--primary-light)" />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ● Studio Persona
                </span>
              </div>
            </div>

            <span className="badge badge-gold" style={{ fontSize: '0.68rem' }}>
              End-to-End Encrypted Session
            </span>
          </div>

          {/* Server Maintenance / Busy Notice */}
          <div
            style={{
              padding: '10px 16px',
              background: 'rgba(245, 158, 11, 0.12)',
              borderBottom: '1px solid var(--border-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="var(--accent-gold)" />
              <span style={{ fontSize: '0.825rem', color: '#fff', fontWeight: 600 }}>
                Messaging Server is Busy • Scheduled to open in 2–3 days
              </span>
            </div>
            <button
              onClick={() => setBusyModalOpen(true)}
              className="btn btn-gold btn-sm"
              style={{ fontSize: '0.72rem', padding: '4px 10px' }}
            >
              Details
            </button>
          </div>

          {/* Messages Stream */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: 'rgba(9, 12, 19, 0.4)',
            }}
          >
            {loadingMessages ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Loader2 size={28} className="animate-spin" color="var(--primary-light)" />
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <MessageSquare size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
                <p style={{ fontSize: '0.9rem' }}>Send your first direct inquiry to {activeProfile.name}.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isOwn = m.senderType === 'MEMBER';
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isOwn ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '10px 14px',
                        borderRadius: isOwn ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        background: isOwn ? 'var(--primary)' : '#202226',
                        color: '#fff',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                        border: isOwn ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid var(--border-subtle)',
                      }}
                    >
                      {m.content}
                    </div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        marginTop: '4px',
                        padding: '0 4px',
                      }}
                    >
                      {m.createdAt ? formatDistanceToNow(new Date(m.createdAt), { addSuffix: true }) : ''}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '14px 18px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '10px',
              background: 'rgba(14, 20, 34, 0.8)',
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${activeProfile.name}...`}
              className="input-field"
              style={{ fontSize: '0.925rem' }}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="btn btn-primary"
              style={{ padding: '0 20px', borderRadius: 'var(--radius-md)' }}
              aria-label="Send message"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            color: 'var(--text-muted)',
          }}
        >
          <Sparkles size={40} color="var(--accent-gold)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '6px' }}>Select a conversation</h3>
          <p style={{ fontSize: '0.85rem' }}>Choose from the sidebar to view messages.</p>
        </div>
      )}

      {/* Server Busy Modal for Direct Messaging */}
      <ServerBusyModal
        isOpen={busyModalOpen}
        onClose={() => setBusyModalOpen(false)}
        profileName={activeProfile?.name}
      />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <Loader2 size={36} className="animate-spin" color="var(--primary-light)" />
      </div>
    }>
      <MessagesComponent />
    </Suspense>
  );
}
