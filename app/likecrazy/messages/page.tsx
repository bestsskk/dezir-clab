'use client';

import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageSquare,
  Send,
  Search,
  User,
  ShieldCheck,
  Archive,
  Ban,
  CheckCircle,
  Sparkles,
  Loader2,
  Trash2,
} from 'lucide-react';

interface AdminConversationItem {
  id: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
    status: string;
  };
  profile: {
    id: string;
    name: string;
    slug: string;
    avatarUrl: string;
  };
  status: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<AdminConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [replyAsProfileId, setReplyAsProfileId] = useState('');
  const [replyText, setReplyText] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    fetchProfiles();
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated && d.user) setCurrentAdmin(d.user);
      })
      .catch(() => {});
  }, [filter]);

  useEffect(() => {
    if (activeConversationId) {
      const interval = setInterval(() => {
        fetchThread(activeConversationId, false);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`/api/admin/conversations?filter=${filter}&search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (!activeConversationId && data.conversations?.length > 0) {
          selectConversation(data.conversations[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/admin/profiles');
      if (res.ok) {
        const data = await res.json();
        setProfiles(data.profiles || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectConversation = async (conversationId: string) => {
    setActiveConversationId(conversationId);
    await fetchThread(conversationId, true);
  };

  const fetchThread = async (conversationId: string, showLoader = false) => {
    if (showLoader) setLoadingThread(true);
    try {
      const res = await fetch(`/api/admin/conversations/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveConversation(data.conversation);
        setMessages(data.messages || []);
        setReplyAsProfileId(data.conversation.profile.id);
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoader) setLoadingThread(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConversationId || sending) return;

    const messageContent = replyText.trim();
    setReplyText('');
    setSending(true);

    try {
      const res = await fetch(`/api/admin/conversations/${activeConversationId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageContent,
          replyAsProfileId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? { ...c, lastMessage: messageContent, lastMessageAt: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleArchiveConversation = async () => {
    if (!activeConversationId) return;
    try {
      const res = await fetch(`/api/admin/conversations/${activeConversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== activeConversationId));
        setActiveConversationId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Direct Inquiries & Messaging Console</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Respond to member direct messages as any of the 10 managed resident creator personas.
        </p>
      </div>

      <div
        className="glass-card"
        style={{
          display: 'grid',
          gridTemplateColumns: '340px 1fr',
          minHeight: '680px',
          maxHeight: '82vh',
          overflow: 'hidden',
        }}
      >
        {/* Conversations Sidebar */}
        <div
          style={{
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            background: '#0a0d16',
          }}
        >
          {/* Filter Toolbar */}
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              {['ALL', 'UNREAD', 'ARCHIVED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: 1, padding: '6px 0', fontSize: '0.75rem' }}
                >
                  {f}
                </button>
              ))}
            </div>

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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchConversations()}
                placeholder="Search member or profile..."
                className="input-field"
                style={{ padding: '8px 10px 8px 30px', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          {/* Conversation List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingList ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Loader2 size={24} className="animate-spin" color="var(--accent-gold)" />
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                No conversations found.
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = c.id === activeConversationId;
                return (
                  <div
                    key={c.id}
                    onClick={() => selectConversation(c.id)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(99, 102, 241, 0.14)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff' }}>
                        {c.member.firstName} {c.member.lastName}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {c.lastMessageAt ? formatDistanceToNow(new Date(c.lastMessageAt), { addSuffix: false }) : ''}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>
                        Talking with {c.profile.name}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: c.unreadCount > 0 ? '#fff' : 'var(--text-muted)',
                        fontWeight: c.unreadCount > 0 ? 600 : 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {c.lastMessage || 'No messages'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Active Thread Window */}
        {activeConversation ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Top Thread Bar */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(14, 20, 34, 0.8)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>
                    {activeConversation.member.firstName} {activeConversation.member.lastName}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    ({activeConversation.member.email})
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>
                  In conversation with <strong>{activeConversation.profile.name}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleArchiveConversation}
                  className="btn btn-sm btn-outline"
                  title="Archive Conversation"
                >
                  <Archive size={14} />
                  <span>Archive</span>
                </button>
              </div>
            </div>

            {/* Messages Log */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                background: '#090c13',
              }}
            >
              {loadingThread ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <Loader2 size={28} className="animate-spin" color="var(--accent-gold)" />
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No messages in this conversation.
                </div>
              ) : (
                messages.map((m) => {
                  const isMember = m.senderType === 'MEMBER';
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMember ? 'flex-start' : 'flex-end',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: isMember ? 'var(--primary-light)' : 'var(--accent-gold)',
                          fontWeight: 700,
                          marginBottom: '3px',
                        }}
                      >
                        {isMember ? `${activeConversation.member.firstName} (Member)` : `${activeConversation.profile.name} (Admin Reply)`}
                      </div>
                      <div
                        style={{
                          maxWidth: '70%',
                          padding: '12px 16px',
                          borderRadius: isMember ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                          background: isMember ? 'rgba(255, 255, 255, 0.08)' : 'var(--gradient-primary)',
                          color: '#fff',
                          fontSize: '0.9rem',
                          lineHeight: 1.5,
                          border: isMember ? '1px solid var(--border-subtle)' : 'none',
                        }}
                      >
                        {m.content}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {m.createdAt ? formatDistanceToNow(new Date(m.createdAt), { addSuffix: true }) : ''}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Persona Switcher & Reply Box */}
            {currentAdmin?.role === 'VIEWER_ADMIN' ? (
              <div
                style={{
                  padding: '16px 20px',
                  borderTop: '1px solid var(--border-subtle)',
                  background: 'rgba(59, 130, 246, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#93c5fd',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <ShieldCheck size={20} color="#60a5fa" />
                <span>
                  <strong>Read-Only Auditor Mode:</strong> You can view all live conversation logs and transcripts. Sending chat replies is disabled for your role.
                </span>
              </div>
            ) : (
              <form
                onSubmit={handleSendReply}
                style={{
                  padding: '16px 20px',
                  borderTop: '1px solid var(--border-subtle)',
                  background: 'rgba(14, 20, 34, 0.95)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {/* Persona Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Reply as Persona:
                  </span>
                  <select
                    value={replyAsProfileId}
                    onChange={(e) => setReplyAsProfileId(e.target.value)}
                    className="select-field"
                    style={{ width: '220px', padding: '6px 10px', fontSize: '0.85rem' }}
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (@{p.slug})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reply text input */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Type reply as ${
                      profiles.find((p) => p.id === replyAsProfileId)?.name || 'Persona'
                    }...`}
                    className="input-field"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !replyText.trim()}
                    className="btn btn-gold"
                    style={{ padding: '0 24px', gap: '6px' }}
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    <span>Send</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Select a conversation to inspect messages.
          </div>
        )}
      </div>
    </div>
  );
}
