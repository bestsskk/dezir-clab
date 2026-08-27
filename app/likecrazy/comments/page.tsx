'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageCircle,
  Flag,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

interface CommentItemAdmin {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
  post: {
    id: string;
    caption: string;
    profile: { name: string } | null;
  };
  reportsCount: number;
  reports: any[];
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<CommentItemAdmin[]>([]);
  const [filter, setFilter] = useState('ALL'); // ALL, REPORTED, PENDING_APPROVAL
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [filter]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/comments?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to permanently delete this comment?')) return;
    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveReport = async (reportId: string, action: 'RESOLVE' | 'DISMISS') => {
    try {
      const res = await fetch(`/api/admin/comments/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchComments();
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
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Comments Moderation Queue</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Review flagged member comments, resolve safety reports, and moderate discussions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'REPORTED', 'PENDING_APPROVAL'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Author & Member</th>
                <th>Comment Content</th>
                <th>Post Context</th>
                <th>Status & Reports</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader2 size={28} className="animate-spin" color="var(--accent-gold)" />
                  </td>
                </tr>
              ) : comments.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No comments found in this queue.
                  </td>
                </tr>
              ) : (
                comments.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#fff' }}>
                        {c.user.firstName} {c.user.lastName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {c.user.email}
                      </div>
                    </td>

                    <td style={{ maxWidth: '320px' }}>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {c.content}
                      </p>
                      {c.reportsCount > 0 && (
                        <div
                          style={{
                            marginTop: '6px',
                            padding: '6px 8px',
                            background: 'rgba(244, 63, 94, 0.1)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(244, 63, 94, 0.3)',
                            fontSize: '0.75rem',
                            color: 'var(--accent-rose)',
                          }}
                        >
                          🚩 Flagged {c.reportsCount} time{c.reportsCount > 1 ? 's' : ''}:{' '}
                          {c.reports[0]?.reason || 'Flagged for review'}
                        </div>
                      )}
                    </td>

                    <td style={{ maxWidth: '200px' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', display: 'block' }}>
                        {c.post.profile?.name || 'Announcement'}
                      </span>
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {c.post.caption}
                      </p>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          c.status === 'PUBLISHED'
                            ? 'badge-emerald'
                            : c.status === 'REPORTED'
                            ? 'badge-rose'
                            : 'badge-gold'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : ''}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {c.reports?.length > 0 && c.reports[0]?.status === 'PENDING' && (
                          <button
                            onClick={() => handleResolveReport(c.reports[0].id, 'DISMISS')}
                            className="btn btn-sm btn-secondary"
                            style={{ fontSize: '0.75rem' }}
                          >
                            Dismiss Report
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(c.id)}
                          className="btn-icon"
                          style={{ color: 'var(--accent-rose)' }}
                          title="Delete Comment"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
