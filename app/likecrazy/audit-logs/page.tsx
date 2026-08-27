'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { History, ShieldCheck, Loader2 } from 'lucide-react';

interface AuditLogItem {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: any;
  adminName: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Admin Security & Audit Trail</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Immutable log of administrative operations, moderation decisions, and security events.
        </p>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Action Type</th>
                <th>Operator</th>
                <th>Target Details</th>
                <th>IP & Client</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader2 size={28} className="animate-spin" color="var(--accent-gold)" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <span
                        className={`badge ${
                          l.action.includes('BANNED') || l.action.includes('DELETED')
                            ? 'badge-rose'
                            : l.action.includes('INVITATION') || l.action.includes('LOGIN')
                            ? 'badge-gold'
                            : 'badge-primary'
                        }`}
                        style={{ fontSize: '0.72rem' }}
                      >
                        {l.action}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.85rem' }}>
                        {l.adminName}
                      </div>
                    </td>

                    <td style={{ maxWidth: '300px' }}>
                      {l.targetType && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>
                          {l.targetType} {l.targetId ? `(${l.targetId})` : ''}
                        </div>
                      )}
                      {l.details && (
                        <pre
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-secondary)',
                            background: 'rgba(0,0,0,0.3)',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            overflowX: 'auto',
                            marginTop: '2px',
                          }}
                        >
                          {JSON.stringify(l.details)}
                        </pre>
                      )}
                    </td>

                    <td>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {l.ipAddress || '127.0.0.1'}
                      </div>
                    </td>

                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <div>{l.createdAt ? format(new Date(l.createdAt), 'MMM d, yyyy HH:mm') : ''}</div>
                      <div style={{ fontSize: '0.7rem' }}>
                        {l.createdAt ? formatDistanceToNow(new Date(l.createdAt), { addSuffix: true }) : ''}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
