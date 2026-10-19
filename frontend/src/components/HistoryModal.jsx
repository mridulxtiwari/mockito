import React, { useEffect, useState } from 'react';
import { testApi } from '../api/testApi';

export default function HistoryModal({ onClose, onViewAttempt }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testApi
      .getAttemptHistory()
      .then((data) => setHistory(data || []))
      .catch((err) => console.error('Failed to load history', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '640px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.4rem', color: '#fff' }}>Past Test Attempts</h3>
          <button className="btn btn-outline" style={{ padding: '4px 10px' }} onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Loading history...</p>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No attempts recorded yet!</p>
            <p style={{ fontSize: '0.85rem' }}>Take any mock test to see your scorecards and performance history here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.map((att) => (
              <div
                key={att.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', marginBottom: '4px' }}>
                    {att.test?.title || 'Mock Test'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Candidate: <strong style={{ color: '#cbd5e1' }}>{att.candidateName}</strong> • {new Date(att.submittedAt).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: att.passed ? '#34d399' : '#f87171' }}>
                      {att.score} pts ({att.percentage}%)
                    </div>
                    <span
                      className="test-badge"
                      style={{
                        background: att.passed ? 'var(--success-bg)' : 'var(--danger-bg)',
                        color: att.passed ? '#34d399' : '#f87171',
                        border: `1px solid ${att.passed ? 'var(--success-border)' : 'var(--danger-border)'}`,
                      }}
                    >
                      {att.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>

                  <button
                    className="btn btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                    onClick={() => {
                      onViewAttempt(att.id);
                      onClose();
                    }}
                  >
                    Review 🔍
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
