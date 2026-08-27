'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Edit,
  Eye,
  EyeOff,
  Trash2,
  PlusCircle,
  Sparkles,
  MessageSquare,
  FileText,
  Save,
  X,
  Loader2,
} from 'lucide-react';

import { getInitialAvatar } from '@/lib/avatar';

interface ManagedProfileAdmin {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string;
  coverUrl: string | null;
  bio: string;
  age: number | null;
  location: string | null;
  status: string;
  isFeatured: boolean;
  displayOrder: number;
  totalPosts: number;
  totalConversations: number;
}

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<ManagedProfileAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState<ManagedProfileAdmin | null>(null);
  const [isNewModal, setIsNewModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/profiles');
      if (res.ok) {
        const data = await res.json();
        setProfiles(data.profiles || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (p: ManagedProfileAdmin) => {
    setEditingProfile(p);
    setIsNewModal(false);
    setFormData({
      name: p.name,
      slug: p.slug,
      avatarUrl: p.avatarUrl,
      coverUrl: p.coverUrl || '',
      bio: p.bio,
      age: p.age || '',
      location: p.location || '',
      status: p.status,
      isFeatured: p.isFeatured,
      displayOrder: p.displayOrder,
    });
    setFormError('');
  };

  const openNewModal = () => {
    setEditingProfile(null);
    setIsNewModal(true);
    setFormData({
      name: '',
      slug: '',
      avatarUrl: getInitialAvatar('New Member'),
      coverUrl: '',
      bio: '',
      age: '',
      location: '',
      status: 'ACTIVE',
      isFeatured: true,
      displayOrder: profiles.length + 1,
    });
    setFormError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    try {
      const url = isNewModal ? '/api/admin/profiles' : `/api/admin/profiles/${editingProfile!.id}`;
      const method = isNewModal ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setEditingProfile(null);
        setIsNewModal(false);
        fetchProfiles();
      } else {
        setFormError(data.error || 'Failed to save profile');
      }
    } catch (e) {
      setFormError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleHide = async (p: ManagedProfileAdmin) => {
    const nextStatus = p.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/profiles/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setProfiles((prev) =>
          prev.map((item) => (item.id === p.id ? { ...item, status: nextStatus } : item))
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
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Resident Content Profiles (10 Slots)</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Author personas used for dispatches, media broadcasting, and 1-on-1 member conversations.
          </p>
        </div>

        <button onClick={openNewModal} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
          <PlusCircle size={16} />
          <span>Add New Persona</span>
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={32} className="animate-spin" color="var(--accent-gold)" />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {profiles.map((p, idx) => (
            <div key={p.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
                <img
                  src={p.avatarUrl}
                  alt={p.name}
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--border-highlight)',
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
                      {String(idx + 1).padStart(2, '0')} {p.name}
                    </span>
                    <span
                      className={`badge ${
                        p.status === 'ACTIVE' ? 'badge-emerald' : 'badge-gold'
                      }`}
                      style={{ fontSize: '0.65rem' }}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--primary-light)', marginTop: '2px' }}>
                    @{p.slug} • {p.location || 'Studio'}
                  </div>
                </div>
              </div>

              <p
                style={{
                  fontSize: '0.825rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.45,
                  marginBottom: '16px',
                  flex: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {p.bio}
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderTop: '1px solid var(--border-subtle)',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '14px',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span>Dispatches: <strong style={{ color: '#fff' }}>{p.totalPosts}</strong></span>
                <span>Active Chats: <strong style={{ color: '#fff' }}>{p.totalConversations}</strong></span>
                <span>Order: <strong style={{ color: '#fff' }}>#{p.displayOrder}</strong></span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => openEditModal(p)}
                  className="btn btn-sm btn-secondary"
                  style={{ flex: 1, gap: '4px' }}
                >
                  <Edit size={14} />
                  <span>Edit Profile</span>
                </button>

                <Link
                  href={`/likecrazy/posts?profileId=${p.id}`}
                  className="btn btn-sm btn-outline"
                  title="Manage Content"
                >
                  <FileText size={14} />
                </Link>

                <Link
                  href={`/likecrazy/messages`}
                  className="btn btn-sm btn-outline"
                  title="Messages"
                >
                  <MessageSquare size={14} />
                </Link>

                <button
                  onClick={() => handleToggleHide(p)}
                  className="btn-icon"
                  title={p.status === 'ACTIVE' ? 'Hide Profile' : 'Show Profile'}
                >
                  {p.status === 'ACTIVE' ? <Eye size={16} /> : <EyeOff size={16} color="var(--accent-gold)" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Edit / Create Modal */}
      {(editingProfile || isNewModal) && (
        <div className="lightbox-backdrop" onClick={() => { setEditingProfile(null); setIsNewModal(false); }}>
          <div
            className="glass-card"
            style={{
              maxWidth: '560px',
              width: '100%',
              padding: '28px',
              position: 'relative',
              background: 'var(--bg-surface-elevated)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { setEditingProfile(null); setIsNewModal(false); }}
              style={{ position: 'absolute', top: '16px', right: '16px', color: '#fff', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '16px' }}>
              {isNewModal ? 'Create Managed Persona' : `Edit ${editingProfile?.name}`}
            </h2>

            {formError && (
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
                {formError}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Sophia Laurent"
                    className="input-field"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Username / Slug</label>
                  <input
                    type="text"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="sophia"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Avatar Photo URL</label>
                <input
                  type="text"
                  value={formData.avatarUrl || ''}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  placeholder="https://..."
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cover Photo URL</label>
                <input
                  type="text"
                  value={formData.coverUrl || ''}
                  onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                  placeholder="https://..."
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bio & Creative Background</label>
                <textarea
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="textarea-field"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Paris, France"
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="27"
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder || 1}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ flex: 1, gap: '6px' }}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Save Changes</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingProfile(null); setIsNewModal(false); }}
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
