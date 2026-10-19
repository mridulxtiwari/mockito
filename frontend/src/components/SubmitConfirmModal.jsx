import React from 'react';

export default function SubmitConfirmModal({
  totalQuestions,
  answeredCount,
  flaggedCount,
  candidateName,
  onCandidateNameChange,
  onConfirm,
  onCancel,
  isSubmitting,
}) {
  const unattempted = Math.max(0, totalQuestions - answeredCount);

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3 style={{ fontSize: '1.4rem', marginBottom: '12px', color: '#fff' }}>
          Confirm Test Submission
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '20px' }}>
          Are you sure you want to finish your mock test? Here is your current attempt summary:
        </p>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Questions:</span>
            <strong style={{ color: '#fff' }}>{totalQuestions}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Answered:</span>
            <strong style={{ color: '#34d399' }}>{answeredCount}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Marked for Review:</span>
            <strong style={{ color: '#fbbf24' }}>{flaggedCount}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Unanswered:</span>
            <strong style={{ color: unattempted > 0 ? '#f87171' : 'var(--text-muted)' }}>
              {unattempted}
            </strong>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              marginBottom: '6px',
            }}
          >
            Candidate Name (Optional):
          </label>
          <input
            type="text"
            placeholder="e.g. Alex Johnson"
            value={candidateName}
            onChange={(e) => onCandidateNameChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-color)',
              color: '#fff',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
            Continue Test
          </button>
          <button className="btn btn-success" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Yes, Submit Test'}
          </button>
        </div>
      </div>
    </div>
  );
}
