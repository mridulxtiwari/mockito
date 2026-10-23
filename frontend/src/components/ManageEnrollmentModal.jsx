import React, { useState, useEffect } from 'react';
import { testApi } from '../api/testApi';
import CandidatePicker from './CandidatePicker';

export default function ManageEnrollmentModal({ test, onClose, onUpdated }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [isAllUsers, setIsAllUsers] = useState(test.accessType === 'COMMON');
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    testApi
      .getAssignedUsers(test.id)
      .then((users) => {
        if (!isMounted) return;
        const ids = (users || []).map((u) => u.id);
        setSelectedUserIds(ids);
        if (test.accessType === 'COMMON' || ids.length === 0) {
          setIsAllUsers(test.accessType === 'COMMON');
        } else {
          setIsAllUsers(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error fetching assigned users:', err);
          // Fall back gracefully
          setIsAllUsers(test.accessType === 'COMMON');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [test.id, test.accessType]);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!isAllUsers && selectedUserIds.length === 0) {
      setError('Please select at least one student, or select "All Users".');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      await testApi.updateEnrollment(test.id, {
        accessType: isAllUsers ? 'COMMON' : 'ASSIGNED',
        assignedUserIds: isAllUsers ? [] : selectedUserIds,
      });

      setSuccessMsg('Candidate enrollment updated successfully!');
      setTimeout(() => {
        if (onUpdated) onUpdated();
        onClose();
      }, 700);
    } catch (err) {
      setError(err.message || 'Failed to update enrollment');
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content manage-enrollment-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">👥</span>
            <div>
              <h2 className="modal-title">Manage Candidate Enrollment</h2>
              <p className="modal-subtitle">
                Test: <strong>{test.title}</strong>
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {error && (
          <div className="auth-error-banner" role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="enrollment-success-banner" role="alert">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="enrollment-form">
          <div className="enrollment-current-status">
            <span className="status-label">Current Configuration:</span>
            <span
              className={`status-pill ${
                isAllUsers ? 'status-pill-common' : 'status-pill-assigned'
              }`}
            >
              {isAllUsers
                ? '🌐 Open to All Candidates'
                : `🎯 Assigned to ${selectedUserIds.length} candidate(s)`}
            </span>
          </div>

          {loading ? (
            <div className="enrollment-loading">
              <span className="spinner">⏳</span> Loading current enrollment data...
            </div>
          ) : (
            <CandidatePicker
              isAllUsers={isAllUsers}
              selectedUserIds={selectedUserIds}
              onChange={({ isAllUsers: all, selectedUserIds: ids }) => {
                setIsAllUsers(all);
                setSelectedUserIds(ids);
                setError('');
              }}
            />
          )}

          <div className="modal-actions">
            <button
              id="btn-cancel-enrollment"
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              id="btn-save-enrollment"
              type="submit"
              className="btn btn-primary"
              disabled={saving || loading}
              style={{ minWidth: '150px' }}
            >
              {saving ? 'Saving Changes...' : 'Save Enrollment ✓'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
