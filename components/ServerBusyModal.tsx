'use client';

import React from 'react';
import { Clock, ShieldAlert, X, Sparkles } from 'lucide-react';

interface ServerBusyModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileName?: string;
}

export default function ServerBusyModal({
  isOpen,
  onClose,
  profileName,
}: ServerBusyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="lightbox-backdrop" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="glass-card"
        style={{
          maxWidth: '460px',
          width: '90%',
          padding: '32px 26px',
          position: 'relative',
          background: 'var(--bg-surface-elevated)',
          textAlign: 'center',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-gold)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.15)',
            color: 'var(--accent-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px',
            border: '1px solid var(--border-gold)',
          }}
        >
          <Clock size={28} />
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
          Messaging Server is Busy
        </h3>

        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '20px',
          }}
        >
          {profileName ? `Direct 1-on-1 private messaging with ${profileName}` : 'Direct private messaging with resident profiles'}{' '}
          is currently undergoing server capacity optimization due to high member traffic.
        </p>

        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid var(--border-gold)',
            color: 'var(--accent-gold)',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '24px',
          }}
        >
          ⚡ Messaging will open in 2–3 days!
        </div>

        <button
          onClick={onClose}
          className="btn btn-primary"
          style={{ width: '100%', padding: '12px' }}
        >
          Understood
        </button>
      </div>
    </div>
  );
}
