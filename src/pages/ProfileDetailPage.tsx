import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageSquare,
  MapPin,
  Calendar,
  Grid,
  Image as ImageIcon,
  Film,
  Sparkles,
  ShieldCheck,
  Heart,
  MessageCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import LightboxModal from '@/components/LightboxModal';
import CommentSection from '@/components/CommentSection';
import ServerBusyModal from '@/components/ServerBusyModal';

interface ProfileData {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string;
  coverUrl: string | null;
  bio: string;
  age: number | null;
  location: string | null;
  isFeatured: boolean;
}

export default function ProfileDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'photos' | 'videos'>('posts');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<any[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetchProfileData();
  }, [slug]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/profiles/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setPosts(data.posts || []);
        setGallery(data.gallery || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const [busyModalOpen, setBusyModalOpen] = useState(false);

  const handleStartMessage = async () => {
    setBusyModalOpen(true);
  };

  const openLightbox = (items: any[], idx: number) => {
    setLightboxMedia(
      items.map((m) => ({
        url: m.mediaUrl,
        mediaType: m.mediaType,
        caption: m.caption,
      }))
    );
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Loader2 size={36} className="animate-spin" color="var(--primary-light)" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '12px' }}>Profile not found</h2>
        <Link to="/profiles" className="btn btn-primary">
          Back to Chat
        </Link>
      </div>
    );
  }

  const photosList = gallery.filter((g) => g.mediaType === 'IMAGE');
  const videosList = gallery.filter((g) => g.mediaType === 'VIDEO');

  return (
    <div style={{ width: '100%' }}>
      {/* Back button */}
      <div style={{ marginBottom: '16px' }}>
        <Link
          to="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
          }}
        >
          <ArrowLeft size={16} /> Back to Community Feed
        </Link>
      </div>

      {/* Profile Banner & Info Header */}
      <div
        className="glass-card"
        style={{
          overflow: 'hidden',
          marginBottom: '24px',
        }}
      >
        {/* Profile Details Row */}
        <div
          style={{
            padding: '28px 24px',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--border-highlight)',
                  boxShadow: 'var(--shadow-md)',
                }}
              />
              <div>
                <h1
                  style={{
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>{profile.name}</span>
                  <ShieldCheck size={22} color="var(--primary-light)" />
                </h1>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    marginTop: '4px',
                  }}
                >
                  {profile.location && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} /> {profile.location}
                    </span>
                  )}
                  {profile.age && <span>{profile.age} years old</span>}
                  <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>
                    Resident Creator
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Message Action */}
            <button
              onClick={handleStartMessage}
              className="btn btn-primary btn-lg"
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '12px 24px',
                gap: '8px',
              }}
            >
              <MessageSquare size={18} />
              <span>DM {profile.name.split(' ')[0]}</span>
            </button>
          </div>

          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: '800px',
              marginBottom: '20px',
            }}
          >
            {profile.bio}
          </p>

          {/* Stats Bar */}
          <div
            style={{
              display: 'flex',
              gap: '24px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>{posts.length}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '6px' }}>Posts</span>
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>{photosList.length}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '6px' }}>Photos</span>
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>{videosList.length}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '6px' }}>Videos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div
        className="glass-card"
        style={{
          padding: '8px',
          marginBottom: '20px',
          display: 'flex',
          gap: '8px',
        }}
      >
        {[
          { key: 'posts', label: 'Dispatches & Posts', icon: Grid },
          { key: 'photos', label: `Photos (${photosList.length})`, icon: ImageIcon },
          { key: 'videos', label: `Videos (${videosList.length})`, icon: Film },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, gap: '6px' }}
            >
              <Icon size={16} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'posts' && (
        <div>
          {posts.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>No posts published yet.</p>
            </div>
          ) : (
            posts.map((p) => (
              <article key={p.id} className="post-card">
                <div className="post-header">
                  <div className="post-author-row">
                    <img src={profile.avatarUrl} alt={profile.name} className="author-avatar" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{profile.name}</div>
                      <div className="post-time">
                        {p.createdAt ? formatDistanceToNow(new Date(p.createdAt), { addSuffix: true }) : ''}
                      </div>
                    </div>
                  </div>
                </div>

                {p.caption && <p className="post-content">{p.caption}</p>}

                {p.media && p.media.length > 0 && (
                  <div>
                    {p.media.map((m: any, idx: number) => (
                      <div
                        key={m.id}
                        className="post-media-container"
                        onClick={() => openLightbox(p.media, idx)}
                      >
                        {m.mediaType === 'VIDEO' ? (
                          <video src={m.mediaUrl} controls playsInline className="post-media-video" />
                        ) : (
                          <img src={m.mediaUrl} alt={m.caption || ''} className="post-media-image" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="post-stats-row">
                  <span>❤️ {p.totalReactions} reaction{p.totalReactions > 1 ? 's' : ''}</span>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {activeTab === 'photos' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          {photosList.length === 0 ? (
            <div className="glass-card" style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>No photos uploaded yet.</p>
            </div>
          ) : (
            photosList.map((photo, idx) => (
              <div
                key={photo.id}
                style={{
                  aspectRatio: '1',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: '#000',
                  position: 'relative',
                }}
                onClick={() => openLightbox(photosList, idx)}
              >
                <img
                  src={photo.mediaUrl}
                  alt={photo.caption || 'Photo'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'videos' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {videosList.length === 0 ? (
            <div className="glass-card" style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>No videos uploaded yet.</p>
            </div>
          ) : (
            videosList.map((v, idx) => (
              <div
                key={v.id}
                className="glass-card"
                style={{ overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => openLightbox(videosList, idx)}
              >
                <video src={v.mediaUrl} playsInline style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
                {v.caption && <p style={{ padding: '10px 14px', fontSize: '0.85rem' }}>{v.caption}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {/* Lightbox */}
      <LightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        mediaList={lightboxMedia}
        currentIndex={lightboxIndex}
        onNavigate={(idx) => setLightboxIndex(idx)}
      />

      {/* Server Busy Modal for Direct Messaging */}
      <ServerBusyModal
        isOpen={busyModalOpen}
        onClose={() => setBusyModalOpen(false)}
        profileName={profile.name}
      />
    </div>
  );
}
