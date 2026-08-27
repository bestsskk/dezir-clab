'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  KeyRound,
  PlusCircle,
  Copy,
  Check,
  Trash2,
  Calendar,
  Users,
  ShieldCheck,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

interface InvitationItem {
  id: string;
  token: string;
  maxUses: number;
  currentUses: number;
  status: string;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: string;
  usedBy: { id: string; name: string; email: string; joinedAt: string }[];
}

export default function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Form State
  const [maxUses, setMaxUses] = useState(1);
  const [expirationDays, setExpirationDays] = useState(30);
  const [notes, setNotes] = useState('');
  const [customToken, setCustomToken] = useState('');
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/invitations');
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxUses,
          expirationDays,
          notes,
          customToken: customToken.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setModalOpen(false);
        setNotes('');
        setCustomToken('');
        setMaxUses(1);
        fetchInvitations();
      } else {
        setErrorMsg(data.error || 'Failed to create invitation');
      }
    } catch (e) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const copyInviteUrl = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = `${origin}/join/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleDeleteInvitation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invitation?')) return;
    try {
      const res = await fetch(`/api/admin/invitations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setInvitations((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/invitations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setInvitations((prev) =>
          prev.map((i) => (i.id === id ? { ...i, status: nextStatus } : i))
        );
      }
    } catch (e) {
      console.error(e);
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
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Invitation Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Generate cryptographic tokens, set redemption limits, and monitor VIP admission links.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn btn-gold"
          style={{ gap: '8px' }}
        >
          <PlusCircle size={18} />
          <span>Generate New Invitation</span>
        </button>
      </div>

      {/* Invitations Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Invitation Token & Link</th>
                <th>Campaign Notes</th>
                <th>Usage & Limit</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Redemptions</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader2 size={28} className="animate-spin" color="var(--accent-gold)" />
                  </td>
                </tr>
              ) : invitations.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No invitation tokens created yet.
                  </td>
                </tr>
              ) : (
                invitations.map((inv) => {
                  const isCopied = copiedToken === inv.token;
                  return (
                    <tr key={inv.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <code
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              padding: '4px 8px',
                              borderRadius: 'var(--radius-sm)',
                              fontFamily: 'monospace',
                              fontSize: '0.85rem',
                              color: 'var(--accent-gold)',
                              fontWeight: 700,
                            }}
                          >
                            {inv.token}
                          </code>
                          <button
                            onClick={() => copyInviteUrl(inv.token)}
                            className="btn btn-sm btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                            title="Copy Full URL"
                          >
                            {isCopied ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                            <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
                          </button>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {inv.notes || '—'}
                        </span>
                      </td>

                      <td>
                        <strong style={{ color: '#fff' }}>{inv.currentUses}</strong> / {inv.maxUses} uses
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            inv.status === 'ACTIVE'
                              ? 'badge-emerald'
                              : inv.status === 'EXHAUSTED'
                              ? 'badge-primary'
                              : 'badge-rose'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>

                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {inv.expiresAt ? formatDistanceToNow(new Date(inv.expiresAt), { addSuffix: true }) : 'Never'}
                      </td>

                      <td>
                        {inv.usedBy?.length > 0 ? (
                          <div style={{ fontSize: '0.8rem' }}>
                            {inv.usedBy.map((u) => (
                              <div key={u.id} style={{ color: 'var(--text-primary)' }}>
                                • {u.name} ({u.email})
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Unused</span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleToggleStatus(inv.id, inv.status)}
                            className="btn btn-sm btn-outline"
                          >
                            {inv.status === 'ACTIVE' ? 'Revoke' : 'Activate'}
                          </button>

                          <button
                            onClick={() => handleDeleteInvitation(inv.id)}
                            className="btn-icon"
                            style={{ color: 'var(--accent-rose)' }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generator Modal */}
      {modalOpen && (
        <div className="lightbox-backdrop" onClick={() => setModalOpen(false)}>
          <div
            className="glass-card"
            style={{
              maxWidth: '500px',
              width: '100%',
              padding: '28px',
              position: 'relative',
              background: 'var(--bg-surface-elevated)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', color: '#fff', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '16px' }}>
              Create Cryptographic Invitation
            </h2>

            {errorMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--accent-rose)',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateInvitation}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Max Allowed Uses</label>
                  <input
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(parseInt(e.target.value, 10))}
                    className="input-field"
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    1 for exclusive single-use
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Expiration (Days)</label>
                  <select
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(parseInt(e.target.value, 10))}
                    className="select-field"
                  >
                    <option value="7">7 Days</option>
                    <option value="14">14 Days</option>
                    <option value="30">30 Days</option>
                    <option value="90">90 Days</option>
                    <option value="365">1 Year</option>
                    <option value="0">Never Expires</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Campaign / Target Member Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. VIP Instagram Launch Campaign"
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Custom Token (Optional)</label>
                <input
                  type="text"
                  value={customToken}
                  onChange={(e) => setCustomToken(e.target.value)}
                  placeholder="Leave empty for auto-generated 24-char cryptographic token"
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-gold"
                  style={{ flex: 1, gap: '6px' }}
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  <span>Generate Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
