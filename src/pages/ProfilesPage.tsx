import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ExternalLink, Sparkles, MapPin, Grid, ShieldCheck, Loader2 } from 'lucide-react';
import ServerBusyModal from '@/components/ServerBusyModal';

interface ManagedProfileCard {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string;
  bio: string;
  age: number | null;
  location: string | null;
  isFeatured: boolean;
  postCount: number;
}

export default function ProfilesDiscoveryPage() {
  const [profiles, setProfiles] = useState<ManagedProfileCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyModalOpen, setBusyModalOpen] = useState(false);
  const [selectedProfileName, setSelectedProfileName] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profiles');
      if (res.ok) {
        const data = await res.json();
        setProfiles(data.profiles || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartMessage = (profileName: string) => {
    setSelectedProfileName(profileName);
    setBusyModalOpen(true);
  };

  return (
    <div>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={32} className="animate-spin" color="var(--primary-light)" />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {profiles.map((p) => (
            <div
              key={p.id}
              className="glass-card"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.25s ease',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                  }}
                >
                  <img
                    src={p.avatarUrl}
                    alt={p.name}
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--border-highlight)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  />
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                    {p.postCount} Posts
                  </span>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <Link
                    href={`/profile/${p.slug}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      marginBottom: '4px',
                      textDecoration: 'none',
                    }}
                  >
                    <span>{p.name}</span>
                    <ShieldCheck size={16} color="var(--primary-light)" />
                  </Link>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {p.location && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <MapPin size={12} /> {p.location}
                      </span>
                    )}
                    {p.age && <span>• {p.age} years old</span>}
                  </div>
                </div>

                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.55,
                    marginBottom: '20px',
                  }}
                >
                  {p.bio}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
                <Link
                  href={`/profile/${p.slug}`}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', gap: '4px', fontSize: '0.8rem', justifyContent: 'center' }}
                >
                  <span>See in Community</span>
                </Link>
                <button
                  type="button"
                  onClick={() => handleStartMessage(p.name)}
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', gap: '4px', fontSize: '0.8rem', justifyContent: 'center' }}
                >
                  <MessageSquare size={13} />
                  <span>DM</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* High-Converting VIP Concierge Modal */}
      <ServerBusyModal
        isOpen={busyModalOpen}
        onClose={() => setBusyModalOpen(false)}
        profileName={selectedProfileName}
      />
    </div>
  );
}
