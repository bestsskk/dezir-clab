'use client';

import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxMedia {
  url: string;
  mediaType: 'IMAGE' | 'VIDEO';
  caption?: string | null;
}

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaList: LightboxMedia[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export default function LightboxModal({
  isOpen,
  onClose,
  mediaList,
  currentIndex,
  onNavigate,
}: LightboxModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentIndex < mediaList.length - 1) {
        onNavigate(currentIndex + 1);
      }
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, mediaList.length, onClose, onNavigate]);

  if (!isOpen || mediaList.length === 0) return null;

  const currentMedia = mediaList[currentIndex] || mediaList[0];

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <div
        className="lightbox-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="lightbox-close"
          onClick={onClose}
          aria-label="Close Lightbox"
        >
          <X size={28} />
        </button>

        {mediaList.length > 1 && currentIndex > 0 && (
          <button
            style={{
              position: 'absolute',
              left: '-50px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#fff',
              background: 'rgba(0,0,0,0.6)',
              borderRadius: '50%',
              padding: '10px',
              cursor: 'pointer',
              zIndex: 10,
            }}
            onClick={() => onNavigate(currentIndex - 1)}
            aria-label="Previous Media"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {mediaList.length > 1 && currentIndex < mediaList.length - 1 && (
          <button
            style={{
              position: 'absolute',
              right: '-50px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#fff',
              background: 'rgba(0,0,0,0.6)',
              borderRadius: '50%',
              padding: '10px',
              cursor: 'pointer',
              zIndex: 10,
            }}
            onClick={() => onNavigate(currentIndex + 1)}
            aria-label="Next Media"
          >
            <ChevronRight size={28} />
          </button>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          {currentMedia.mediaType === 'VIDEO' ? (
            <video
              src={currentMedia.url}
              controls
              autoPlay
              playsInline
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              }}
            />
          ) : (
            <img
              src={currentMedia.url}
              alt={currentMedia.caption || 'Community Media'}
              className="lightbox-img"
            />
          )}
        </div>

        {currentMedia.caption && (
          <p
            style={{
              color: '#f8fafc',
              marginTop: '16px',
              fontSize: '0.95rem',
              textAlign: 'center',
              maxWidth: '600px',
            }}
          >
            {currentMedia.caption}
          </p>
        )}

        {mediaList.length > 1 && (
          <span
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              marginTop: '8px',
            }}
          >
            {currentIndex + 1} of {mediaList.length}
          </span>
        )}
      </div>
    </div>
  );
}
