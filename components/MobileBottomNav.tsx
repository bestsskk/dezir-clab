'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, MessageSquare, Bell, User } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const notifRes = await fetch('/api/notifications');
        if (notifRes.ok) {
          const data = await notifRes.json();
          setUnreadNotifications(data.unreadCount || 0);
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

    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, []);

  const isTabActive = (route: string) => {
    if (route === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(route);
  };

  return (
    <nav className="mobile-bottom-bar" aria-label="Mobile Navigation">
      {/* Home / Feed Tab */}
      <Link
        href="/dashboard"
        className={`mobile-tab-item ${isTabActive('/dashboard') ? 'active' : ''}`}
        id="mobile-nav-home"
      >
        <Home size={22} />
        <span>Home</span>
      </Link>

      {/* Profiles / Chat Tab */}
      <Link
        href="/profiles"
        className={`mobile-tab-item ${isTabActive('/profiles') || isTabActive('/profile') ? 'active' : ''}`}
        id="mobile-nav-profiles"
      >
        <Compass size={22} />
        <span>Chat</span>
      </Link>

      {/* Messages / DM Tab */}
      <Link
        href="/messages"
        className={`mobile-tab-item ${isTabActive('/messages') ? 'active' : ''}`}
        id="mobile-nav-messages"
      >
        <div style={{ position: 'relative' }}>
          <MessageSquare size={22} />
          {unreadMessages > 0 && (
            <span className="badge-count">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </div>
        <span>DM</span>
      </Link>

      {/* Notifications Tab */}
      <Link
        href="/notifications"
        className={`mobile-tab-item ${isTabActive('/notifications') ? 'active' : ''}`}
        id="mobile-nav-notifications"
      >
        <div style={{ position: 'relative' }}>
          <Bell size={22} />
          {unreadNotifications > 0 && (
            <span className="badge-count">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </div>
        <span>Alerts</span>
      </Link>

      {/* Account Tab */}
      <Link
        href="/account"
        className={`mobile-tab-item ${isTabActive('/account') ? 'active' : ''}`}
        id="mobile-nav-account"
      >
        <User size={22} />
        <span>Account</span>
      </Link>
    </nav>
  );
}
