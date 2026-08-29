import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
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
    } catch (e) {}
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/profiles?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0c0d0e]/90 backdrop-blur-md border-b border-white/[0.07] px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
            D
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
            DEZIR <span className="text-rose-500 font-medium text-sm px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">CLAB</span>
          </span>
        </Link>

        {/* Desktop Search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search personas, dispatches & tags..."
            className="w-full bg-[#141517] border border-white/[0.08] focus:border-rose-500/50 rounded-full pl-10 pr-4 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors"
          />
        </form>

        {/* Desktop Nav Actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              pathname === '/dashboard' ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Feed</span>
          </Link>

          <Link
            to="/profiles"
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              pathname.startsWith('/profiles') || pathname.startsWith('/profile') ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Discover</span>
          </Link>

          <Link
            to="/messages"
            className={`relative p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors ${
              pathname === '/messages' ? 'bg-white/[0.08] text-white' : ''
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            {unreadMessages > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadMessages}
              </span>
            )}
          </Link>

          <Link
            to="/notifications"
            className={`relative p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors ${
              pathname === '/notifications' ? 'bg-white/[0.08] text-white' : ''
            }`}
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </Link>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-white/[0.04] transition-colors"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.firstName} className="w-8 h-8 rounded-full object-cover border border-white/10" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 font-bold text-xs flex items-center justify-center border border-white/10">
                  {user?.firstName?.[0] || 'M'}
                </div>
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#141517] border border-white/[0.1] rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3.5 py-2 border-b border-white/[0.06]">
                  <p className="text-sm font-semibold text-white">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider">
                    {user?.role}
                  </span>
                </div>

                <Link
                  to="/account"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  <User className="w-4 h-4 text-zinc-400" />
                  <span>Account & Privacy</span>
                </Link>

                {(user?.role === 'ADMIN' || user?.role === 'VIEWER_ADMIN') && (
                  <Link
                    to="/likecrazy"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-rose-400" />
                    <span>Executive Console</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
