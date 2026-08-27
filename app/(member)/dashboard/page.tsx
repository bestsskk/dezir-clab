'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  Heart,
  MessageCircle,
  MessageSquare,
  Bookmark,
  Share2,
  Sparkles,
  Pin,
  Flame,
  Clock,
  Image as ImageIcon,
  Video as VideoIcon,
  Megaphone,
  Loader2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import LightboxModal from '@/components/LightboxModal';
import ReactionPopover, { REACTION_OPTIONS } from '@/components/ReactionPopover';
import CommentSection from '@/components/CommentSection';
import ServerBusyModal from '@/components/ServerBusyModal';

interface PostMediaItem {
  id: string;
  mediaUrl: string;
  thumbnailUrl: string | null;
  mediaType: 'IMAGE' | 'VIDEO';
  caption: string | null;
}

interface PostAuthor {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string;
}

interface FeedPost {
  id: string;
  postType: string;
  caption: string;
  isPinned: boolean;
  announcementTitle: string | null;
  announcementCtaText: string | null;
  announcementCtaLink: string | null;
  createdAt: string;
  profile: PostAuthor | null;
  media: PostMediaItem[];
  totalReactions: number;
  reactionBreakdown: Record<string, number>;
  userReaction: string | null;
  totalComments: number;
}

