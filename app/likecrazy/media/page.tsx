'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Image as ImageIcon,
  Film,
  Trash2,
  Upload,
  ExternalLink,
  Filter,
  Loader2,
} from 'lucide-react';

export default function AdminMediaPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState(''); // '', 'IMAGE', 'VIDEO'

  useEffect(() => {
    fetchMedia();
  }, [filterType]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const url = filterType ? `/api/admin/media?type=${filterType}` : '/api/admin/media';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMedia(data.media || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media asset?')) return;
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMedia((prev) => prev.filter((m) => m.id !== id));
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
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Media Asset Library</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            High-definition photographs and video clips uploaded for community dispatches.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: '', label: 'All Media' },
            { key: 'IMAGE', label: 'Images' },
            { key: 'VIDEO', label: 'Videos' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key)}
              className={`btn btn-sm ${filterType === f.key ? 'btn-primary' : 'btn-outline'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={32} className="animate-spin" color="var(--accent-gold)" />
        </div>
      ) : media.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No media uploaded yet.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px',
          }}
        >
          {media.map((m) => (
            <div
              key={m.id}
              className="glass-card"
              style={{
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  height: '180px',
                  background: '#000',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {m.mediaType === 'VIDEO' ? (
                  <video src={m.mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={m.mediaUrl} alt={m.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}

                <span
                  className="badge badge-primary"
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    fontSize: '0.65rem',
                  }}
                >
                  {m.mediaType}
                </span>

                <button
                  onClick={() => handleDelete(m.id)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(244, 63, 94, 0.8)',
                    color: '#fff',
                    borderRadius: '50%',
                    padding: '6px',
                    cursor: 'pointer',
                  }}
                  title="Delete media"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {m.post?.profile?.name ? `By ${m.post.profile.name}` : 'Announcement Media'}
                  </div>
                  {m.caption && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.caption}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {m.createdAt ? formatDistanceToNow(new Date(m.createdAt), { addSuffix: true }) : ''}
                  </span>
                  <a
                    href={m.mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.75rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '2px' }}
                  >
                    <span>View Original</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
