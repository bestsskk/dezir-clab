'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Heart, Lock, CheckCircle2, Sparkles, UserCheck } from 'lucide-react';

export default function WelcomeRespectModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          const u = data.user;
          const name = u.firstName || 'Member';
          setUserName(name);
          setUserId(u.id);

          // Check if user has already acknowledged respect guidelines
          const key = `dezir_respect_ack_${u.id}`;
          const hasAcknowledged = localStorage.getItem(key);
          if (!hasAcknowledged) {
            setIsOpen(true);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleAccept = () => {
    if (userId) {
      localStorage.setItem(`dezir_respect_ack_${userId}`, 'true');
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="lightbox-backdrop"
      style={{
        zIndex: 200,
        background: 'rgba(5, 3, 8, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '32px 28px',
          position: 'relative',
          background: 'radial-gradient(ellipse at top, rgba(35, 18, 48, 0.98) 0%, rgba(13, 9, 20, 0.99) 100%)',
          border: '1px solid rgba(255, 45, 117, 0.4)',
          boxShadow: '0 0 50px rgba(255, 45, 117, 0.35)',
          borderRadius: 'var(--radius-xl)',
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        {/* Header Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff2d75 0%, #ff529a 50%, #ffb6c1 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 0 24px rgba(255, 45, 117, 0.5)',
            }}
          >
            <ShieldCheck size={30} />
          </div>

          <div className="secret-badge" style={{ marginBottom: '10px' }}>
            <span className="secret-dot" />
            <span>MEMBER ONBOARDING PROTOCOL</span>
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Welcome to Dezir Clab, {userName}!
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Please review and agree to our community etiquette before entering the private feed.
          </p>
        </div>

        {/* Guidelines List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '26px' }}>
          {/* Rule 1 */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 45, 117, 0.15)',
                color: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Heart size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', marginBottom: '2px' }}>
                1. Mutual Respect & Courtesy
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Treat our 10 resident women with dignity, politeness, and gentlemanly courtesy in all direct messages and interactions.
              </div>
            </div>
          </div>

          {/* Rule 2 */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(251, 191, 36, 0.15)',
                color: 'var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Lock size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', marginBottom: '2px' }}>
                2. 100% Discretion & Privacy
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                What happens in Dezir Clab stays in Dezir Clab. Zero screenshots, zero recording, and zero sharing outside the community.
              </div>
            </div>
          </div>

          {/* Rule 3 */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', marginBottom: '2px' }}>
                3. Zero Harassment Tolerance
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Abusive language, harassment, or non-consensual behavior will result in an immediate permanent ban and termination of access.
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleAccept}
          className="btn btn-primary btn-lg"
          style={{
            width: '100%',
            gap: '8px',
            padding: '14px',
            fontSize: '0.95rem',
            boxShadow: '0 0 25px rgba(255, 45, 117, 0.4)',
          }}
        >
          <CheckCircle2 size={18} />
          <span>I AGREE & ENTER COMMUNITY</span>
        </button>
      </div>
    </div>
  );
}
