'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Users,
  UserCheck,
  FileText,
  MessageSquare,
  KeyRound,
  Heart,
  PlusCircle,
  Megaphone,
  ArrowRight,
  TrendingUp,
  Loader2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function AdminDashboardHomePage() {
  const [stats, setStats] = useState<any>(null);
  const [personas, setPersonas] = useState<any[]>([]);
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setPersonas(data.profiles || []);
        setRecentMembers(data.recentMembers || []);
        setRecentMessages(data.recentMessages || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Loader2 size={36} className="animate-spin" color="var(--primary-light)" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff' }}>
            Executive Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            Real-time overview of Dezir Clab community members, active dispatches, and incoming inquiries.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/likecrazy/posts" className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
            <PlusCircle size={15} />
            <span>Create Dispatch</span>
          </Link>
          <Link href="/likecrazy/profiles" className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
            <UserCheck size={15} />
            <span>Manage 10 Personas</span>
          </Link>
          <Link href="/likecrazy/invitations" className="btn btn-outline btn-sm" style={{ gap: '6px' }}>
            <KeyRound size={15} />
            <span>Generate VIP Invite</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
        }}
      >
        <Link href="/likecrazy/members" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '20px', transition: 'all 0.2s ease', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Verified Members</span>
              <Users size={18} color="var(--primary-light)" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff' }}>
              {stats?.totalMembers || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '4px', fontWeight: 600 }}>
              Active verified accounts →
            </div>
          </div>
        </Link>

        <Link href="/likecrazy/posts" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '20px', transition: 'all 0.2s ease', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Community Posts</span>
              <FileText size={18} color="var(--accent-pink)" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff' }}>
              {stats?.totalPosts || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Published dispatches →
            </div>
          </div>
        </Link>

        <Link href="/likecrazy/profiles" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '20px', transition: 'all 0.2s ease', cursor: 'pointer', border: '1px solid rgba(255, 45, 117, 0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase' }}>Managed Personas</span>
              <UserCheck size={18} color="var(--primary)" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff' }}>
              {personas.length || stats?.managedProfiles || 10}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)', marginTop: '4px', fontWeight: 600 }}>
              10 Resident Studio Directors →
            </div>
          </div>
        </Link>

        <Link href="/likecrazy/messages" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '20px', transition: 'all 0.2s ease', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Direct Messages</span>
              <MessageSquare size={18} color="var(--accent-cyan)" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff' }}>
              {stats?.totalConversations || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              1-on-1 member threads →
            </div>
          </div>
        </Link>
      </div>

      {/* 10 Resident Studio Personas Hub */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={20} color="var(--primary-light)" />
              <span>10 Resident Studio Personas</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '2px' }}>
              Select any persona to instantly create posts, broadcast media, or reply to private direct inquiries.
            </p>
          </div>

          <Link href="/likecrazy/profiles" className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
            <span>Edit Full Profiles</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '14px',
          }}
        >
          {personas.map((p, idx) => (
            <div
              key={p.id}
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src={p.avatarUrl}
                  alt={p.name}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid var(--border-pink)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}>
                    @{p.slug}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                <span>Dispatches: <strong style={{ color: '#fff' }}>{p.totalPosts}</strong></span>
                <span>Chats: <strong style={{ color: '#fff' }}>{p.totalConversations}</strong></span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '2px' }}>
                <Link
                  href={`/likecrazy/posts?profileId=${p.id}`}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'center', gap: '4px' }}
                  title="Upload Post as this persona"
                >
                  <PlusCircle size={13} />
                  <span>Post</span>
                </Link>
                <Link
                  href="/likecrazy/messages"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'center', gap: '4px' }}
                  title="Open Chat Hub"
                >
                  <MessageSquare size={13} />
                  <span>Chat</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Recent Members & Recent Inquiries */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Recent Members */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>Recent Joined Members</h2>
            <Link href="/likecrazy/members" style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 700 }}>
              View All →
            </Link>
          </div>

          {recentMembers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '16px 0' }}>No members registered yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentMembers.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={m.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${m.firstName}`}
                      alt=""
                      style={{ width: '34px', height: '34px', borderRadius: '50%' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                        {m.firstName} {m.lastName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.email}</div>
                    </div>
                  </div>
                  <span className={`badge ${m.status === 'ACTIVE' ? 'badge-primary' : 'badge-gold'}`} style={{ fontSize: '0.68rem' }}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Message Threads */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>Direct Message Activity</h2>
            <Link href="/likecrazy/messages" style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 700 }}>
              Open Chat Hub →
            </Link>
          </div>

          {recentMessages.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '16px 0' }}>No direct messages yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentMessages.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/likecrazy/messages?conversation=${conv.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: 'rgba(255, 45, 117, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary-light)',
                      }}
                    >
                      <MessageSquare size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                        {conv.member?.firstName || 'Member'} ↔ {conv.profile?.name || 'Persona'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {conv.lastMessageSnippet || 'New thread initiated'}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {conv.lastMessageAt ? formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true }) : ''}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
