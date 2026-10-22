import React from 'react';

export default function QuestionBuilder({ questions, onQuestionsChange }) {
  const addQuestion = () => {
    onQuestionsChange([
      ...questions,
      {
        questionText: '',
        explanation: '',
        marks: 1,
        options: [
          { optionKey: 'A', optionText: '', isCorrect: true },
          { optionKey: 'B', optionText: '', isCorrect: false },
          { optionKey: 'C', optionText: '', isCorrect: false },
          { optionKey: 'D', optionText: '', isCorrect: false },
        ],
      },
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) return;
    onQuestionsChange(questions.filter((_, i) => i !== index));
  };

  const updateQuestionText = (index, text) => {
    const updated = [...questions];
    updated[index].questionText = text;
    onQuestionsChange(updated);
  };

  const updateExplanation = (index, text) => {
    const updated = [...questions];
    updated[index].explanation = text;
    onQuestionsChange(updated);
  };

  const updateOptionText = (qIndex, optIndex, text) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex].optionText = text;
    onQuestionsChange(updated);
  };

  const setCorrectOption = (qIndex, optIndex) => {
    const updated = [...questions];
    updated[qIndex].options = updated[qIndex].options.map((opt, i) => ({
      ...opt,
      isCorrect: i === optIndex,
    }));
    onQuestionsChange(updated);
  };

  return (
    <div className="question-builder-container">
      <div className="builder-header">
        <div>
          <h4 className="builder-title">Questions & Answers</h4>
          <p className="builder-subtitle">Define assessment questions, 4 options, and mark the correct answer</p>
        </div>
        <button
          type="button"
          className="btn btn-outline btn-add-q"
          onClick={addQuestion}
        >
          ➕ Add Question ({questions.length})
        </button>
      </div>

      <div className="questions-stack">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="question-editor-card">
            <div className="q-card-top">
              <span className="q-index-badge">Question {qIndex + 1}</span>
              {questions.length > 1 && (
                <button
                  type="button"
                  className="btn-remove-q"
                  onClick={() => removeQuestion(qIndex)}
                  title="Remove this question"
                >
                  ✕ Remove
                </button>
              )}
            </div>

            {/* Question Text */}
            <div className="form-group">
              <label>Question Prompt</label>
              <textarea
                className="form-control q-textarea"
                rows="2"
                placeholder="Enter the question text here..."
                value={q.questionText}
                onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                required
              />
            </div>

            {/* Options */}
            <div className="options-editor-section">
              <label className="options-section-label">Options (Select radio for correct answer):</label>
              <div className="options-editor-grid">
                {q.options.map((opt, optIndex) => (
                  <div
                    key={opt.optionKey}
                    className={`option-editor-row ${opt.isCorrect ? 'correct-choice' : ''}`}
                  >
                    <label className="option-radio-wrap" title="Mark as correct answer">
                      <input
                        type="radio"
                        name={`correct_opt_${qIndex}`}
                        checked={opt.isCorrect}
                        onChange={() => setCorrectOption(qIndex, optIndex)}
                      />
                      <span className="option-key-label">{opt.optionKey}</span>
                    </label>
                    <input
                      type="text"
                      className="form-control option-text-input"
                      placeholder={`Option ${opt.optionKey} text...`}
                      value={opt.optionText}
                      onChange={(e) => updateOptionText(qIndex, optIndex, e.target.value)}
                      required
                    />
                    {opt.isCorrect && (
                      <span className="correct-tag-badge">✓ Correct</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Explanation / Solution Note (Shown after submission):</label>
              <input
                type="text"
                className="form-control"
                placeholder="Why is this answer correct? (Optional)"
                value={q.explanation}
                onChange={(e) => updateExplanation(qIndex, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="btn btn-outline btn-add-q-bottom"
        onClick={addQuestion}
      >
        ➕ Add Another Question
      </button>
    </div>
  );
}
