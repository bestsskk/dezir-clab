'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, KeyRound, ArrowRight, Sparkles, Loader2 } from 'lucide-react';

export default function SignupGatekeeperPage() {
  const router = useRouter();
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
        router.push(`/join/${encodeURIComponent(cleanToken)}`);
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
            borderRadius: '16px',
            background: 'rgba(245, 158, 11, 0.15)',
            color: 'var(--accent-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            border: '1px solid var(--border-gold)',
          }}
        >
          <ShieldAlert size={28} />
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '10px' }}>
          Membership by Invitation Only
        </h1>

        <p
          style={{
            fontSize: '0.925rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '28px',
          }}
        >
          Public registration is disabled to preserve community integrity. If you have been granted an invitation code or token, enter it below to proceed to registration.
        </p>

        {errorMsg && (
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-rose)',
              fontSize: '0.875rem',
              marginBottom: '20px',
              textAlign: 'left',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label className="form-label">Invitation Token / URL Code</label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="e.g. VIP-COMMUNITY-2026"
              className="input-field"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !tokenInput.trim()}
            className="btn btn-gold btn-lg"
            style={{ width: '100%', marginTop: '8px', gap: '8px' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
            <span>{loading ? 'Verifying Token...' : 'Enter Invitation Code'}</span>
          </button>
        </form>

        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
          }}
        >
          <Link href="/" style={{ color: 'var(--text-muted)' }}>
            ← Back to Home
          </Link>
          <Link href="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
            Member Login →
          </Link>
        </div>
      </div>
    </div>
  );
}
