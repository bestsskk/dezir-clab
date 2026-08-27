'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Key,
  Shield,
  LogOut,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react';

export default function AccountSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setFirstName(data.user.firstName || '');
        setLastName(data.user.lastName || '');
        setBio(data.user.bio || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, bio }),
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
      } else {
        setProfileMsg({ type: 'error', text: data.error || 'Failed to update profile.' });
      }
    } catch (e) {
      setProfileMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/account/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg({ type: 'error', text: data.error || 'Failed to change password.' });
      }
    } catch (e) {
      setPasswordMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSavingPassword(false);
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <Loader2 size={32} className="animate-spin" color="var(--primary-light)" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Account Overview Header */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img
            src={
              user?.avatarUrl ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                user ? `${user.firstName} ${user.lastName}` : 'Member'
              )}`
            }
            alt="Avatar"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--border-highlight)',
            }}
          />
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              {user?.firstName} {user?.lastName}
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <span className="badge badge-primary">{user?.role} Access</span>
              <span className="badge badge-emerald">Verified Membership</span>
            </div>
          </div>
        </div>

        <button onClick={handleLogout} className="btn btn-danger btn-sm" style={{ gap: '6px' }}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Edit Profile Form */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <User size={20} color="var(--primary-light)" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Personal Information</h2>
        </div>

        {profileMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.875rem',
              background:
                profileMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              color: profileMsg.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              border: `1px solid ${
                profileMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'
              }`,
            }}
          >
            {profileMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{profileMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Bio / Profile Note</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="textarea-field"
              placeholder="Tell other members a bit about your work and creative interests..."
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="btn btn-primary"
            style={{ gap: '6px', marginTop: '8px' }}
          >
            {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Save Profile</span>
          </button>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <Key size={20} color="var(--accent-gold)" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Security & Password</h2>
        </div>

        {passwordMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.875rem',
              background:
                passwordMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              color: passwordMsg.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              border: `1px solid ${
                passwordMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'
              }`,
            }}
          >
            {passwordMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                placeholder="Min 8 characters"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="Confirm password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="btn btn-secondary"
            style={{ gap: '6px', marginTop: '8px' }}
          >
            {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
            <span>Update Password</span>
          </button>
        </form>
      </div>
    </div>
  );
}
