'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

import { getOrCreateClientDeviceId, getClientDeviceInfo } from '@/lib/device';

export default function JoinInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;
  const router = useRouter();

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
    validateToken();
  }, [token]);

  const validateToken = async () => {
    setValidating(true);
    setTokenError('');
    try {
      const res = await fetch(`/api/invitations/validate/${encodeURIComponent(token)}`);
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
      setTokenError('Sorry, this invitation link is invalid or has expired.');
    } finally {
      setValidating(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters long.');
      return;
    }

    if (!termsAccepted) {
      setSubmitError('You must accept the community terms & conditions.');
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
        // Successful registration -> auto redirect to community feed at /dashboard
        router.push(data.redirectUrl || '/dashboard');
      } else {
        setSubmitError(data.error || 'Registration failed. Please try again.');
      }
    } catch (e) {
      setSubmitError('An unexpected network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#090c13',
          color: '#fff',
        }}
      >
        <Loader2 size={40} className="animate-spin" color="var(--primary-light)" style={{ marginBottom: '16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Verifying private invitation credentials...</p>
      </div>
    );
  }

  if (!tokenValid) {
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
            maxWidth: '460px',
            width: '100%',
            padding: '40px 30px',
            textAlign: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.15)',
              color: 'var(--accent-rose)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              border: '1px solid rgba(244, 63, 94, 0.3)',
            }}
          >
            <XCircle size={32} />
          </div>

          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px' }}>
            Invitation Unavailable
          </h1>

          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '28px',
            }}
          >
            {tokenError || 'Sorry, this invitation link is invalid or has expired.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link href="/signup" className="btn btn-secondary">
              Enter a Different Invitation
            </Link>
            <Link href="/" className="btn btn-outline">
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 20px',
        background: 'var(--bg-main)',
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '500px',
          width: '100%',
          padding: '36px 32px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-emerald)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: '0.78rem',
              fontWeight: 700,
              marginBottom: '14px',
            }}
          >
            <CheckCircle2 size={14} />
            <span>Invitation Verified</span>
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Create Your Account</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Complete your registration to enter the private community feed.
          </p>
        </div>

        {/* VIP Purchase Thank-You Banner */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, rgba(255, 45, 117, 0.12) 0%, rgba(245, 158, 11, 0.1) 100%)',
            border: '1px solid rgba(255, 45, 117, 0.28)',
            marginBottom: '22px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--accent-gold)',
              fontSize: '0.86rem',
              fontWeight: 800,
              marginBottom: '4px',
            }}
          >
            <Sparkles size={15} />
            <span>Thank You for Your VIP Membership Purchase</span>
          </div>
          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Your access has been successfully granted. Complete your registration below to unlock your full VIP privileges.
          </p>
        </div>

        {submitError && (
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-rose)',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="input-field"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="input-field"
                required
              />
            </div>
          </div>

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
                placeholder="john.doe@domain.com"
                className="input-field"
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Create Password</label>
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
                placeholder="Min 8 characters"
                className="input-field"
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
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
                placeholder="Confirm your password"
                className="input-field"
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          {/* Device Security Notice */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '12px 0 16px',
            }}
          >
            <ShieldCheck size={16} color="var(--primary-light)" style={{ flexShrink: 0 }} />
            <span>
              <strong>Single-Device Security:</strong> Your account will be securely bound to this device upon registration.
            </span>
          </div>

          {/* Terms checkbox */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', margin: '0 0 20px' }}>
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              style={{ marginTop: '3px', cursor: 'pointer' }}
              required
            />
            <label htmlFor="terms" style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              I agree to the Community Guidelines, confidentiality standards, and Private Terms of Service.
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', gap: '8px' }}
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            <span>{submitting ? 'Creating Account & Entering...' : 'Join Community Feed'}</span>
          </button>
        </form>

        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontSize: '0.825rem',
            color: 'var(--text-muted)',
          }}
        >
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