export default function DashboardFeedPage() {
  const router = useRouter();
  const [pinnedPosts, setPinnedPosts] = useState<FeedPost[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [residentProfiles, setResidentProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('latest');
  const [activeReactionPopoverPostId, setActiveReactionPopoverPostId] = useState<string | null>(null);
  const [expandedCommentPostIds, setExpandedCommentPostIds] = useState<Record<string, boolean>>({});
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Record<string, boolean>>({});
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<any[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetchFeed(filter);
    fetchResidentProfiles();
  }, [filter]);

  const fetchResidentProfiles = async () => {
    try {
      const res = await fetch('/api/profiles');
      if (res.ok) {
        const data = await res.json();
        setResidentProfiles(data.profiles || []);
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchFeed = async (activeFilter: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/feed?filter=${activeFilter}&page=1&limit=25`);
      if (res.ok) {
        const data = await res.json();
        setPinnedPosts(data.pinnedPosts || []);
        setPosts(data.posts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (postId: string, reactionType: string) => {
    setActiveReactionPopoverPostId(null);
    try {
      const res = await fetch(`/api/posts/${postId}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType }),
      });

      if (res.ok) {
        const data = await res.json();
        const updateList = (list: FeedPost[]) =>
          list.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  userReaction: data.userReaction,
                  totalReactions: data.totalReactions,
                  reactionBreakdown: data.breakdown || p.reactionBreakdown,
                }
              : p
          );

        setPinnedPosts((prev) => updateList(prev));
        setPosts((prev) => updateList(prev));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedCommentPostIds((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const toggleBookmark = (postId: string) => {
    setBookmarkedPostIds((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const [busyModalOpen, setBusyModalOpen] = useState(false);
  const [selectedProfileName, setSelectedProfileName] = useState('');

  const handleOpenLightbox = (mediaItems: PostMediaItem[], startIndex: number) => {
    setLightboxMedia(
      mediaItems.map((m) => ({
        url: m.mediaUrl,
        mediaType: m.mediaType,
        caption: m.caption,
      }))
    );
    setLightboxIndex(startIndex);
    setLightboxOpen(true);
  };

  const handleStartMessage = async (profileId: string, profileName?: string) => {
    setSelectedProfileName(profileName || '');
    setBusyModalOpen(true);
  };

  const getReactionDisplay = (p: FeedPost) => {
    if (!p.userReaction) {
      return { emoji: '❤️', label: 'Like', isReacted: false };
    }
    const match = REACTION_OPTIONS.find((r) => r.type === p.userReaction);
    return {
      emoji: match ? match.emoji : '❤️',
      label: match ? match.label : 'Liked',
      isReacted: true,
    };
  };

  const renderPostCard = (p: FeedPost, isAnnouncement = false) => {
    const rx = getReactionDisplay(p);
    const isCommentsOpen = !!expandedCommentPostIds[p.id];
    const isBookmarked = !!bookmarkedPostIds[p.id];

    return (
      <article key={p.id} className="post-card" id={`post-${p.id}`}>
        {/* Post Header */}
        <div className="post-header">
          <div className="post-author-row">
            {p.profile ? (
              <Link href={`/profile/${p.profile.slug}`}>
                <img
                  src={p.profile.avatarUrl}
                  alt={p.profile.name}
                  className="author-avatar"
                />
              </Link>
            ) : (
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={20} color="#fff" />
              </div>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {p.profile ? (
                  <Link href={`/profile/${p.profile.slug}`} className="author-name">
                    {p.profile.name}
                    <ShieldCheck size={16} color="var(--primary-light)" />
                  </Link>
                ) : (
                  <span className="author-name">
                    Community Leadership
                    <ShieldCheck size={16} color="var(--accent-gold)" />
                  </span>
                )}
                {p.isPinned && (
                  <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>
                    <Pin size={10} /> Pinned
                  </span>
                )}
              </div>

              <div className="post-time">
                {p.createdAt ? formatDistanceToNow(new Date(p.createdAt), { addSuffix: true }) : ''}
              </div>
            </div>
          </div>

          {/* Quick Message Shortcut if from a Managed Profile */}
          {p.profile && (
            <button
              onClick={() => handleStartMessage(p.profile!.id, p.profile!.name)}
              className="btn btn-sm btn-outline"
              style={{
                fontSize: '0.8rem',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
              }}
              title={`DM ${p.profile.name}`}
            >
              <MessageSquare size={14} color="var(--primary-light)" />
              <span className="desktop-only-text">DM</span>
            </button>
          )}
        </div>

        {/* Announcement Header if ANNOUNCEMENT */}
        {p.postType === 'ANNOUNCEMENT' && p.announcementTitle && (
          <div
            style={{
              padding: '0 18px 10px',
            }}
          >
            <h3
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Megaphone size={18} /> {p.announcementTitle}
            </h3>
          </div>
        )}

        {/* Post Caption / Text */}
        {p.caption && <p className="post-content">{p.caption}</p>}

        {/* Announcement CTA Button if set */}
        {p.announcementCtaText && (
          <div style={{ padding: '0 18px 14px' }}>
            <a
              href={p.announcementCtaLink || '#'}
              className="btn btn-gold btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>{p.announcementCtaText}</span>
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        {/* Post Media (Photos / Videos) */}
        {p.media && p.media.length > 0 && (
          <div>
            {p.media.map((m, idx) => (
              <div
                key={m.id}
                className="post-media-container"
                onClick={() => handleOpenLightbox(p.media, idx)}
              >
                {m.mediaType === 'VIDEO' ? (
                  <video
                    src={m.mediaUrl}
                    controls
                    playsInline
                    className="post-media-video"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <img
                    src={m.mediaUrl}
                    alt={m.caption || 'Community Media'}
                    className="post-media-image"
                    loading="lazy"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Post Stats Counters */}
        <div className="post-stats-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {p.totalReactions > 0 ? (
              <>
                <span style={{ fontSize: '1rem' }}>
                  {p.reactionBreakdown?.LOVE > 0 ? '❤️' : p.reactionBreakdown?.FIRE > 0 ? '🔥' : '👍'}
                </span>
                <span>{p.totalReactions} reaction{p.totalReactions > 1 ? 's' : ''}</span>
              </>
            ) : (
              <span>Be the first to react</span>
            )}
          </div>
        </div>

        {/* Post Actions Toolbar */}
        <div className="post-actions-row" style={{ position: 'relative', gridTemplateColumns: '1fr 1fr' }}>
          {/* Reaction Popover & Button */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setActiveReactionPopoverPostId(p.id)}
          >
            {activeReactionPopoverPostId === p.id && (
              <ReactionPopover
                onSelect={(type) => handleReaction(p.id, type)}
                onClose={() => setActiveReactionPopoverPostId(null)}
              />
            )}
            <button
              onClick={() => handleReaction(p.id, p.userReaction || 'LOVE')}
              className={`post-action-btn ${rx.isReacted ? 'reacted' : ''}`}
              style={{ width: '100%' }}
              aria-label="React to post"
            >
              <span style={{ fontSize: '1.1rem' }}>{rx.emoji}</span>
              <span>{rx.label}</span>
            </button>
          </div>

          {/* Bookmark / Save */}
          <button
            onClick={() => toggleBookmark(p.id)}
            className={`post-action-btn ${isBookmarked ? 'reacted' : ''}`}
            aria-label="Save post"
          >
            <Bookmark size={18} />
            <span>{isBookmarked ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </article>
    );
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Resident Creators Story Rail */}
      {residentProfiles.length > 0 && (
        <div
          className="glass-card"
          style={{
            padding: '16px 20px',
            marginBottom: '18px',
            overflowX: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
          }}
        >
          {residentProfiles.map((creator) => (
            <Link
              key={creator.id}
              href={`/profile/${creator.slug}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0,
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  padding: '2px',
                  borderRadius: '50%',
                  border: '2px solid var(--border-medium)',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <img
                  src={creator.avatarUrl}
                  alt={creator.name}
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    display: 'block',
                    border: '2px solid var(--bg-surface)',
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  maxWidth: '68px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'center',
                }}
              >
                {creator.name.split(' ')[0]}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Community Feed Welcome & Filter Bar */}
      <div
        className="glass-card"
        style={{
          padding: '18px 22px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>Community Feed</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Exclusive dispatches and private broadcasts from our 10 resident studios.
            </p>
          </div>
          <span className="badge badge-primary">Private Access</span>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {[
            { key: 'latest', label: 'Latest', icon: Clock },
            { key: 'popular', label: 'Popular', icon: Flame },
            { key: 'announcements', label: 'Announcements', icon: Megaphone },
            { key: 'photos', label: 'Photos', icon: ImageIcon },
            { key: 'videos', label: 'Videos', icon: VideoIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-full)', gap: '6px' }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: '140px', height: '16px', marginBottom: '6px' }} />
                  <div className="skeleton" style={{ width: '80px', height: '12px' }} />
                </div>
              </div>
              <div className="skeleton" style={{ width: '100%', height: '60px', marginBottom: '16px' }} />
              <div className="skeleton" style={{ width: '100%', height: '240px' }} />
            </div>
          ))}
        </div>
      )}

      {/* Feed Stream */}
      {!loading && (
        <>
          {/* Pinned Posts */}
          {pinnedPosts.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              {pinnedPosts.map((p) => renderPostCard(p, true))}
            </div>
          )}

          {/* Regular Posts */}
          {posts.length > 0 ? (
            posts.map((p) => renderPostCard(p, false))
          ) : (
            pinnedPosts.length === 0 && (
              <div
                className="glass-card"
                style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                }}
              >
                <Sparkles size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>No posts available yet</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  New dispatches will appear here soon. Check back shortly.
                </p>
              </div>
            )
          )}
        </>
      )}

      {/* Lightbox Modal */}
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
        profileName={selectedProfileName}
      />
    </div>
  );
}
