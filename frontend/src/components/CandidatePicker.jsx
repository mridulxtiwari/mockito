import React, { useState, useEffect } from 'react';
import { testApi } from '../api/testApi';

export default function CandidatePicker({
  isAllUsers = true,
  selectedUserIds = [],
  onChange,
}) {
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    testApi
      .getUsers()
      .then((users) => {
        if (isMounted) setAvailableUsers(users || []);
      })
      .catch((err) => {
        if (isMounted) setFetchError('Failed to load candidate list: ' + err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectAllUsersOption = () => {
    if (onChange) {
      onChange({ isAllUsers: true, selectedUserIds: [] });
    }
  };

  const handleToggleCandidate = (userId) => {
    if (!onChange) return;

    if (isAllUsers) {
      // Switch from "All Users" to this specific candidate
      onChange({ isAllUsers: false, selectedUserIds: [userId] });
    } else {
      const exists = selectedUserIds.includes(userId);
      const updated = exists
        ? selectedUserIds.filter((id) => id !== userId)
        : [...selectedUserIds, userId];
      onChange({ isAllUsers: false, selectedUserIds: updated });
    }
  };

  const handleSelectAllStudents = () => {
    const studentIds = availableUsers
      .filter((u) => u.role !== 'ROLE_ADMIN' && u.role !== 'ADMIN')
      .map((u) => u.id);
    if (onChange) {
      onChange({ isAllUsers: false, selectedUserIds: studentIds });
    }
  };

  const handleClearSelection = () => {
    if (onChange) {
      onChange({ isAllUsers: false, selectedUserIds: [] });
    }
  };

  const filteredUsers = availableUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="candidate-picker-box">
      <div className="picker-header">
        <div className="picker-title-wrap">
          <span className="picker-badge">
            {isAllUsers ? '🌐 OPEN TO ALL' : '🎯 TARGETED ENROLLMENT'}
          </span>
          <span className="picker-count">
            {isAllUsers ? (
              <strong>All registered & future students</strong>
            ) : (
              <span>
                <strong>{selectedUserIds.length}</strong> candidate(s) selected
              </span>
            )}
          </span>
        </div>
        <div className="picker-quick-actions">
          <button
            type="button"
            className={`btn-picker-action ${isAllUsers ? 'btn-picker-active' : ''}`}
            onClick={handleSelectAllUsersOption}
          >
            🌐 All Users
          </button>
          <button
            type="button"
            className="btn-picker-action"
            onClick={handleSelectAllStudents}
          >
            Select All Specific
          </button>
          {!isAllUsers && selectedUserIds.length > 0 && (
            <button
              type="button"
              className="btn-picker-action btn-clear"
              onClick={handleClearSelection}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Search Filter */}
      <div className="picker-search-wrap">
        <input
          type="text"
          className="picker-search-input"
          placeholder="🔍 Search candidate by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="picker-search-clear"
            onClick={() => setSearchQuery('')}
          >
            ✕
          </button>
        )}
      </div>

      {fetchError && <div className="picker-error">{fetchError}</div>}

      {/* Candidates List with "All Users" at top */}
      <div className="picker-list">
        {/* ALL USERS OPTION */}
        <div
          id="candidate-row-all"
          className={`candidate-row candidate-row-all ${isAllUsers ? 'selected' : ''}`}
          onClick={handleSelectAllUsersOption}
        >
          <div className="candidate-checkbox-wrap">
            <input
              id="checkbox-all-users"
              type="checkbox"
              checked={isAllUsers}
              onChange={handleSelectAllUsersOption}
              onClick={(e) => e.stopPropagation()}
              className="candidate-checkbox"
            />
            <div className="candidate-meta">
              <span className="candidate-name">🌐 All Users (Public / Open to All)</span>
              <span className="candidate-email">
                Visible to every candidate and new registrations
              </span>
            </div>
          </div>
          <span className="candidate-role-pill role-all">ALL CANDIDATES</span>
        </div>

        {/* INDIVIDUAL USERS */}
        {loading ? (
          <div className="picker-loading">Loading registered candidates...</div>
        ) : filteredUsers.length === 0 ? (
          searchQuery ? (
            <div className="picker-empty">No candidates found matching "{searchQuery}"</div>
          ) : null
        ) : (
          filteredUsers.map((u) => {
            const isSelected = !isAllUsers && selectedUserIds.includes(u.id);
            const isStudent = u.role !== 'ROLE_ADMIN' && u.role !== 'ADMIN';

            return (
              <div
                key={u.id}
                id={`candidate-row-${u.id}`}
                className={`candidate-row ${isSelected ? 'selected' : ''}`}
                onClick={() => handleToggleCandidate(u.id)}
              >
                <div className="candidate-checkbox-wrap">
                  <input
                    id={`checkbox-user-${u.id}`}
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleCandidate(u.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="candidate-checkbox"
                  />
                  <div className="candidate-meta">
                    <span className="candidate-name">{u.fullName}</span>
                    <span className="candidate-email">{u.email}</span>
                  </div>
                </div>
                <span className={`candidate-role-pill ${isStudent ? 'role-student' : 'role-admin'}`}>
                  {isStudent ? 'STUDENT' : 'ADMIN'}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
