import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  MessageSquare,
  KeyRound,
  History,
  Settings,
  ArrowLeft,
  LogOut,
  Sparkles,
  ShieldCheck,
  PlusCircle,
  Pin,
  Trash2,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  Smartphone,
  ShieldAlert,
  RotateCcw,
  Ban,
  Radio,
  Eye,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

export default function AdminPortalPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'profiles' | 'posts' | 'messages' | 'invitations' | 'audit' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  // Data States
  const [members, setMembers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Action States
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // New Post Form
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostProfileId, setNewPostProfileId] = useState('');
  const [newPostMediaUrl, setNewPostMediaUrl] = useState('');
  const [newPostIsPinned, setNewPostIsPinned] = useState(false);
  const [publishingPost, setPublishingPost] = useState(false);

  // New Invitation Form
  const [newInvMaxUses, setNewInvMaxUses] = useState('1');
  const [newInvNotes, setNewInvNotes] = useState('');
  const [generatingInv, setGeneratingInv] = useState(false);

  // New Profile Form
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileBio, setNewProfileBio] = useState('');
  const [newProfileAvatar, setNewProfileAvatar] = useState('');
  const [newProfileAge, setNewProfileAge] = useState('24');
  const [newProfileLocation, setNewProfileLocation] = useState('Mumbai, Maharashtra');
  const [creatingProfile, setCreatingProfile] = useState(false);

  const isReadOnly = user?.role === 'VIEWER_ADMIN';

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d.user || (d.user.role !== 'ADMIN' && d.user.role !== 'VIEWER_ADMIN')) {
          navigate('/likecrazy/login');
        } else {
          loadAllData();
        }
      })
      .catch(() => navigate('/likecrazy/login'));
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sRes, mRes, pRes, postRes, cRes, iRes, aRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/members'),
        fetch('/api/admin/profiles'),
        fetch('/api/admin/posts'),
        fetch('/api/admin/conversations'),
        fetch('/api/admin/invitations'),
        fetch('/api/admin/audit-logs'),
      ]);

      if (sRes.ok) setStats(await sRes.json());
      if (mRes.ok) setMembers((await mRes.json()).members || []);
      if (pRes.ok) setProfiles((await pRes.json()).profiles || []);
      if (postRes.ok) setPosts((await postRes.json()).posts || []);
      if (cRes.ok) setConversations((await cRes.json()).conversations || []);
      if (iRes.ok) setInvitations((await iRes.json()).invitations || []);
      if (aRes.ok) setAuditLogs((await aRes.json()).logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    navigate('/likecrazy/login');
  };

  // Reset Member Device
  const handleResetDevice = async (memberId: string) => {
    if (isReadOnly) return alert('Viewer Admin is read-only.');
    if (!confirm('Are you sure you want to reset the device lock for this member?')) return;
    try {
      const res = await fetch(`/api/admin/members/${memberId}/reset-device`, { method: 'POST' });
      if (res.ok) {
        alert('Device lock cleared successfully.');
        loadAllData();
      }
    } catch {}
  };

  // Toggle Ban / Suspend
  const handleToggleMemberStatus = async (memberId: string, currentStatus: string) => {
    if (isReadOnly) return alert('Viewer Admin is read-only.');
    const nextStatus = currentStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) loadAllData();
    } catch {}
  };

  // Create Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return alert('Viewer Admin is read-only.');
    setPublishingPost(true);
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: newPostProfileId || null,
          caption: newPostCaption,
          isPinned: newPostIsPinned,
          mediaUrls: newPostMediaUrl ? [{ mediaUrl: newPostMediaUrl, mediaType: 'IMAGE' }] : [],
        }),
      });
      if (res.ok) {
        setNewPostCaption('');
        setNewPostMediaUrl('');
        setNewPostIsPinned(false);
        loadAllData();
      }
    } catch {} finally {
      setPublishingPost(false);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    if (isReadOnly) return alert('Viewer Admin is read-only.');
    if (!confirm('Delete this dispatch permanently?')) return;
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) loadAllData();
    } catch {}
  };

  // Toggle Pin Post
  const handleTogglePin = async (postId: string, isPinned: boolean) => {
    if (isReadOnly) return alert('Viewer Admin is read-only.');
    try {
      const res = await fetch(`/api/admin/posts/${postId}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !isPinned }),
      });
      if (res.ok) loadAllData();
    } catch {}
  };

  // Generate Invitation Token
  const handleGenerateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return alert('Viewer Admin is read-only.');
    setGeneratingInv(true);
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxUses: newInvMaxUses, notes: newInvNotes }),
      });
      if (res.ok) {
        setNewInvNotes('');
        loadAllData();
      }
    } catch {} finally {
      setGeneratingInv(false);
    }
  };

  // Revoke Invitation
  const handleDeleteInvitation = async (id: string) => {
    if (isReadOnly) return alert('Viewer Admin is read-only.');
    try {
      const res = await fetch(`/api/admin/invitations/${id}`, { method: 'DELETE' });
      if (res.ok) loadAllData();
    } catch {}
  };

  // Send Persona Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return alert('Viewer Admin is read-only.');
    if (!selectedConv || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/admin/conversations/${selectedConv.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText }),
      });
      if (res.ok) {
        setReplyText('');
        // Reload conversation detail
        const convDetail = await fetch(`/api/admin/conversations/${selectedConv.id}`).then((r) => r.json());
        setSelectedConv(convDetail.conversation);
        loadAllData();
      }
    } catch {} finally {
      setSendingReply(false);
    }
  };

  // Select Conversation
  const handleSelectConv = async (c: any) => {
    try {
      const res = await fetch(`/api/admin/conversations/${c.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedConv(data.conversation);
      }
    } catch {}
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c0d0e' }}>
        <Loader2 size={36} className="animate-spin" color="var(--primary-light)" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0c0d0e', color: '#f4f4f5' }}>
      {/* Admin Sidebar */}
      <aside style={{ width: '260px', background: '#141517', borderRight: '1px solid rgba(255,255,255,0.08)', padding: '20px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff' }}>
              D
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>EXECUTIVE CONSOLE</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {user?.role} ACCESS
              </div>
            </div>
          </div>

          <nav style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button onClick={() => setActiveTab('overview')} className={`sidebar-nav-link ${activeTab === 'overview' ? 'active' : ''}`} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent' }}>
              <LayoutDashboard size={17} />
              <span>Overview</span>
            </button>
            <button onClick={() => setActiveTab('members')} className={`sidebar-nav-link ${activeTab === 'members' ? 'active' : ''}`} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent' }}>
              <Users size={17} />
              <span>Members & Security</span>
            </button>
            <button onClick={() => setActiveTab('profiles')} className={`sidebar-nav-link ${activeTab === 'profiles' ? 'active' : ''}`} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent' }}>
              <UserCheck size={17} />
              <span>10 Managed Personas</span>
            </button>
            <button onClick={() => setActiveTab('posts')} className={`sidebar-nav-link ${activeTab === 'posts' ? 'active' : ''}`} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent' }}>
              <FileText size={17} />
              <span>Feed Dispatches</span>
            </button>
            <button onClick={() => setActiveTab('messages')} className={`sidebar-nav-link ${activeTab === 'messages' ? 'active' : ''}`} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent' }}>
              <MessageSquare size={17} />
              <span>Direct Inquiries</span>
            </button>
            <button onClick={() => setActiveTab('invitations')} className={`sidebar-nav-link ${activeTab === 'invitations' ? 'active' : ''}`} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent' }}>
              <KeyRound size={17} />
              <span>Private Invitations</span>
            </button>
            <button onClick={() => setActiveTab('audit')} className={`sidebar-nav-link ${activeTab === 'audit' ? 'active' : ''}`} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent' }}>
              <History size={17} />
              <span>Security Audit Logs</span>
            </button>
          </nav>
        </div>

        <div>
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', fontSize: '0.82rem', color: 'var(--text-muted)', textDecoration: 'none', borderRadius: '8px' }}>
            <ArrowLeft size={16} />
            <span>Return to Feed</span>
          </Link>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', fontSize: '0.82rem', color: 'var(--accent-rose)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Executive Overview</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '28px' }}>
              Live telemetry and governance for Dezir Clab private community.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>TOTAL MEMBERS</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', marginTop: '6px' }}>{stats?.totalMembers || 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>{stats?.activeMembers || 0} active</div>
              </div>
              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>MANAGED PERSONAS</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-gold)', marginTop: '6px' }}>{stats?.totalProfiles || 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>10 Indian Female Personas</div>
              </div>
              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>FEED DISPATCHES</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-light)', marginTop: '6px' }}>{stats?.totalPosts || 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Published posts & media</div>
              </div>
              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>DIRECT INQUIRIES</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', marginTop: '6px' }}>{stats?.totalConversations || 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Active 1-on-1 threads</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button onClick={() => setActiveTab('posts')} className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
                    <PlusCircle size={16} /> Publish New Feed Dispatch
                  </button>
                  <button onClick={() => setActiveTab('invitations')} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                    <KeyRound size={16} /> Generate Private Invitation Token
                  </button>
                  <button onClick={() => setActiveTab('members')} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                    <Smartphone size={16} /> Review Device Locks & Reset
                  </button>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Recent Security Audit Logs</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {auditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>{log.action}</span>
                        <div style={{ color: 'var(--text-muted)' }}>{log.ipAddress}</div>
                      </div>
                      <span style={{ color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Members & Device Binding</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
              Manage member access, status bans, and permanent hardware device bindings.
            </p>

            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '14px 16px' }}>Member</th>
                    <th style={{ padding: '14px 16px' }}>Role</th>
                    <th style={{ padding: '14px 16px' }}>Status</th>
                    <th style={{ padding: '14px 16px' }}>Device Binding</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{m.firstName} {m.lastName}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{m.email}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: m.role === 'ADMIN' ? 'rgba(225,29,72,0.15)' : 'rgba(255,255,255,0.06)', color: m.role === 'ADMIN' ? 'var(--accent-rose)' : '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                          {m.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: m.status === 'ACTIVE' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)', color: m.status === 'ACTIVE' ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontSize: '0.75rem', fontWeight: 700 }}>
                          {m.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {m.deviceId ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-emerald)', fontSize: '0.75rem', fontWeight: 600 }}>
                              <ShieldCheck size={14} /> Bound
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{m.deviceInfo || m.deviceId}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Unbound (locks on next login)</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          {m.deviceId && (
                            <button onClick={() => handleResetDevice(m.id)} className="btn btn-secondary btn-sm" title="Reset Device Lock">
                              <RotateCcw size={14} /> Reset Lock
                            </button>
                          )}
                          {m.role === 'MEMBER' && (
                            <button onClick={() => handleToggleMemberStatus(m.id, m.status)} className="btn btn-secondary btn-sm" style={{ color: m.status === 'ACTIVE' ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                              <Ban size={14} /> {m.status === 'ACTIVE' ? 'Ban' : 'Unban'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 10 MANAGED PERSONAS TAB */}
        {activeTab === 'profiles' && (
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>10 Managed Resident Personas</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
              Indian female personas managed directly from this console.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {profiles.map((p) => (
                <div key={p.id} className="glass-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <img src={p.avatarUrl} alt={p.name} style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(225,29,72,0.4)' }} />
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{p.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.location || 'Resident Creator'} • Age {p.age || 24}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                    {p.bio}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>Slug: /{p.slug}</span>
                    <Link to={`/profile/${p.slug}`} className="btn btn-secondary btn-sm">
                      <Eye size={14} /> View Page
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* POSTS TAB */}
        {activeTab === 'posts' && (
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Feed Dispatches & Content</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
              Publish new photos, announcements, and dispatches under any persona.
            </p>

            {/* Create Post Card */}
            <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>Create New Dispatch</h3>
              <form onSubmit={handleCreatePost}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Persona Author</label>
                    <select value={newPostProfileId} onChange={(e) => setNewPostProfileId(e.target.value)} className="input-field">
                      <option value="">Dezir Clab Official Announcement</option>
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.slug})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Image Media URL (optional)</label>
                    <input type="text" value={newPostMediaUrl} onChange={(e) => setNewPostMediaUrl(e.target.value)} placeholder="https://images.unsplash.com/..." className="input-field" />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Post Caption</label>
                  <textarea value={newPostCaption} onChange={(e) => setNewPostCaption(e.target.value)} placeholder="Write caption for community members..." className="input-field" rows={3} required />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newPostIsPinned} onChange={(e) => setNewPostIsPinned(e.target.checked)} />
                    <span>Pin to top of feed</span>
                  </label>
                  <button type="submit" disabled={publishingPost} className="btn btn-primary">
                    {publishingPost ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
                    <span>Publish Dispatch</span>
                  </button>
                </div>
              </form>
            </div>

            {/* List Existing Posts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {posts.map((post) => (
                <div key={post.id} className="glass-card" style={{ padding: '20px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  {post.media?.[0]?.mediaUrl && (
                    <img src={post.media[0].mediaUrl} alt="" style={{ width: '100px', height: '100px', borderRadius: '8px', objectFit: 'cover' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#fff' }}>{post.profile?.name || 'Community Announcement'}</span>
                      {post.isPinned && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(234,179,8,0.15)', color: 'var(--accent-gold)', fontSize: '0.72rem', fontWeight: 700 }}>
                          <Pin size={11} /> PINNED
                        </span>
                      )}
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                      {post.caption}
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleTogglePin(post.id, post.isPinned)} className="btn btn-secondary btn-sm">
                        <Pin size={13} /> {post.isPinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button onClick={() => handleDeletePost(post.id)} className="btn btn-secondary btn-sm" style={{ color: 'var(--accent-rose)' }}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DIRECT MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Direct Inquiries & Persona Chat Hub</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
              View and respond to incoming member inquiries on behalf of any resident persona.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', minHeight: '500px' }}>
              {/* Conversation List */}
              <div className="glass-card" style={{ padding: '16px', overflowY: 'auto' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px' }}>ACTIVE THREADS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {conversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectConv(c)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: selectedConv?.id === c.id ? 'rgba(225,29,72,0.15)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${selectedConv?.id === c.id ? 'rgba(225,29,72,0.4)' : 'rgba(255,255,255,0.06)'}`,
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: '#fff',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span style={{ fontWeight: 700 }}>{c.member?.firstName} {c.member?.lastName}</span>
                        <span style={{ color: 'var(--accent-gold)' }}>→ {c.profile?.name}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.messages?.[0]?.content || 'Started conversation'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Window */}
              <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {selectedConv ? (
                  <>
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '16px' }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem' }}>
                        Replying as <span style={{ color: 'var(--accent-rose)' }}>{selectedConv.profile?.name}</span> to {selectedConv.member?.firstName} {selectedConv.member?.lastName}
                      </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', maxHeight: '350px' }}>
                      {(selectedConv.messages || []).map((msg: any) => (
                        <div
                          key={msg.id}
                          style={{
                            alignSelf: msg.senderType === 'ADMIN_PROFILE' ? 'flex-end' : 'flex-start',
                            maxWidth: '75%',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            background: msg.senderType === 'ADMIN_PROFILE' ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                            color: '#fff',
                            fontSize: '0.85rem',
                          }}
                        >
                          <div>{msg.content}</div>
                          <div style={{ fontSize: '0.68rem', opacity: 0.7, marginTop: '4px', textAlign: 'right' }}>
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Send response as ${selectedConv.profile?.name}...`}
                        className="input-field"
                        style={{ flex: 1 }}
                        required
                      />
                      <button type="submit" disabled={sendingReply || !replyText.trim()} className="btn btn-primary">
                        {sendingReply ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      </button>
                    </form>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                    Select a conversation thread from the left to view messages and reply.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* INVITATIONS TAB */}
        {activeTab === 'invitations' && (
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Private Invitation Passes</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
              Issue cryptographically secure entry tokens for new club members.
            </p>

            <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>Generate Security Passcode</h3>
              <form onSubmit={handleGenerateInvitation} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '1 1 120px' }}>
                  <label className="form-label">Max Allowed Uses</label>
                  <input type="number" min="1" max="100" value={newInvMaxUses} onChange={(e) => setNewInvMaxUses(e.target.value)} className="input-field" required />
                </div>
                <div className="form-group" style={{ flex: '2 1 240px' }}>
                  <label className="form-label">Private Notes / Member Name</label>
                  <input type="text" value={newInvNotes} onChange={(e) => setNewInvNotes(e.target.value)} placeholder="e.g. VIP Candidate John" className="input-field" />
                </div>
                <button type="submit" disabled={generatingInv} className="btn btn-primary" style={{ marginBottom: '16px' }}>
                  {generatingInv ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
                  <span>Generate Pass</span>
                </button>
              </form>
            </div>

            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '14px 16px' }}>Passcode Token</th>
                    <th style={{ padding: '14px 16px' }}>Uses</th>
                    <th style={{ padding: '14px 16px' }}>Status</th>
                    <th style={{ padding: '14px 16px' }}>Notes</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-gold)' }}>{inv.token}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>{inv.currentUses} / {inv.maxUses}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: inv.status === 'ACTIVE' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)', color: inv.status === 'ACTIVE' ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontSize: '0.75rem', fontWeight: 700 }}>
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{inv.notes || '—'}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button onClick={() => handleDeleteInvitation(inv.id)} className="btn btn-secondary btn-sm" style={{ color: 'var(--accent-rose)' }}>
                          <Trash2 size={13} /> Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AUDIT LOGS TAB */}
        {activeTab === 'audit' && (
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Security Audit Trail</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
              Immutable record of administrative actions, device mismatches, and access attempts.
            </p>

            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '14px 16px' }}>Action</th>
                    <th style={{ padding: '14px 16px' }}>Admin / User</th>
                    <th style={{ padding: '14px 16px' }}>IP Address</th>
                    <th style={{ padding: '14px 16px' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 700, color: log.action.includes('BLOCKED') ? 'var(--accent-rose)' : 'var(--accent-gold)' }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#fff' }}>
                        {log.adminUser?.email || 'System'}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {log.ipAddress}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
