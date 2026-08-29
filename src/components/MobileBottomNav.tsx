import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, MessageSquare, Bell, User } from 'lucide-react';

export default function MobileBottomNav() {
  const location = useLocation();
  const pathname = location.pathname;
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, []);

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

  const navItems = [
    { label: 'Feed', href: '/dashboard', icon: Home, isActive: pathname === '/dashboard' },
    { label: 'Discover', href: '/profiles', icon: Compass, isActive: pathname.startsWith('/profiles') || pathname.startsWith('/profile') },
    { label: 'Chat', href: '/messages', icon: MessageSquare, badge: unreadMessages, isActive: pathname === '/messages' },
    { label: 'Alerts', href: '/notifications', icon: Bell, badge: unreadNotifications, isActive: pathname === '/notifications' },
    { label: 'Profile', href: '/account', icon: User, isActive: pathname === '/account' },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0c0d0e]/95 backdrop-blur-lg border-t border-white/[0.08] px-2 py-2 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`flex flex-col items-center justify-center relative py-1 px-3 rounded-lg transition-colors ${
              item.isActive ? 'text-rose-500 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {Boolean(item.badge && item.badge > 0) && (
                <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-0.5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
