import React from 'react';
import CommunityHeader from '@/components/CommunityHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import WelcomeRespectModal from '@/components/WelcomeRespectModal';
import Link from 'next/link';
import { Home, Compass, MessageSquare, Bell, User, ShieldCheck, Sparkles, BookOpen, Star } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Fetch featured managed profiles for the right sidebar
  const featuredProfiles = await prisma.managedProfile.findMany({
    where: { status: 'ACTIVE', isFeatured: true },
    take: 4,
    orderBy: { displayOrder: 'asc' },
  });

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
              href="/dashboard"
              className="btn btn-outline"
              style={{
                justifyContent: 'flex-start',
                border: 'none',
                gap: '12px',
                padding: '10px 14px',
              }}
            >
              <Home size={18} color="var(--primary-light)" />
              <span>Community Feed</span>
            </Link>

            <Link
              href="/profiles"
              className="btn btn-outline"
              style={{
                justifyContent: 'flex-start',
                border: 'none',
                gap: '12px',
                padding: '10px 14px',
              }}
            >
              <Compass size={18} color="var(--accent-gold)" />
              <span>Chat</span>
            </Link>

            <Link
              href="/messages"
              className="btn btn-outline"
              style={{
                justifyContent: 'flex-start',
                border: 'none',
                gap: '12px',
                padding: '10px 14px',
              }}
            >
              <MessageSquare size={18} color="var(--accent-cyan)" />
              <span>DM</span>
            </Link>

            <Link
              href="/notifications"
              className="btn btn-outline"
              style={{
                justifyContent: 'flex-start',
                border: 'none',
                gap: '12px',
                padding: '10px 14px',
              }}
            >
              <Bell size={18} color="var(--accent-rose)" />
              <span>Notifications</span>
            </Link>

            <Link
              href="/account"
              className="btn btn-outline"
              style={{
                justifyContent: 'flex-start',
                border: 'none',
                gap: '12px',
                padding: '10px 14px',
              }}
            >
              <User size={18} color="var(--text-secondary)" />
              <span>My Account</span>
            </Link>
          </div>

          {/* Guidelines box */}
          <div
            className="glass-card"
            style={{
              padding: '16px',
              marginTop: '16px',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <BookOpen size={16} color="var(--accent-gold)" />
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Private Etiquette
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              Strict confidentiality applies. Do not share, record, or distribute internal media or conversations.
            </p>
          </div>
        </aside>

        {/* Central Content Area (Community Feed, Profiles, Messages, etc.) */}
        <main style={{ minWidth: 0, width: '100%' }}>{children}</main>

        {/* Right Sidebar (Desktop only) */}
        <aside className="right-sidebar-panel" style={{ position: 'sticky', top: '88px' }}>
          <div
            className="glass-card"
            style={{
              padding: '18px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={16} color="var(--accent-gold)" />
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Chat
                </span>
              </div>
              <Link
                href="/profiles"
                style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 600 }}
              >
                View All
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {featuredProfiles.map((p) => (
                <Link
                  key={p.id}
                  href={`/profile/${p.slug}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <img
                    src={p.avatarUrl}
                    alt={p.name}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid var(--border-highlight)',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {p.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {p.location || 'Studio Member'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div
            className="glass-card"
            style={{
              padding: '16px',
              textAlign: 'center',
              background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, rgba(0,0,0,0) 100%)',
            }}
          >
            <Sparkles size={24} color="var(--primary-light)" style={{ margin: '0 auto 8px' }} />
            <h4 style={{ fontSize: '0.9rem', marginBottom: '4px' }}>Private VIP Concierge</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Direct access to creators & studio directors via high-priority messaging.
            </p>
            <Link href="/messages" className="btn btn-sm btn-primary" style={{ width: '100%' }}>
              Open DM
            </Link>
          </div>
        </aside>
      </div>

      <MobileBottomNav />
      <WelcomeRespectModal />
    </div>
  );
}
