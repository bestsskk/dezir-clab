import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  XCircle,
} from 'lucide-react';
import { getOrCreateClientDeviceId, getClientDeviceInfo } from '../lib/device';
import { useAuth } from '../lib/auth-context';

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setUser, refreshUser } = useAuth();

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [invitationInfo, setInvitationInfo] = useState<any>(null);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    setValidating(true);
    setTokenError('');
    try {
      const res = await fetch(`/api/invitations/validate/${encodeURIComponent(token || '')}`);
      const data = await res.json();

      if (res.ok && data.valid) {
        setTokenValid(true);
        setInvitationInfo(data.invitation);
      } else {
        setTokenValid(false);
        setTokenError(data.error || 'Sorry, this invitation link is invalid or has expired.');
      }
    } catch (e) {
      setTokenValid(false);
      setTokenError('Connection error while validating invitation security pass.');
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match. Please re-enter.');
      return;
    }

    if (!termsAccepted) {
      setSubmitError('You must agree to the private community rules & conduct guidelines.');
      return;
    }

    setSubmitting(true);

    try {
      const clientDeviceId = getOrCreateClientDeviceId();
      const clientDeviceInfo = getClientDeviceInfo();

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': clientDeviceId,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          invitationToken: token,
          termsAccepted,
          deviceId: clientDeviceId,
          deviceInfo: clientDeviceInfo,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.sessionToken) {
          try { localStorage.setItem('community_session_token', data.sessionToken); } catch (err) {}
        }
        if (data.user) {
          setUser(data.user);
        }
        await refreshUser();
        window.location.href = data.redirectUrl || '/dashboard';
      } else {
        setSubmitError(data.error || 'Registration failed. Please check your details.');
      }
    } catch (e) {
      setSubmitError('Network error. Failed to complete registration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={36} className="animate-spin" color="var(--primary-light)" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Validating Private Invitation Key...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'var(--bg-main)' }}>
        <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '40px 30px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <XCircle size={28} color="var(--accent-rose)" />
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '8px' }}>Invitation Invalid</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '24px' }}>
            {tokenError}
          </p>
          <Link to="/register" className="btn btn-secondary" style={{ width: '100%' }}>
            Try Another Invitation Token
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'var(--bg-main)' }}>
      <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '36px 30px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '9999px', color: 'var(--accent-emerald)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '14px' }}>
            <CheckCircle2 size={13} />
            <span>Invitation Verified</span>
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800 }}>Create Your Member Profile</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Complete your private membership credentials to enter Dezir Clab.
          </p>
        </div>

        {submitError && (
          <div style={{ padding: '12px 14px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius-md)', color: 'var(--accent-rose)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Alexander" className="input-field" required />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Vance" className="input-field" required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alexander@domain.com" className="input-field" required />
          </div>

          <div className="form-group">
            <label className="form-label">Create Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="input-field" required />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" className="input-field" required />
          </div>

          <div style={{ marginTop: '16px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} style={{ marginTop: '3px' }} required />
            <label htmlFor="terms" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              I agree to the strict confidential guidelines, respect all creators, and understand my account is permanently locked to this device.
            </label>
          </div>

          <button type="submit" disabled={submitting} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
            <span>{submitting ? 'Creating Membership...' : 'Complete & Unlock Access'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
