import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  CheckCheck,
  MessageSquare,
  Heart,
  Megaphone,
  Sparkles,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl: string | null;
  readAt: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'NEW_MESSAGE':
        return <MessageSquare size={18} color="var(--primary-light)" />;
      case 'POST_REACTION':
        return <Heart size={18} color="var(--accent-rose)" />;
      case 'ANNOUNCEMENT':
        return <Megaphone size={18} color="var(--accent-gold)" />;
      default:
        return <Sparkles size={18} color="var(--accent-cyan)" />;
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        className="glass-card"
        style={{
          padding: '20px 24px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={20} color="var(--accent-rose)" />
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Notification Center</h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {unreadCount > 0
              ? `You have ${unreadCount} unread community notification${unreadCount > 1 ? 's' : ''}.`
              : 'All notifications are caught up.'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="btn btn-sm btn-secondary"
            style={{ gap: '6px' }}
          >
            <CheckCheck size={16} />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={32} className="animate-spin" color="var(--primary-light)" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <Bell size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>You are all caught up!</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            When you receive direct messages, reactions, or community announcements, they will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && handleMarkAsRead(n.id)}
              className="glass-card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                background: n.isRead ? 'var(--bg-card)' : 'rgba(99, 102, 241, 0.08)',
                borderColor: n.isRead ? 'var(--border-subtle)' : 'var(--border-highlight)',
                cursor: n.linkUrl ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {getNotifIcon(n.type)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{n.title}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : ''}
                  </span>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                  {n.message}
                </p>

                {n.linkUrl && (
                  <Link
                    href={n.linkUrl}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.8rem',
                      color: 'var(--primary-light)',
                      fontWeight: 600,
                      marginTop: '8px',
                    }}
                  >
                    <span>View Details</span>
                    <ExternalLink size={12} />
                  </Link>
                )}
              </div>

              {!n.isRead && (
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--primary-light)',
                    marginTop: '6px',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
