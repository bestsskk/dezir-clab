import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, KeyRound, ArrowRight, Sparkles, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const cleanToken = tokenInput.trim();
      const res = await fetch(`/api/invitations/validate/${encodeURIComponent(cleanToken)}`);
      const data = await res.json();

      if (res.ok && data.valid) {
        navigate(`/join/${encodeURIComponent(cleanToken)}`);
      } else {
        setErrorMsg(data.error || 'Sorry, this invitation link is invalid or has expired.');
      }
    } catch (e) {
      setErrorMsg('Failed to validate invitation. Please check your token.');
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
        background: 'radial-gradient(ellipse at top, rgba(245, 158, 11, 0.1) 0%, #090c13 70%)',
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '40px 32px',
          textAlign: 'center',
          background: 'rgba(14, 20, 34, 0.9)',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <KeyRound size={26} color="var(--accent-gold)" />
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
          Private Invitation Required
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '28px' }}>
          Dezir Clab is a strictly vetted, confidential private community. Membership is accessible exclusively via an authorized invitation security pass.
        </p>

        {errorMsg && (
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-rose)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
              textAlign: 'left',
            }}
          >
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Enter Invitation Passcode</label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="e.g. VIP-SECRET-PASSCODE"
              className="input-field"
              style={{
                letterSpacing: '1px',
                fontFamily: 'monospace',
                fontSize: '0.95rem',
                textAlign: 'center',
              }}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !tokenInput.trim()}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '12px', gap: '8px' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            <span>{loading ? 'Verifying...' : 'Validate Invitation Pass'}</span>
          </button>
        </form>

        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Already an active verified member?{' '}
            <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
