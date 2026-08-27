'use client';

import React, { useState, useEffect } from 'react';
import { Send, Trash2, Flag, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CommentUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: string;
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser;
  isOwnComment: boolean;
  canDelete: boolean;
}

interface CommentSectionProps {
  postId: string;
  isOpen: boolean;
  onCommentCountChange?: (newCount: number) => void;
}

export default function CommentSection({
  postId,
  isOpen,
  onCommentCountChange,
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inputContent, setInputContent] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, postId]);

  const loadComments = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
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

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || submitting) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputContent.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to post comment');
      } else if (data.comment) {
        const updated = [...comments, data.comment];
        setComments(updated);
        setInputContent('');
        if (onCommentCountChange) onCommentCountChange(updated.length);
      }
    } catch (e) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        const updated = comments.filter((c) => c.id !== commentId);
        setComments(updated);
        if (onCommentCountChange) onCommentCountChange(updated.length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReportComment = async (commentId: string) => {
    const reason = prompt('Please specify reason for reporting this comment:');
    if (!reason) return;
    try {
      const res = await fetch(`/api/comments/${commentId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        alert('Thank you. The comment has been flagged for admin review.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '16px 18px',
        background: 'rgba(11, 16, 28, 0.4)',
      }}
    >
      {errorMsg && (
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--accent-rose)',
            fontSize: '0.85rem',
            marginBottom: '12px',
          }}
        >
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <Loader2 className="animate-spin" size={24} color="var(--primary-light)" />
        </div>
      ) : comments.length === 0 ? (
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '12px 0',
          }}
        >
          Be the first to join the conversation.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
          {comments.map((c) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <img
                src={
                  c.user.avatarUrl ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                    c.user.firstName + ' ' + c.user.lastName
                  )}`
                }
                alt={c.user.firstName}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid var(--border-subtle)',
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {c.user.firstName} {c.user.lastName}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : ''}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.5 }}>{c.content}</p>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '4px', paddingLeft: '4px' }}>
                  {c.canDelete && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--accent-rose)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  )}
                  {!c.isOwnComment && (
                    <button
                      onClick={() => handleReportComment(c.id)}
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Flag size={12} /> Report
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input box */}
      <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
          placeholder="Write a comment..."
          className="input-field"
          style={{ padding: '10px 14px', fontSize: '0.9rem' }}
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting || !inputContent.trim()}
          className="btn btn-primary"
          style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)' }}
          aria-label="Send Comment"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}
