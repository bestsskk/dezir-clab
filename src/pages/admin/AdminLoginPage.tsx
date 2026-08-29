import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, AlertCircle, Loader2, KeyRound, Terminal } from 'lucide-react';
import { getOrCreateClientDeviceId, getClientDeviceInfo } from '../../lib/device';

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const clientDeviceId = getOrCreateClientDeviceId();
      const clientDeviceInfo = getClientDeviceInfo();

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': clientDeviceId,
        },
        body: JSON.stringify({
          email,
          password,
          deviceId: clientDeviceId,
          deviceInfo: clientDeviceInfo,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        const rawText = await res.text().catch(() => '');
        setErrorMsg(rawText ? `Server Error (${res.status}): ${rawText.slice(0, 200)}` : `Server Error (${res.status}). Please check /api/health.`);
        return;
      }

      if (res.ok && data.success) {
        if (data.user?.role !== 'ADMIN' && data.user?.role !== 'VIEWER_ADMIN') {
          setErrorMsg('Access Denied: Administrative privileges required.');
          return;
        }
        if (data.sessionToken) {
          try { localStorage.setItem('community_session_token', data.sessionToken); } catch (err) {}
        }
        window.location.href = '/likecrazy';
      } else {
        setErrorMsg(data.error || data.message || data.details || `Authentication failed (${res.status}). Please check your server database connection.`);
      }
    } catch (err: any) {
      setErrorMsg(err?.message ? `Connection error: ${err.message}` : 'Network error. Please check your server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        background: 'var(--bg-main)',
        color: '#ffffff',
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '40px 34px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Classified Badge */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(234, 179, 8, 0.1)',
              color: 'var(--accent-gold)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            <Terminal size={13} />
            <span>Executive Console Gateway</span>
          </div>

          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: 'var(--primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <ShieldCheck size={26} />
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff' }}>
            Executive Console
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5 }}>
            Master access portal for Dezir Clab directors, studio dispatches, and persona management.
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-rose)',
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Admin Login Form */}
        <form onSubmit={handleAdminLogin}>
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
              Administrator Email
            </label>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@community.vip"
                className="input-field"
                style={{ paddingLeft: '40px' }}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
              Master Security Key
            </label>
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="input-field"
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', gap: '8px', fontWeight: 800 }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
            <span>{loading ? 'Authorizing Access...' : 'Unlock Executive Console'}</span>
          </button>
        </form>

        <div
          style={{
            marginTop: '28px',
            paddingTop: '18px',
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontSize: '0.82rem',
          }}
        >
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Return to Dezir Clab Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
