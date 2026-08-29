import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import CommunityHeader from '../components/CommunityHeader';
import MobileBottomNav from '../components/MobileBottomNav';
import WelcomeRespectModal from '../components/WelcomeRespectModal';
import { Home, Compass, MessageSquare, Bell, User, ShieldCheck, Sparkles, BookOpen, Star } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

export default function MemberLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;
  const [featuredProfiles, setFeaturedProfiles] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/profiles')
      .then((res) => res.json())
      .then((data) => {
        if (data.profiles) {
          setFeaturedProfiles(data.profiles.slice(0, 4));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="member-app-layout">
      <CommunityHeader />

      <div className="community-shell">
        {/* Left Sidebar Navigation (Desktop & Tablet) */}
        <aside className="left-sidebar-nav" style={{ position: 'sticky', top: '88px' }}>
          <div
            className="glass-card"
            style={{
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ padding: '8px 12px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                }}
              >
                Community Menu
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
            >
              <MessageSquare size={18} />
              <span>Direct Inquiries</span>
            </Link>

            <Link
              to="/notifications"
              className={`sidebar-nav-link ${pathname === '/notifications' ? 'active' : ''}`}
            >
              <Bell size={18} />
              <span>Notifications</span>
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
                <div style={{ margin: '12px 0 6px', borderTop: '1px solid var(--border-subtle)' }} />
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
        </aside>

        {/* Center Main Content Outlet */}
        <main className="center-feed-stream">
          <Outlet />
        </main>

        {/* Right Sidebar (Featured Personas & Guidelines) */}
        <aside className="right-sidebar-rail" style={{ position: 'sticky', top: '88px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
