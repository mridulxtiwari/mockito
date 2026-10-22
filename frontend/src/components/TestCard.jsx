import React from 'react';

export default function TestCard({
  test,
  isAdmin,
  onStartTest,
  onDeleteTest,
  onManageEnrollment,
  isDeleting,
}) {
  const diffClass =
    test.difficulty === 'EASY'
      ? 'badge-easy'
      : test.difficulty === 'HARD'
      ? 'badge-hard'
      : 'badge-medium';

  const enrolledCount =
    test.accessType === 'COMMON' ? 'All' : test.assignedUserCount || 0;

  return (
    <div className="glass test-card">
      <div className="test-card-body">
        {/* Top bar with category & difficulty */}
        <div className="test-card-top">
          <span className="test-category-tag">{test.categoryName}</span>
          <span className={`test-badge ${diffClass}`}>
            {test.difficulty || 'MEDIUM'}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="test-title">{test.title}</h3>
        <p className="test-desc">{test.description || 'Standard technical assessment exam.'}</p>
      </div>

      {/* Footer Meta & Actions */}
      <div className="test-card-footer">
        <div className="test-meta">
          <div className="meta-item">
            <span>⏱️</span>
            <span><strong>{test.durationMinutes}</strong> mins</span>
          </div>
          <div className="meta-item">
            <span>❓</span>
            <span><strong>{test.totalQuestions}</strong> questions</span>
          </div>
          <div className="meta-item">
            <span>🎯</span>
            <span>Pass: <strong>{test.passingMarks}/{test.totalMarks}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        {isAdmin ? (
          <div className="test-card-admin-actions">
            <button
              id={`btn-preview-test-${test.id}`}
              type="button"
              className="btn btn-primary btn-action-preview"
              onClick={() => onStartTest(test.id)}
              title="Launch test preview"
            >
              Preview / Launch 🚀
            </button>
            <div className="test-card-admin-subactions">
              <button
                id={`btn-enrolled-test-${test.id}`}
                type="button"
                className="btn btn-secondary btn-action-enrolled"
                onClick={() => onManageEnrollment && onManageEnrollment(test)}
                title="Manage student enrollment"
              >
                👥 Enrolled ({enrolledCount})
              </button>
              <button
                id={`btn-delete-test-${test.id}`}
                type="button"
                className="btn btn-action-delete"
                onClick={() => onDeleteTest(test.id, test.title)}
                disabled={isDeleting}
                title="Delete this test"
                aria-label={`Delete ${test.title}`}
              >
                {isDeleting ? '⏳' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        ) : (
          <button
            id={`btn-start-test-${test.id}`}
            type="button"
            className="btn btn-primary btn-start-test"
            onClick={() => onStartTest(test.id)}
          >
            Start Mock Test 🚀
          </button>
        )}
      </div>
    </div>
  );
}
