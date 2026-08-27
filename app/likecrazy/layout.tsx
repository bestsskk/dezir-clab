'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  MessageSquare,
  KeyRound,
  History,
  Settings,
  ArrowLeft,
  LogOut,
  Sparkles,
  ShieldCheck,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  const isLoginPage = pathname === '/likecrazy/login';

  useEffect(() => {
    if (isLoginPage) return;

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          if (data.user.role !== 'ADMIN') {
            router.push('/dashboard');
          } else {
            setAdminUser(data.user);
          }
        } else {
          router.push('/likecrazy/login');
        }
      })
      .catch(() => {
        router.push('/likecrazy/login');
      });
  }, [router, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const navSections = [
    {
      title: 'Studio Operations',
      items: [
        { href: '/likecrazy/posts', label: 'Posts & Feed Dispatches', icon: FileText },
        { href: '/likecrazy/profiles', label: '10 Managed Personas', icon: UserCheck },
        { href: '/likecrazy/messages', label: 'Direct Messages Hub', icon: MessageSquare },
      ],
    },
    {
      title: 'Community Access',
      items: [
        { href: '/likecrazy/members', label: 'Verified Members', icon: Users },
        { href: '/likecrazy/invitations', label: 'VIP Invitation Links', icon: KeyRound },
      ],
    },
    {
      title: 'System & Control',
      items: [
        { href: '/likecrazy', label: 'Overview & Stats', icon: LayoutDashboard },
        { href: '/likecrazy/settings', label: 'Platform Settings', icon: Settings },
        { href: '/likecrazy/audit-logs', label: 'Security & Audit Logs', icon: History },
      ],
    },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/likecrazy/login');
  };

  const isActive = (href: string) => {
    if (href === '/likecrazy') return pathname === '/likecrazy';
    return pathname.startsWith(href);
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-main)',
        color: '#ffffff',
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: '260px',
          background: 'rgba(17, 13, 25, 0.96)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
        }}
        className={mobileMenuOpen ? 'block' : 'hidden md:flex'}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '22px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={18} color="#fff" />
            </div>
            <div>
              <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#fff', display: 'block', lineHeight: 1.1 }}>
                Dezir Clab
              </span>
              <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--primary-light)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>
                Admin Console
              </span>
            </div>
          </div>

          {mobileMenuOpen && (
            <button onClick={() => setMobileMenuOpen(false)} style={{ color: '#fff' }}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Grouped Clean Navigation */}
        <nav
          style={{
            flex: 1,
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto',
          }}
        >
          {navSections.map((sec, sIdx) => (
            <div key={sIdx}>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--text-muted)',
                  padding: '4px 12px 6px',
                }}
              >
                {sec.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.86rem',
                        fontWeight: active ? 700 : 500,
                        color: active ? '#ffffff' : 'var(--text-secondary)',
                        background: active ? 'rgba(255, 45, 117, 0.16)' : 'transparent',
                        border: active ? '1px solid rgba(255, 45, 117, 0.35)' : '1px solid transparent',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Icon size={16} color={active ? 'var(--primary-light)' : 'var(--text-muted)'} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {adminUser && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: adminUser.role === 'VIEWER_ADMIN' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 45, 117, 0.12)',
                border: adminUser.role === 'VIEWER_ADMIN' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 45, 117, 0.3)',
                marginBottom: '4px',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {adminUser.email}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: adminUser.role === 'VIEWER_ADMIN' ? '#60a5fa' : 'var(--primary-light)',
                  fontWeight: 800,
                  marginTop: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{adminUser.role === 'VIEWER_ADMIN' ? '👁️ Read-Only Viewer Admin' : '⚡ Executive Super Admin'}</span>
              </div>
            </div>
          )}

          <Link
            href="/dashboard"
            target="_blank"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              background: 'rgba(255, 255, 255, 0.04)',
              fontWeight: 600,
            }}
          >
            <span>Preview Member Feed</span>
            <ExternalLink size={13} />
          </Link>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              color: 'var(--accent-rose)',
              fontWeight: 600,
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          marginLeft: '260px',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: '100vh',
        }}
      >
        {/* Mobile Header */}
        <header
          style={{
            height: '60px',
            background: 'rgba(17, 13, 25, 0.95)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
          className="md:hidden"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="var(--primary)" />
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>Dezir Clab Admin</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ color: '#fff' }}>
            <Menu size={22} />
          </button>
        </header>

        {/* Page Content */}
        <main
          style={{
            flex: 1,
            padding: '28px',
            maxWidth: '1280px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
