'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  FileText,
  PlusCircle,
  Pin,
  Megaphone,
  Image as ImageIcon,
  Film,
  Trash2,
  Edit,
  Upload,
  CheckCircle,
  Calendar,
  X,
  Loader2,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';

interface AdminPostItem {
  id: string;
  profile: { id: string; name: string; slug: string; avatarUrl: string } | null;
  postType: string;
  caption: string;
  status: string;
  isPinned: boolean;
  announcementTitle: string | null;
  announcementCtaText: string | null;
  announcementCtaLink: string | null;
  createdAt: string;
  media: any[];
  totalReactions: number;
  totalComments: number;
}

function PostsManagementComponent() {
  const searchParams = useSearchParams();
  const defaultProfileId = searchParams.get('profileId') || '';

  const [posts, setPosts] = useState<AdminPostItem[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);

  // Composer Form
  const [selectedProfileId, setSelectedProfileId] = useState(defaultProfileId);
  const [postType, setPostType] = useState('STANDARD');
  const [caption, setCaption] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementCtaText, setAnnouncementCtaText] = useState('');
  const [announcementCtaLink, setAnnouncementCtaLink] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Drag & Drop / URL Input States
  const [isDragging, setIsDragging] = useState(false);
  const [directUrlInput, setDirectUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  useEffect(() => {
    fetchInitial();
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated && d.user) setCurrentAdmin(d.user);
      })
      .catch(() => {});
  }, []);

  const fetchInitial = async () => {
    setLoading(true);
    try {
      const [postsRes, profilesRes] = await Promise.all([
        fetch('/api/admin/posts'),
        fetch('/api/admin/profiles'),
      ]);

      if (postsRes.ok) {
        const pData = await postsRes.json();
        setPosts(pData.posts || []);
      }

      if (profilesRes.ok) {
        const prData = await profilesRes.json();
        setProfiles(prData.profiles || []);
        if (!selectedProfileId && prData.profiles?.length > 0) {
          setSelectedProfileId(prData.profiles[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const uploadFileBlob = async (file: File) => {
    setUploadingFile(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUploadedMedia((prev) => [
          ...prev,
          {
            url: data.url,
            mediaType: data.mediaType,
            caption: data.filename,
          },
        ]);
      } else {
        setErrorMsg(data.error || 'Failed to upload media file');
      }
    } catch (e) {
      setErrorMsg('File upload error');
    } finally {
      setUploadingFile(false);
    }
  };

  const uploadImageUrl = async (imageUrl: string) => {
    if (!imageUrl.trim()) return;
    setUploadingFile(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imageUrl.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUploadedMedia((prev) => [
          ...prev,
          {
            url: data.url,
            mediaType: data.mediaType || 'IMAGE',
            caption: data.filename || 'Web image',
          },
        ]);
        setDirectUrlInput('');
        setShowUrlInput(false);
      } else {
        setErrorMsg(data.error || 'Failed to fetch image from URL');
      }
    } catch (e) {
      setErrorMsg('Network error fetching image');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFileBlob(file);
    }
  };

  // Drag & Drop Handlers for images from other websites or desktop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // 1. Check if files were dropped from desktop/filesystem
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        await uploadFileBlob(e.dataTransfer.files[i]);
      }
      return;
    }

    // 2. Check HTML data first (to extract the actual <img src="..."> instead of the <a> link wrapper)
    const htmlData = e.dataTransfer.getData('text/html');
    if (htmlData) {
      const match = htmlData.match(/<img[^>]+src=["'](https?:\/\/[^"']+|data:image\/[^"']+)["']/i);
      if (match && match[1]) {
        await uploadImageUrl(match[1]);
        return;
      }
    }

    // 3. Check text/uri-list
    const uriList = e.dataTransfer.getData('text/uri-list');
    if (uriList && (uriList.startsWith('http://') || uriList.startsWith('https://'))) {
      // Split by newlines in case multiple URIs
      const firstUri = uriList.split('\n')[0].trim();
      if (firstUri) {
        await uploadImageUrl(firstUri);
        return;
      }
    }

    // 4. Check text/plain
    const plainText = e.dataTransfer.getData('text/plain');
    if (plainText && (plainText.startsWith('http://') || plainText.startsWith('https://'))) {
      await uploadImageUrl(plainText.trim());
      return;
    }
  };

  // Clipboard Paste Handler (Ctrl+V / Cmd+V)
  const handlePaste = async (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      for (let i = 0; i < e.clipboardData.files.length; i++) {
        const file = e.clipboardData.files[i];
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          await uploadFileBlob(file);
        }
      }
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: selectedProfileId || null,
          postType,
          caption,
          isPinned,
          announcementTitle: postType === 'ANNOUNCEMENT' ? announcementTitle : null,
          announcementCtaText: postType === 'ANNOUNCEMENT' ? announcementCtaText : null,
          announcementCtaLink: postType === 'ANNOUNCEMENT' ? announcementCtaLink : null,
          media: uploadedMedia,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setComposerOpen(false);
        setCaption('');
        setAnnouncementTitle('');
        setAnnouncementCtaText('');
        setAnnouncementCtaLink('');
        setUploadedMedia([]);
        fetchInitial();
      } else {
        setErrorMsg(data.error || 'Failed to create post');
      }
    } catch (e) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const handleTogglePin = async (postId: string) => {
    try {
      const res = await fetch(`/api/admin/posts/${postId}/pin`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, isPinned: data.isPinned } : p))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
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
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Posts & Announcements Publishing</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Publish dispatches on behalf of managed profiles, drag & drop media from anywhere, or create pinned announcements.
          </p>
        </div>

        {currentAdmin?.role === 'VIEWER_ADMIN' ? (
          <span className="badge badge-gold" style={{ fontSize: '0.8rem', padding: '6px 14px', gap: '6px' }}>
            👁️ Read-Only Viewer Admin
          </span>
        ) : (
          <button
            onClick={() => setComposerOpen(true)}
            className="btn btn-primary"
            style={{ gap: '8px' }}
          >
            <PlusCircle size={18} />
            <span>New Dispatch</span>
          </button>
        )}
      </div>

      {/* Post Stream Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Author Persona</th>
                <th>Content & Media</th>
                <th>Type & Status</th>
                <th>Reactions</th>
                <th>Published</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader2 size={28} className="animate-spin" color="var(--primary-light)" />
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No posts published yet. Click "New Dispatch" to publish one.
                  </td>
                </tr>
              ) : (
                posts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {p.profile ? (
                          <>
                            <img
                              src={p.profile.avatarUrl}
                              alt={p.profile.name}
                              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <div>
                              <div style={{ fontWeight: 700, color: '#fff' }}>{p.profile.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{p.profile.slug}</div>
                            </div>
                          </>
                        ) : (
                          <div style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>Official Announcement</div>
                        )}
                      </div>
                    </td>

                    <td style={{ maxWidth: '300px' }}>
                      {p.announcementTitle && (
                        <div style={{ fontWeight: 700, color: 'var(--accent-gold)', fontSize: '0.85rem', marginBottom: '2px' }}>
                          📢 {p.announcementTitle}
                        </div>
                      )}
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {p.caption || '(Media only)'}
                      </p>
                      {p.media?.length > 0 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)', marginTop: '4px', display: 'block' }}>
                          📎 {p.media.length} media attached
                        </span>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                          {p.postType}
                        </span>
                        {p.isPinned && (
                          <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>
                            <Pin size={10} /> Pinned
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        ❤️ {p.totalReactions} reactions
                      </div>
                    </td>

                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {p.createdAt ? formatDistanceToNow(new Date(p.createdAt), { addSuffix: true }) : ''}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      {currentAdmin?.role === 'VIEWER_ADMIN' ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>View Only</span>
                      ) : (
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleTogglePin(p.id)}
                            className={`btn-icon ${p.isPinned ? 'active' : ''}`}
                            title={p.isPinned ? 'Unpin from Top' : 'Pin to Top of Feed'}
                          >
                            <Pin size={16} color={p.isPinned ? 'var(--accent-gold)' : undefined} />
                          </button>

                          <button
                            onClick={() => handleDeletePost(p.id)}
                            className="btn-icon"
                            style={{ color: 'var(--accent-rose)' }}
                            title="Delete Post"
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

      {/* New Post Composer Modal with Drag & Drop */}
      {composerOpen && (
        <div
          className="lightbox-backdrop"
          onClick={() => setComposerOpen(false)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '620px',
              width: '100%',
              padding: '28px',
              position: 'relative',
              background: 'var(--bg-surface-elevated)',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: isDragging ? '2px dashed var(--primary-light)' : '1px solid var(--border-subtle)',
              boxShadow: isDragging ? '0 0 25px var(--primary-glow)' : 'var(--shadow-xl)',
              transition: 'all 0.2s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setComposerOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', color: '#fff', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '18px' }}>
              Create New Community Dispatch
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

            <form onSubmit={handleCreatePost}>
              {/* Select Profile Author */}
              <div className="form-group">
                <label className="form-label">Select Author Persona</label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="select-field"
                >
                  <option value="">Official Announcement (No specific profile)</option>
                  {profiles.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.name} (@{pr.slug})
                    </option>
                  ))}
                </select>
              </div>

              {/* Post Type Selector */}
              <div className="form-group">
                <label className="form-label">Post Format</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['STANDARD', 'ANNOUNCEMENT'].map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => setPostType(pt)}
                      className={`btn btn-sm ${postType === pt ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Announcement Fields if ANNOUNCEMENT */}
              {postType === 'ANNOUNCEMENT' && (
                <div
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid var(--border-gold)',
                    marginBottom: '16px',
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">Announcement Title</label>
                    <input
                      type="text"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      placeholder="✨ NEW PRIVATE ANNOUNCEMENT"
                      className="input-field"
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">CTA Button Text (Optional)</label>
                      <input
                        type="text"
                        value={announcementCtaText}
                        onChange={(e) => setAnnouncementCtaText(e.target.value)}
                        placeholder="View Details"
                        className="input-field"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CTA Link URL</label>
                      <input
                        type="text"
                        value={announcementCtaLink}
                        onChange={(e) => setAnnouncementCtaLink(e.target.value)}
                        placeholder="#guidelines or /messages"
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Caption */}
              <div className="form-group">
                <label className="form-label">Post Caption / Message</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Share reflections, behind-the-scenes thoughts, or announcements..."
                  className="textarea-field"
                  style={{ minHeight: '110px' }}
                />
              </div>

              {/* DRAG & DROP MEDIA ZONE */}
              <div className="form-group">
                <label className="form-label">Attach Photos or Videos</label>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    border: isDragging ? '2px dashed var(--accent-gold)' : '2px dashed rgba(255, 255, 255, 0.15)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px 16px',
                    textAlign: 'center',
                    background: isDragging ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'rgba(99, 102, 241, 0.12)',
                        color: 'var(--primary-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {uploadingFile ? (
                        <Loader2 size={22} className="animate-spin" color="var(--accent-gold)" />
                      ) : (
                        <ImageIcon size={22} />
                      )}
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                      {uploadingFile
                        ? 'Uploading image...'
                        : isDragging
                        ? 'Drop image here to upload!'
                        : 'Drag & drop image from other website or computer'}
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '380px' }}>
                      Drag any image directly from another browser tab, paste from clipboard (Ctrl+V), or upload a file.
                    </p>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', gap: '6px' }}>
                        <Upload size={14} />
                        <span>Choose File</span>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleFileInputChange}
                          style={{ display: 'none' }}
                          disabled={uploadingFile}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="btn btn-outline btn-sm"
                        style={{ gap: '6px' }}
                      >
                        <LinkIcon size={14} />
                        <span>Paste Image URL</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Direct URL Input Bar if clicked */}
                {showUrlInput && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <input
                      type="url"
                      value={directUrlInput}
                      onChange={(e) => setDirectUrlInput(e.target.value)}
                      placeholder="Paste image link: https://example.com/photo.jpg"
                      className="input-field"
                      style={{ fontSize: '0.85rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => uploadImageUrl(directUrlInput)}
                      disabled={uploadingFile || !directUrlInput.trim()}
                      className="btn btn-primary btn-sm"
                      style={{ flexShrink: 0 }}
                    >
                      {uploadingFile ? <Loader2 size={14} className="animate-spin" /> : 'Fetch & Add'}
                    </button>
                  </div>
                )}

                {/* Uploaded media previews */}
                {uploadedMedia.length > 0 && (
                  <div style={{ marginTop: '14px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                      ATTACHED MEDIA ({uploadedMedia.length}):
                    </span>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {uploadedMedia.map((m, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: 'relative',
                            width: '84px',
                            height: '84px',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            border: '2px solid var(--border-highlight)',
                            boxShadow: 'var(--shadow-md)',
                          }}
                        >
                          {m.mediaType === 'VIDEO' ? (
                            <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <img
                              src={m.url}
                              alt="preview"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                              }}
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => setUploadedMedia((prev) => prev.filter((_, i) => i !== idx))}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              background: 'rgba(244, 63, 94, 0.9)',
                              color: '#fff',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                            title="Remove media"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pin to Top Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '14px 0 20px' }}>
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                />
                <label htmlFor="pinCheck" style={{ fontSize: '0.875rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Pin to top of Community Feed
                </label>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={publishing || uploadingFile}
                  className="btn btn-primary"
                  style={{ flex: 1, gap: '6px' }}
                >
                  {publishing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  <span>Publish to Feed</span>
                </button>
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
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

export default function AdminPostsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <Loader2 size={36} className="animate-spin" color="var(--accent-gold)" />
      </div>
    }>
      <PostsManagementComponent />
    </Suspense>
  );
}
