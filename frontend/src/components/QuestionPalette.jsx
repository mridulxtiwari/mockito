import React from 'react';

export default function QuestionPalette({
  questions,
  currentIndex,
  answers,
  flaggedIds,
  onSelectIndex,
  onSubmitPrompt,
  isMobileDrawer = false,
  onCloseDrawer,
}) {
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = flaggedIds.size;
  const total = questions.length;
  const unvisitedCount = Math.max(0, total - answeredCount);

  const handleTileClick = (idx) => {
    onSelectIndex(idx);
    if (isMobileDrawer && onCloseDrawer) {
      onCloseDrawer();
    }
  };

  const content = (
    <div className={`palette-content ${isMobileDrawer ? 'mobile-drawer-content' : ''}`}>
      {isMobileDrawer && (
        <div className="drawer-handle-bar" onClick={onCloseDrawer}>
          <div className="drawer-handle" />
        </div>
      )}

      <div className="palette-header">
        <h4>{isMobileDrawer ? `Questions (${answeredCount}/${total})` : 'Question Palette'}</h4>
        {isMobileDrawer && (
          <button className="btn btn-outline drawer-close-btn" onClick={onCloseDrawer}>
            ✕
          </button>
        )}
      </div>

      <div className="palette-grid">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = answers[q.id] !== undefined;
          const isFlagged = flaggedIds.has(q.id);

          let className = 'palette-btn';
          if (isCurrent) className += ' current';
          if (isAnswered) className += ' answered';
          if (isFlagged) className += ' flagged';

          return (
            <button
              key={q.id}
              className={className}
              onClick={() => handleTileClick(idx)}
              title={`Question ${idx + 1}`}
            >
              {idx + 1}
              {isFlagged && <span style={{ fontSize: '0.65rem', marginLeft: '1px' }}>*</span>}
            </button>
          );
        })}
      </div>

      <div className="palette-legend">
        <div className="legend-item">
          <span className="legend-indicator legend-answered"></span>
          <span>Answered ({answeredCount})</span>
        </div>
        <div className="legend-item">
          <span className="legend-indicator legend-flagged"></span>
          <span>Marked Review ({flaggedCount})</span>
        </div>
        <div className="legend-item">
          <span className="legend-indicator legend-current"></span>
          <span>Current Viewing</span>
        </div>
        <div className="legend-item">
          <span className="legend-indicator legend-unvisited"></span>
          <span>Unanswered ({unvisitedCount})</span>
        </div>
      </div>

      <button
        className="btn btn-success"
        style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
        onClick={() => {
          if (isMobileDrawer && onCloseDrawer) onCloseDrawer();
          onSubmitPrompt();
        }}
      >
        Submit Exam 📝
      </button>
    </div>
  );

  if (isMobileDrawer) {
    return (
      <div className="mobile-palette-overlay" onClick={onCloseDrawer}>
        <div className="mobile-palette-sheet" onClick={(e) => e.stopPropagation()}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <aside className="glass palette-card desktop-palette">
      {content}
    </aside>
  );
}
