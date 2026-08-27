'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle, AlertCircle, Loader2, KeyRound, ShieldCheck, Lock, Mail } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin Credentials State
  const [adminEmail, setAdminEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [credSaving, setCredSaving] = useState(false);
  const [credMsg, setCredMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [settingsRes, adminRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/admin/account'),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data.settings || {});
      }

      if (adminRes.ok) {
        const aData = await adminRes.json();
        if (aData.admin?.email) {
          setAdminEmail(aData.admin.email);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'success', text: 'Platform settings updated successfully.' });
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to update settings.' });
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'Network error.' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAdminCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredMsg(null);

    if (newPassword && newPassword !== confirmPassword) {
      setCredMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (newPassword && newPassword.length < 8) {
      setCredMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    if (!currentPassword) {
      setCredMsg({ type: 'error', text: 'Please enter your current master password to confirm changes.' });
      return;
    }

    setCredSaving(true);
    try {
      const res = await fetch('/api/admin/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          currentPassword,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCredMsg({ type: 'success', text: 'Administrator credentials updated successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setCredMsg({ type: 'error', text: data.error || 'Failed to update credentials.' });
      }
    } catch (e) {
      setCredMsg({ type: 'error', text: 'Network error updating credentials.' });
    } finally {
      setCredSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Loader2 size={36} className="animate-spin" color="var(--accent-gold)" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '840px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Platform & Security Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Configure administrator access credentials, marketing copy, and community moderation rules.
        </p>
      </div>

      {/* 1. Admin Master Credentials Section */}
      <div className="glass-card" style={{ padding: '26px', border: '1px solid rgba(255, 45, 117, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(255, 45, 117, 0.15)',
              color: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <KeyRound size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
              Administrator Master Credentials
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Change the email address and master security key used to access <strong style={{ color: 'var(--accent-gold)' }}>/likecrazy</strong>.
            </p>
          </div>
        </div>

        {credMsg && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.875rem',
              background: credMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              color: credMsg.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              border: `1px solid ${
                credMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'
              }`,
            }}
          >
            {credMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{credMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdateAdminCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Administrator Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@community.vip"
                className="input-field"
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">New Master Password (Leave blank to keep unchanged)</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '4px' }}>
            <label className="form-label" style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>
              Current Master Password (Required to authorize update)
            </label>
            <div style={{ position: 'relative', maxWidth: '400px' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="input-field"
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={credSaving || !currentPassword}
              className="btn btn-primary"
              style={{ gap: '8px' }}
            >
              {credSaving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              <span>Update Admin Credentials</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Platform Branding & Community Settings */}
      {msg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
            color: msg.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            border: `1px solid ${
              msg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'
            }`,
          }}
        >
          {msg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{msg.text}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Branding & Marketing */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', color: '#fff' }}>
            Branding & Landing Page
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Community Name</label>
              <input
                type="text"
                value={settings.site_name || 'Dezir Clab'}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tagline</label>
              <input
                type="text"
                value={settings.site_tagline || 'Private Paid Collective'}
                onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Hero Headline</label>
            <input
              type="text"
              value={settings.landing_headline || 'Your Private Community. Your Exclusive Access.'}
              onChange={(e) => setSettings({ ...settings, landing_headline: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Hero Subheadline</label>
            <textarea
              value={settings.landing_subheadline || ''}
              onChange={(e) => setSettings({ ...settings, landing_subheadline: e.target.value })}
              className="textarea-field"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Social Proof Display Counter</label>
            <input
              type="text"
              value={settings.member_count_display || '1,420+'}
              onChange={(e) => setSettings({ ...settings, member_count_display: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        {/* Member Permissions */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', color: '#fff' }}>
            Community Permissions & Rules
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Member Posting Mode</label>
              <select
                value={settings.member_posting_mode || 'disabled'}
                onChange={(e) => setSettings({ ...settings, member_posting_mode: e.target.value })}
                className="select-field"
              >
                <option value="disabled">Disabled (Admin & Managed Personas Only)</option>
                <option value="approval">Requires Admin Approval</option>
                <option value="enabled">Enabled (Direct to Feed)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Comment Permissions</label>
              <select
                value={settings.comment_mode || 'enabled'}
                onChange={(e) => setSettings({ ...settings, comment_mode: e.target.value })}
                className="select-field"
              >
                <option value="enabled">Enabled (Direct Posting)</option>
                <option value="approval">Requires Admin Approval</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Default Feed Sort</label>
            <select
              value={settings.default_feed_sort || 'latest'}
              onChange={(e) => setSettings({ ...settings, default_feed_sort: e.target.value })}
              className="select-field"
            >
              <option value="latest">Latest (Newest First)</option>
              <option value="popular">Popular (Most Reactions First)</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn btn-gold btn-lg"
          style={{ gap: '8px' }}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>Save Platform Settings</span>
        </button>
      </form>
    </div>
  );
}
