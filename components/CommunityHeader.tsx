'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, ShieldCheck, User, LogOut, Search, Compass, MessageSquare, Home, Sparkles } from 'lucide-react';

interface HeaderUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

export default function CommunityHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUserAndCounts();
    const interval = setInterval(fetchUserAndCounts, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserAndCounts = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
      }

      const notifRes = await fetch('/api/notifications');
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setUnreadNotifications(notifData.unreadCount || 0);
      }

      const convRes = await fetch('/api/conversations');
      if (convRes.ok) {
        const convData = await convRes.json();
        const totalUnread = (convData.conversations || []).reduce(
          (sum: number, c: any) => sum + (c.unreadCount || 0),
          0
        );
        setUnreadMessages(totalUnread);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="app-header">
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                }}
              >
                Dezir Clab
              </span>
              <span className="secret-badge" style={{ fontSize: '0.62rem', padding: '2px 8px' }}>
                <span className="secret-dot" style={{ width: '5px', height: '5px' }} />
                DISCREET
              </span>
            </div>
            <span
              style={{
                display: 'block',
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--primary-light)',
                fontWeight: 800,
                lineHeight: 1,
                marginTop: '2px',
              }}
            >
              Private Confidential Circle
            </span>
          </div>
        </Link>

        {/* Search Field for Desktop */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            position: 'relative',
            display: 'none',
          }}
          className="desktop-search-form"
        >
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feed, topics, keywords..."
            className="input-field"
            style={{
              padding: '8px 12px 8px 36px',
              fontSize: '0.85rem',
              width: '240px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.05)',
            }}
          />
        </form>
      </div>

      {/* Right User Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Notifications Icon with Badge */}
        <Link
          href="/notifications"
          className="btn-icon"
          style={{ position: 'relative' }}
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unreadNotifications > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '18px',
                height: '18px',
                background: 'var(--accent-rose)',
                color: '#fff',
                borderRadius: '50%',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </Link>

        {/* Messages Icon for Desktop */}
        <Link
          href="/messages"
          className="btn-icon"
          style={{ position: 'relative' }}
          aria-label="Messages"
        >
          <MessageSquare size={20} />
          {unreadMessages > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '18px',
                height: '18px',
                background: 'var(--primary)',
                color: '#fff',
                borderRadius: '50%',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </Link>

        {/* User Profile Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
          >
            <img
              src={
                user?.avatarUrl ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  user ? `${user.firstName} ${user.lastName}` : 'Member'
                )}`
              }
              alt="User Avatar"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                display: 'none',
              }}
              className="header-username-text"
            >
              {user?.firstName || 'Member'}
            </span>
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '8px',
                width: '220px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '8px',
                zIndex: 60,
              }}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '6px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {user?.firstName} {user?.lastName}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {user?.email}
                </div>
              </div>

              <Link
                href="/account"
                onClick={() => setDropdownOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background 0.15s',
                }}
              >
                <User size={16} /> My Account
              </Link>

              <Link
                href="/profiles"
                onClick={() => setDropdownOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background 0.15s',
                }}
              >
                <Compass size={16} /> Chat
              </Link>

              {(user?.role === 'ADMIN' || user?.role === 'VIEWER_ADMIN') && (
                <Link
                  href="/likecrazy"
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    fontSize: '0.875rem',
                    color: 'var(--accent-gold)',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'background 0.15s',
                  }}
                >
                  <ShieldCheck size={16} /> Admin Console
                </Link>
              )}

              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  fontSize: '0.875rem',
                  color: 'var(--accent-rose)',
                  width: '100%',
                  textAlign: 'left',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: '4px',
                  cursor: 'pointer',
                }}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
