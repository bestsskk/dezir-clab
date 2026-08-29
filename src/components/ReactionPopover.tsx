'use client';

import React from 'react';

export interface ReactionTypeOption {
  type: string;
  emoji: string;
  label: string;
}

export const REACTION_OPTIONS: ReactionTypeOption[] = [
  { type: 'LOVE', emoji: '❤️', label: 'Love' },
  { type: 'FIRE', emoji: '🔥', label: 'Fire' },
  { type: 'WOW', emoji: '😍', label: 'Wow' },
  { type: 'LIKE', emoji: '👍', label: 'Like' },
];

interface ReactionPopoverProps {
  onSelect: (type: string) => void;
  onClose: () => void;
}

export default function ReactionPopover({ onSelect, onClose }: ReactionPopoverProps) {
  return (
    <div className="reaction-popover" onMouseLeave={onClose}>
      {REACTION_OPTIONS.map((r) => (
        <button
          key={r.type}
          className="reaction-emoji-btn"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(r.type);
          }}
          title={r.label}
          aria-label={r.label}
        >
          {r.emoji}
        </button>
      ))}
    </div>
  );
}
