import React, { useState } from 'react';

export default function ResultPage({ result, onRetake, onBackToHome }) {
  const [filter, setFilter] = useState('ALL'); // ALL, CORRECT, INCORRECT, SKIPPED

  if (!result) return null;

  const {
    testTitle,
    candidateName,
    score,
    percentage,
    totalMarks,
    passingMarks,
    passed,
    totalQuestions,
    correctAnswers,
    wrongAnswers,
    unattempted,
    accuracy,
    timeTakenSeconds,
    status,
    review = [],
  } = result;

  const minutesTaken = Math.floor(timeTakenSeconds / 60);
  const secondsRem = timeTakenSeconds % 60;
  const timeTakenFormatted = `${minutesTaken}m ${secondsRem}s`;

  const filteredReview = review.filter((item) => {
    if (filter === 'CORRECT') return item.isCorrect;
    if (filter === 'INCORRECT') return item.isAttempted && !item.isCorrect;
    if (filter === 'SKIPPED') return !item.isAttempted;
    return true;
  });

  return (
    <div className="result-container">
      {/* Hero Performance Card */}
      <div
        className="glass result-card-banner"
        style={{
          borderColor: passed ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
          boxShadow: passed
            ? '0 0 40px rgba(16, 185, 129, 0.15)'
            : '0 0 40px rgba(239, 68, 68, 0.15)',
        }}
      >
        <span
          className="test-badge"
          style={{
            fontSize: '0.9rem',
            padding: '6px 16px',
            marginBottom: '16px',
            display: 'inline-block',
            background: passed ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: passed ? '#34d399' : '#f87171',
            border: `1.5px solid ${passed ? 'var(--success)' : 'var(--danger)'}`,
          }}
        >
          {passed ? '🎉 PASSED' : '❌ NEEDS IMPROVEMENT'}
        </span>

        <h1 className="result-title">
          {passed ? 'Congratulations, ' : 'Good Effort, '}
          {candidateName}!
        </h1>
        <p className="result-subtitle">
          Assessment Report for <strong>{testTitle}</strong>
          {status === 'TIMED_OUT' && ' (Auto-submitted upon timer expiration)'}
        </p>

        {/* Circular Score Gauge */}
        <div
          className="score-circle"
          style={{
            borderColor: passed ? 'var(--success)' : 'var(--danger)',
            boxShadow: passed
              ? '0 0 30px rgba(16, 185, 129, 0.3)'
              : '0 0 30px rgba(239, 68, 68, 0.3)',
          }}
        >
          <div className="score-num" style={{ color: passed ? '#34d399' : '#f87171' }}>
            {score}
          </div>
          <div className="score-label">out of {totalMarks} pts</div>
        </div>

        <p className="score-percentage-text">
          Overall Score: <span style={{ color: '#38bdf8' }}>{percentage}%</span>
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Required Passing Score: {passingMarks} pts
        </p>
      </div>

      {/* Summary KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-val" style={{ color: '#34d399' }}>
            {correctAnswers}
          </div>
          <div className="stat-desc">Correct Answers</div>
        </div>

        <div className="stat-box">
          <div className="stat-val" style={{ color: '#f87171' }}>
            {wrongAnswers}
          </div>
          <div className="stat-desc">Incorrect Answers</div>
        </div>

        <div className="stat-box">
          <div className="stat-val" style={{ color: '#94a3b8' }}>
            {unattempted}
          </div>
          <div className="stat-desc">Unattempted</div>
        </div>

        <div className="stat-box">
          <div className="stat-val" style={{ color: '#38bdf8' }}>
            {accuracy}%
          </div>
          <div className="stat-desc">Accuracy Rate</div>
        </div>

        <div className="stat-box stat-box-full-mobile">
          <div className="stat-val" style={{ color: '#fbbf24' }}>
            {timeTakenFormatted}
          </div>
          <div className="stat-desc">Time Taken</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="result-action-buttons">
        <button className="btn btn-secondary result-btn" onClick={onBackToHome}>
          ← Back to All Tests
        </button>
        <button className="btn btn-primary result-btn" onClick={onRetake}>
          🔄 Retake Test
        </button>
      </div>

      {/* Detailed Question Review Section */}
      <section style={{ marginTop: '30px' }}>
        <div className="review-header-wrap">
          <h2 style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 700 }}>
            In-Depth Solutions & Explanations
          </h2>

          {/* Filter Tabs */}
          <div className="review-filter-tabs">
            <button
              className={`chip ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              All ({review.length})
            </button>
            <button
              className={`chip ${filter === 'CORRECT' ? 'active' : ''}`}
              onClick={() => setFilter('CORRECT')}
            >
              Correct ({correctAnswers})
            </button>
            <button
              className={`chip ${filter === 'INCORRECT' ? 'active' : ''}`}
              onClick={() => setFilter('INCORRECT')}
            >
              Incorrect ({wrongAnswers})
            </button>
            <button
              className={`chip ${filter === 'SKIPPED' ? 'active' : ''}`}
              onClick={() => setFilter('SKIPPED')}
            >
              Skipped ({unattempted})
            </button>
          </div>
        </div>

        {/* Review Cards */}
        {filteredReview.map((item, index) => {
          const statusClass = item.isCorrect
            ? 'correct'
            : item.isAttempted
            ? 'incorrect'
            : 'unanswered';

          return (
            <div key={item.questionId} className={`review-item ${statusClass}`}>
              <div className="review-top-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      color: item.isCorrect ? '#34d399' : item.isAttempted ? '#f87171' : '#94a3b8',
                    }}
                  >
                    {item.isCorrect ? '✓ Correct' : item.isAttempted ? '✕ Incorrect' : '⚪ Unanswered'}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                    • Q{item.orderIndex || index + 1}
                  </span>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  Marks: {item.isCorrect ? `+${item.marks}` : item.isAttempted ? '-0.25' : '0'}
                </span>
              </div>

              <h3 className="review-question-text">
                {item.questionText}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {item.options.map((opt) => {
                  let optClass = 'review-option';
                  let statusBadge = null;

                  if (opt.isCorrect) {
                    optClass += ' is-correct';
                    statusBadge = (
                      <span className="review-status-badge badge-correct">
                        ✓ Correct
                      </span>
                    );
                  } else if (opt.isSelected && !opt.isCorrect) {
                    optClass += ' user-wrong';
                    statusBadge = (
                      <span className="review-status-badge badge-wrong">
                        ✕ Your Pick
                      </span>
                    );
                  }

                  return (
                    <div key={opt.id} className={optClass}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <span style={{ fontWeight: 700, minWidth: '20px' }}>{opt.optionKey}.</span>
                        <span style={{ flexGrow: 1 }}>{opt.optionText}</span>
                      </div>
                      {statusBadge}
                    </div>
                  );
                })}
              </div>

              {item.explanation && (
                <div className="review-explanation">
                  <strong>💡 Concept & Solution Explanation:</strong>
                  {item.explanation}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
