'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Key,
  Users,
  MessageSquare,
  Lock,
  Star,
  CheckCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Eye,
  Flame,
  ShieldCheck,
  KeyRound,
  Heart,
  ChevronRight,
  X,
  Award,
  HeartHandshake,
  Fingerprint,
  Radio,
  EyeOff,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [validating, setValidating] = useState(false);

  const handleValidateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;

    setValidating(true);
    setInviteError('');

    try {
      const cleanToken = inviteCodeInput.trim();
      const res = await fetch(`/api/invitations/validate/${encodeURIComponent(cleanToken)}`);
      const data = await res.json();

      if (res.ok && data.valid) {
        router.push(`/join/${encodeURIComponent(cleanToken)}`);
      } else {
        setInviteError(data.error || 'Access Denied: Invitation key is invalid or has expired.');
      }
    } catch (e) {
      setInviteError('Connection error: Failed to verify security token.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-main)',
        color: '#fff',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Subtle Grid Background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Clandestine Header (Responsive Mobile & Desktop) */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(14, 15, 18, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Lock size={16} color="#fff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.05rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                DEZIR CLAB
              </span>
              <span
                className="secret-badge"
                style={{
                  fontSize: '0.58rem',
                  padding: '1px 6px',
                  whiteSpace: 'nowrap',
                }}
              >
                <span className="secret-dot" style={{ width: '4px', height: '4px' }} />
                RESTRICTED
              </span>
            </div>
            <span
              style={{
                display: 'block',
                fontSize: '0.58rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
                fontWeight: 700,
                lineHeight: 1,
                marginTop: '1px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Private Confidential Circle
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <Link
            href="/login"
            className="btn btn-secondary btn-sm"
            style={{
              fontSize: '0.75rem',
              padding: '6px 10px',
              gap: '4px',
            }}
          >
            <KeyRound size={12} color="var(--primary-light)" />
            <span>Login</span>
          </Link>
          <button
            onClick={() => setInviteModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{
              fontSize: '0.75rem',
              padding: '6px 10px',
              gap: '4px',
            }}
          >
            <Fingerprint size={13} />
            <span>Enter Key</span>
          </button>
        </div>
      </header>

      {/* Hero Section: The Secret Society (Optimized for Mobile Screens) */}
      <section
        style={{
          padding: '36px 14px 28px',
          textAlign: 'center',
          maxWidth: '820px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Classified Status Bar */}
        <div style={{ display: 'inline-flex', marginBottom: '14px' }}>
          <div className="secret-badge" style={{ fontSize: '0.65rem', padding: '3px 8px' }}>
            <span className="secret-dot" />
            <span>CONFIDENTIAL // STRICTLY INVITE-ONLY</span>
          </div>
        </div>

        <h1
          style={{
            fontSize: 'clamp(1.5rem, 5.5vw, 3.2rem)',
            fontWeight: 900,
            lineHeight: 1.18,
            marginBottom: '14px',
            letterSpacing: '-0.025em',
            textTransform: 'uppercase',
          }}
        >
          The Secret Society For{' '}
          <span
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f43f5e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block',
            }}
          >
            Young Men & Beautiful Mature Women
          </span>
        </h1>

        <p
          style={{
            fontSize: 'clamp(0.88rem, 3.2vw, 1.1rem)',
            color: 'var(--text-secondary)',
            maxWidth: '640px',
            margin: '0 auto 24px',
            lineHeight: 1.55,
          }}
        >
          A discreet, closed-door underground community connecting energetic young men with charming divorced & mature women. Daily locked dispatches, instant reactions, and direct 1-on-1 private messaging.
        </p>

        {/* Security Clearance Keycard Terminal */}
        <div
          className="secret-vault-card"
          style={{
            maxWidth: '560px',
            margin: '0 auto 28px',
            padding: '20px 16px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Fingerprint size={18} color="var(--primary)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.03em' }}>
                SECURITY CLEARANCE SCANNER
              </span>
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              [ ENCRYPTION ACTIVE ]
            </span>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Enter your secret VIP invitation token to unlock registration.
          </p>

          <form onSubmit={handleValidateInvite} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value)}
                placeholder="ENTER SECRET TOKEN (E.G. VIP-COMMUNITY-2026)"
                className="input-field"
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                }}
                required
              />
              <button
                type="submit"
                disabled={validating}
                className="btn btn-primary"
                style={{ width: '100%', gap: '8px', padding: '12px' }}
              >
                {validating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying Security Key...</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Unlock Vault</span>
                  </>
                )}
              </button>
            </div>

            {inviteError && (
              <div
                style={{
                  padding: '8px 12px',
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--accent-rose)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ShieldAlert size={15} style={{ flexShrink: 0 }} />
                <span>{inviteError}</span>
              </div>
            )}
          </form>
        </div>

        {/* Live Discreet Counter Badges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            maxWidth: '480px',
            margin: '0 auto',
          }}
        >
          <div className="glass-card" style={{ padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff' }}>100%</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Confidential
            </div>
          </div>

          <div className="glass-card" style={{ padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--accent-gold)' }}>0%</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Public Footprint
            </div>
          </div>
        </div>
      </section>

      {/* Secret Vault Features */}
      <section style={{ padding: '40px 14px', maxWidth: '1080px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="secret-badge" style={{ marginBottom: '8px' }}>
            CLASSIFIED PROTOCOL
          </span>
          <h2 style={{ fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: 900 }}>
            Why Dezir Clab Stays Completely Secret
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '0.88rem' }}>
            Engineered for total privacy, zero unwanted eyes, and pure excitement.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '14px',
          }}
        >
          {[
            {
              title: 'Zero Public Roster',
              desc: 'Members never see each other. Complete member isolation ensures nobody knows who else belongs to the circle.',
              icon: EyeOff,
              badge: 'Stealth Isolation',
            },
            {
              title: '1-on-1 Direct Private Chat',
              desc: 'Direct confidential messaging with our 10 resident female profiles for fun, personal, and exciting private connections.',
              icon: MessageSquare,
              badge: 'Private Line',
            },
            {
              title: 'Daily Photos & Video Feed',
              desc: 'Access encrypted daily photo dispatches and lifestyle updates from mature & divorced women (ages 28–45).',
              icon: Flame,
              badge: 'Locked Content',
            },
            {
              title: 'Encrypted Token Gates',
              desc: 'Registration is strictly impossible without an authentic, authorized VIP invitation key created by community leadership.',
              icon: Key,
              badge: 'Keycard Only',
            },
            {
              title: 'No Search Engine Indexing',
              desc: 'The entire member area is hidden from Google and web crawlers. Your activity leaves zero public trail.',
              icon: ShieldCheck,
              badge: '100% Discreet',
            },
            {
              title: 'Instant Reactions & Love',
              desc: 'Send subtle love and fire reactions to posts to get noticed without exposing your contact information.',
              icon: Heart,
              badge: 'Discreet Signals',
            },
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="glass-card"
                style={{
                  padding: '20px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(225, 29, 72, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary-light)',
                      border: '1px solid rgba(225, 29, 72, 0.25)',
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                    {card.badge}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>{card.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Secret Access Verification Protocol */}
      <section
        style={{
          padding: '40px 14px',
          maxWidth: '820px',
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <h2 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 900, marginBottom: '10px' }}>
          Access Protocol
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
          Follow the 3-step security procedure to enter Dezir Clab.
        </p>

        <div
          className="glass-card"
          style={{
            padding: '24px 18px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  flexShrink: 0,
                }}
              >
                1
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>
                  Acquire a VIP Invitation Token
                </h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  Invitations are released in limited batches through private concierge channels.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  flexShrink: 0,
                }}
              >
                2
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>
                  Authenticate via Security Key
                </h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  Input your code into the Security Scanner to unlock your private pass.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  flexShrink: 0,
                }}
              >
                3
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>
                  Access Private Feed & DMs
                </h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  Create your discreet account and initiate 1-on-1 private messaging.
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <button
              onClick={() => setInviteModalOpen(true)}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', gap: '8px', padding: '12px' }}
            >
              <Lock size={16} />
              <span>I HAVE A SECRET KEY</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Secret Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '24px 14px',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          background: 'var(--bg-surface)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <p>© 2026 DEZIR CLAB. CLASSIFIED PRIVATE SOCIETY. 100% DISCREET & CONFIDENTIAL.</p>
      </footer>

      {/* "I Have a Secret Key" Modal */}
      {inviteModalOpen && (
        <div
          className="lightbox-backdrop"
          onClick={() => setInviteModalOpen(false)}
          style={{ padding: '14px' }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '420px',
              width: '100%',
              padding: '24px 18px',
              position: 'relative',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setInviteModalOpen(false)}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(225, 29, 72, 0.1)',
                  color: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  border: '1px solid rgba(225, 29, 72, 0.25)',
                }}
              >
                <Fingerprint size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>
                Verify Secret Passkey
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Enter your invitation code to access private registration.
              </p>
            </div>

            {inviteError && (
              <div
                style={{
                  padding: '8px 12px',
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--accent-rose)',
                  fontSize: '0.8rem',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ShieldAlert size={15} style={{ flexShrink: 0 }} />
                <span>{inviteError}</span>
              </div>
            )}

            <form onSubmit={handleValidateInvite}>
              <div className="form-group">
                <input
                  type="text"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                  placeholder="E.G. VIP-COMMUNITY-2026"
                  className="input-field"
                  style={{
                    textAlign: 'center',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                  }}
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={validating}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', gap: '6px', marginTop: '4px' }}
              >
                {validating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying Key...</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Authenticate & Enter Vault</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
