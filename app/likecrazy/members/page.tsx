'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Users,
  Search,
  ShieldAlert,
  UserX,
  UserCheck,
  Trash2,
  Filter,
  Loader2,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

interface MemberRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  deviceId: string | null;
  deviceInfo: string | null;
  deviceBoundAt: string | null;
  invitationToken: string | null;
  invitationNotes: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  totalReactions: number;
  totalComments: number;
  totalMessages: number;
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated && d.user) setCurrentAdmin(d.user);
      })
      .catch(() => {});
  }, [statusFilter]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/members?status=${statusFilter}&search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMembers();
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetDevice = async (memberId: string, memberName: string) => {
    if (
      !confirm(
        `Are you sure you want to reset the hardware device lock for ${memberName}?\n\nThis will invalidate their active session and allow them to bind their new device on their next login.`
      )
    ) {
      return;
    }

    setActionLoadingId(memberId);
    try {
      const res = await fetch(`/api/admin/members/${memberId}/reset-device`, {
        method: 'POST',
      });

      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === memberId
              ? { ...m, deviceId: null, deviceInfo: null, deviceBoundAt: null }
              : m
          )
        );
        alert(`Device lock for ${memberName} has been successfully reset.`);
      } else {
        alert('Failed to reset device lock.');
      }
    } catch (e) {
      console.error(e);
      alert('Error resetting device lock.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateStatus = async (memberId: string, newStatus: string) => {
    if (newStatus === 'BANNED' && !confirm('Are you sure you want to ban this member? Their active session will be invalidated immediately.')) {
      return;
    }

    setActionLoadingId(memberId);
    try {
      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, status: newStatus as any } : m))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Permanent deletion will remove all account history. Proceed?')) return;

    setActionLoadingId(memberId);
    try {
      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Member Directory & Moderation</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Real-time directory of verified community members, unique IDs, device locks, and moderation tools.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={fetchMembers} className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <span className="badge badge-primary">{members.length} Registered Members</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', flex: 1, maxWidth: '440px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, User ID, device..."
              className="input-field"
              style={{ paddingLeft: '38px' }}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
              }}
              className="btn btn-outline btn-sm"
            >
              Clear
            </button>
          )}
        </form>

        {/* Status Filters */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'ACTIVE', 'SUSPENDED', 'BANNED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-outline'}`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Member Details & ID</th>
                <th>Status</th>
                <th>Hardware Device Lock</th>
                <th>Invitation Source</th>
                <th>Engagement Activity</th>
                <th>Registered Date</th>
                <th style={{ textAlign: 'right' }}>Moderation Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '50px' }}>
                    <Loader2 size={30} className="animate-spin" color="var(--primary-light)" />
                    <p style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Loading verified members...
                    </p>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
                    <Users size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                      No registered members found.
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '420px', margin: '4px auto 0' }}>
                      When a user completes registration via a VIP invite link or join URL, their account, ID, and device metadata will appear here in real time.
                    </p>
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.firstName + ' ' + m.lastName)}&backgroundColor=1e293b&textColor=f8fafc`}
                          alt=""
                          style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>
                            {m.firstName} {m.lastName}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--primary-light)' }}>
                            {m.email}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                color: 'var(--text-muted)',
                                background: 'rgba(255, 255, 255, 0.05)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                              }}
                            >
                              ID: {m.id}
                            </span>
                            <button
                              onClick={() => handleCopyId(m.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: copiedId === m.id ? 'var(--accent-emerald)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'inline-flex',
                                alignItems: 'center',
                              }}
                              title="Copy User ID"
                            >
                              {copiedId === m.id ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          m.status === 'ACTIVE'
                            ? 'badge-emerald'
                            : m.status === 'SUSPENDED'
                            ? 'badge-gold'
                            : 'badge-rose'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>

                    <td>
                      {m.deviceId ? (
                        <div>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              color: 'var(--accent-emerald)',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                            }}
                          >
                            <ShieldCheck size={14} />
                            <span>Locked</span>
                          </div>
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-muted)',
                              marginTop: '2px',
                              maxWidth: '180px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={m.deviceInfo || m.deviceId}
                          >
                            {m.deviceInfo || m.deviceId}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          🔓 Unbound
                        </span>
                      )}
                    </td>

                    <td>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {m.invitationToken || 'VIP Link / Direct'}
                      </span>
                      {m.invitationNotes && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {m.invitationNotes}
                        </div>
                      )}
                    </td>

                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        ❤️ {m.totalReactions} • 💬 {m.totalComments} • ✉️ {m.totalMessages}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Last login: {m.lastLoginAt ? formatDistanceToNow(new Date(m.lastLoginAt), { addSuffix: true }) : 'Never'}
                      </div>
                    </td>

                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {m.createdAt ? formatDistanceToNow(new Date(m.createdAt), { addSuffix: true }) : ''}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      {currentAdmin?.role === 'VIEWER_ADMIN' ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>View Only</span>
                      ) : (
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          {m.deviceId && (
                            <button
                              onClick={() => handleResetDevice(m.id, `${m.firstName} ${m.lastName}`)}
                              disabled={actionLoadingId === m.id}
                              className="btn btn-sm btn-outline"
                              title="Reset Hardware Device Lock"
                              style={{ color: 'var(--accent-cyan)', gap: '4px' }}
                            >
                              <RotateCcw size={13} /> Reset Device
                            </button>
                          )}

                          {m.status === 'ACTIVE' ? (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(m.id, 'SUSPENDED')}
                                disabled={actionLoadingId === m.id}
                                className="btn btn-sm btn-outline"
                                title="Suspend Member"
                                style={{ color: 'var(--accent-gold)' }}
                              >
                                Suspend
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(m.id, 'BANNED')}
                                disabled={actionLoadingId === m.id}
                                className="btn btn-sm btn-danger"
                                title="Ban and Invalidate Sessions"
                              >
                                <UserX size={14} /> Ban
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(m.id, 'ACTIVE')}
                              disabled={actionLoadingId === m.id}
                              className="btn btn-sm btn-secondary"
                              style={{ color: 'var(--accent-emerald)', gap: '4px' }}
                            >
                              <UserCheck size={14} /> Reactivate
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteMember(m.id)}
                            disabled={actionLoadingId === m.id}
                            className="btn-icon"
                            style={{ color: 'var(--accent-rose)' }}
                            title="Delete Member Permanently"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
