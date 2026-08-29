import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import CommunityHeader from '../components/CommunityHeader';
import MobileBottomNav from '../components/MobileBottomNav';
import WelcomeRespectModal from '../components/WelcomeRespectModal';
import {
  Home,
  Compass,
  MessageSquare,
  Bell,
  User,
  ShieldCheck,
  Sparkles,
  Star,
  LogOut,
  Shield,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';

export default function MemberLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;
  const [featuredProfiles, setFeaturedProfiles] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    // Load featured profiles
    fetch('/api/profiles')
      .then((res) => res.json())
      .then((data) => {
        if (data.profiles) {
          setFeaturedProfiles(data.profiles.slice(0, 4));
        }
      })
      .catch(() => {});

    // Load unread counts
    const fetchCounts = async () => {
      try {
        const [notifRes, convRes] = await Promise.all([
          fetch('/api/notifications'),
          fetch('/api/conversations'),
        ]);

        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setUnreadNotifications(notifData.unreadCount || 0);
        }

        if (convRes.ok) {
          const convData = await convRes.json();
          const totalUnread = (convData.conversations || []).reduce(
            (sum: number, c: any) => sum + (c.unreadCount || 0),
            0
          );
          setUnreadMessages(totalUnread);
        }
      } catch (e) {}
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="member-app-layout">
      <CommunityHeader />

      <div className="community-shell">
        {/* Left Sidebar Navigation (Desktop & Tablet) */}
        <aside className="left-sidebar-nav" style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            className="glass-card"
            style={{
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ padding: '8px 12px', marginBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                }}
              >
                Navigation
              </span>
              <span className="badge badge-rose" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                VIP CLUB
              </span>
            </div>

            <Link
              to="/dashboard"
              className={`sidebar-nav-link ${pathname === '/dashboard' ? 'active' : ''}`}
            >
              <Home size={18} />
              <span>Private Feed</span>
            </Link>

            <Link
              to="/profiles"
              className={`sidebar-nav-link ${pathname.startsWith('/profiles') || pathname.startsWith('/profile') ? 'active' : ''}`}
            >
              <Compass size={18} />
              <span>Resident Personas</span>
            </Link>

            <Link
              to="/messages"
              className={`sidebar-nav-link ${pathname === '/messages' ? 'active' : ''}`}
              style={{ position: 'relative' }}
            >
              <MessageSquare size={18} />
              <span style={{ flex: 1 }}>Direct Inquiries</span>
              {unreadMessages > 0 && (
                <span className="badge badge-rose" style={{ fontSize: '0.65rem', padding: '1px 7px', borderRadius: '9999px' }}>
                  {unreadMessages}
                </span>
              )}
            </Link>

            <Link
              to="/notifications"
              className={`sidebar-nav-link ${pathname === '/notifications' ? 'active' : ''}`}
              style={{ position: 'relative' }}
            >
              <Bell size={18} />
              <span style={{ flex: 1 }}>Notifications</span>
              {unreadNotifications > 0 && (
                <span className="badge badge-rose" style={{ fontSize: '0.65rem', padding: '1px 7px', borderRadius: '9999px' }}>
                  {unreadNotifications}
                </span>
              )}
            </Link>

            <Link
              to="/account"
              className={`sidebar-nav-link ${pathname === '/account' ? 'active' : ''}`}
            >
              <User size={18} />
              <span>Account & Security</span>
            </Link>

            {(user?.role === 'ADMIN' || user?.role === 'VIEWER_ADMIN') && (
              <>
                <div style={{ margin: '10px 0 4px', borderTop: '1px solid var(--border-subtle)' }} />
                <Link
                  to="/likecrazy"
                  className="sidebar-nav-link"
                  style={{
                    color: 'var(--accent-gold)',
                    background: 'rgba(234, 179, 8, 0.08)',
                    borderColor: 'rgba(234, 179, 8, 0.2)',
                  }}
                >
                  <ShieldCheck size={18} color="var(--accent-gold)" />
                  <span style={{ fontWeight: 700 }}>Executive Console</span>
                </Link>
              </>
            )}
          </div>

          {/* Member Profile Quick Card */}
          {user && (
            <div
              className="glass-card"
              style={{
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <Link
                to="/account"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  minWidth: 0,
                  textDecoration: 'none',
                  flex: 1,
                }}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.firstName}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-medium)' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--primary-dark)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      color: '#fff',
                    }}
                  >
                    {user.firstName?.[0] || 'M'}
                  </div>
                )}
                <div style={{ overflow: 'hidden', minWidth: 0 }}>
                  <p style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.firstName} {user.lastName}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <ShieldCheck size={11} /> Verified Member
                  </p>
                </div>
              </Link>

              <button
                onClick={logout}
                className="btn btn-secondary btn-sm"
                title="Sign Out"
                style={{ padding: '6px 8px', color: 'var(--text-muted)' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </aside>

        {/* Center Main Content Outlet */}
        <main className="center-feed-stream">
          <Outlet />
        </main>

        {/* Right Sidebar (Featured Personas & Guidelines) */}
        <aside className="right-sidebar-rail" style={{ position: 'sticky', top: '80px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Featured Personas Widget */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Star size={16} color="var(--accent-gold)" />
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Featured Residents</h3>
                </div>
                <Link to="/profiles" style={{ fontSize: '0.78rem', color: 'var(--primary-light)', fontWeight: 600 }}>
                  View All
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {featuredProfiles.map((p) => (
                  <Link
                    key={p.id}
                    to={`/profile/${p.slug}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px',
                      borderRadius: 'var(--radius-md)',
                      transition: 'background 0.2s',
                      textDecoration: 'none',
                    }}
                    className="hover:bg-white/[0.04]"
                  >
                    {p.avatarUrl ? (
                      <img
                        src={p.avatarUrl}
                        alt={p.name}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'var(--primary-dark)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                        }}
                      >
                        {p.name[0]}
                      </div>
                    )}
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>{p.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.location || 'Resident Creator'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Respect & Confidentiality Card */}
            <div
              className="glass-card"
              style={{
                padding: '18px 20px',
                background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.08) 0%, rgba(20, 21, 23, 0.95) 100%)',
                border: '1px solid rgba(225, 29, 72, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Sparkles size={16} color="var(--primary-light)" />
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Club Confidentiality</h4>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Content shared in Dezir Clab is strictly confidential. Screenshots, screen recordings, and harassment are strictly prohibited.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <MobileBottomNav />
      <WelcomeRespectModal />
    </div>
  );
}
