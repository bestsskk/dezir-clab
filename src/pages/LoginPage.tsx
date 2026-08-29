import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Lock, Mail, AlertCircle, Loader2, KeyRound, ShieldAlert } from 'lucide-react';
import { getOrCreateClientDeviceId, getClientDeviceInfo } from '../lib/device';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDeviceMismatch, setIsDeviceMismatch] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setIsDeviceMismatch(false);

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

      const data = await res.json();
      if (res.ok && data.success) {
        navigate(data.redirectUrl || redirectUrl);
      } else {
        if (data.code === 'DEVICE_MISMATCH' || res.status === 403) {
          setIsDeviceMismatch(true);
        }
        setErrorMsg(data.error || 'Invalid credentials. Please try again.');
      }
    } catch (e) {
      setErrorMsg('Network error. Please check your connection.');
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
        padding: '20px',
        background: 'var(--bg-main)',
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '36px 30px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
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
              <Sparkles size={20} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
              Dezir Clab
            </span>
          </Link>

          <h1 style={{ fontSize: '1.45rem', fontWeight: 800 }}>Member Sign In</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Enter your credentials to access the private community feed.
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '12px 14px',
              background: isDeviceMismatch ? 'rgba(245, 158, 11, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              border: `1px solid ${isDeviceMismatch ? 'rgba(245, 158, 11, 0.4)' : 'rgba(244, 63, 94, 0.3)'}`,
              borderRadius: 'var(--radius-md)',
              color: isDeviceMismatch ? 'var(--accent-gold)' : 'var(--accent-rose)',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              marginBottom: '20px',
              lineHeight: 1.5,
            }}
          >
            {isDeviceMismatch ? (
              <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <div>
              <div style={{ fontWeight: isDeviceMismatch ? 700 : 500 }}>{errorMsg}</div>
              {isDeviceMismatch && (
                <div style={{ fontSize: '0.78rem', marginTop: '6px', color: 'var(--text-secondary)' }}>
                  If you have switched or lost access to your primary device, please contact a community administrator to request a device verification reset.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
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
                placeholder="name@domain.com"
                className="input-field"
                style={{ paddingLeft: '40px' }}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
              <Link
                to="/forgot-password"
                style={{ fontSize: '0.78rem', color: 'var(--primary-light)' }}
              >
                Forgot password?
              </Link>
            </div>
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
                placeholder="••••••••"
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
            style={{ width: '100%', marginTop: '12px', gap: '8px' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Invitation Guard Footer */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Don't have an account yet?
          </p>
          <Link
            to="/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              color: 'var(--accent-gold)',
              fontWeight: 700,
            }}
          >
            <KeyRound size={14} />
            <span>Join via Private Invitation</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
