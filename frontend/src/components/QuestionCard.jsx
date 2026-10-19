import React from 'react';

export default function QuestionCard({
  question,
  currentIndex,
  totalQuestions,
  selectedOptionId,
  isFlagged,
  onSelectOption,
  onClearOption,
  onToggleFlag,
  onPrev,
  onNext,
  isFirst,
  isLast,
  onSubmitPrompt,
}) {
  if (!question) return null;

  return (
    <div className="glass question-panel">
      <div>
        <div className="q-top-bar">
          <div className="q-num-tag">
            QUESTION {currentIndex + 1} OF {totalQuestions}
          </div>
          <div className="q-top-actions">
            <span className="q-marks-tag">+{question.marks} Mark(s)</span>
            <button
              className={`btn btn-outline flag-btn ${isFlagged ? 'active' : ''}`}
              onClick={onToggleFlag}
              title="Flag this question to review later"
            >
              🚩 <span className="flag-btn-text">{isFlagged ? 'Marked for Review' : 'Mark for Review'}</span>
            </button>
          </div>
        </div>

        <h2 className="question-text">{question.questionText}</h2>

        <div className="options-list">
          {question.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            return (
              <div
                key={opt.id}
                className={`option-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectOption(opt.id)}
              >
                <div className="option-key">{opt.optionKey}</div>
                <div className="option-text">{opt.optionText}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="q-actions">
        <div className="clear-btn-wrap">
          {selectedOptionId && (
            <button
              className="btn btn-outline clear-btn"
              onClick={onClearOption}
            >
              ✕ Clear Response
            </button>
          )}
        </div>

        <div className="nav-buttons">
          <button
            className="btn btn-secondary nav-action-btn"
            onClick={onPrev}
            disabled={isFirst}
            style={{ opacity: isFirst ? 0.5 : 1, cursor: isFirst ? 'not-allowed' : 'pointer' }}
          >
            ← Previous
          </button>

          {!isLast ? (
            <button className="btn btn-primary nav-action-btn" onClick={onNext}>
              Next →
            </button>
          ) : (
            <button className="btn btn-success nav-action-btn" onClick={onSubmitPrompt}>
              Finish & Review ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
