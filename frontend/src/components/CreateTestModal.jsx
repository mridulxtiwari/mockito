import React, { useState } from 'react';
import { testApi } from '../api/testApi';

export default function CreateTestModal({ categories, onClose, onCreated }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [passingMarks, setPassingMarks] = useState(5);
  const [difficulty, setDifficulty] = useState('MEDIUM');
  
  // Dynamic question builder
  const [questions, setQuestions] = useState([
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addQuestion = () => {
    setQuestions([
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

  const updateQuestionText = (index, text) => {
    const updated = [...questions];
    updated[index].questionText = text;
    setQuestions(updated);
  };

  const updateExplanation = (index, text) => {
    const updated = [...questions];
    updated[index].explanation = text;
    setQuestions(updated);
  };

  const updateOptionText = (qIndex, optIndex, text) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex].optionText = text;
    setQuestions(updated);
  };

  const setCorrectOption = (qIndex, optIndex) => {
    const updated = [...questions];
    updated[qIndex].options = updated[qIndex].options.map((opt, i) => ({
      ...opt,
      isCorrect: i === optIndex,
    }));
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Test title is required');
      return;
    }

    // Validate that questions have texts and options
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText.trim()) {
        setError(`Question ${i + 1} text is empty`);
        return;
      }
      for (let j = 0; j < questions[i].options.length; j++) {
        if (!questions[i].options[j].optionText.trim()) {
          setError(`Question ${i + 1}, Option ${questions[i].options[j].optionKey} is empty`);
          return;
        }
      }
    }

    setLoading(true);
    setError('');

    try {
      await testApi.createTest({
        categoryId: Number(categoryId),
        title,
        description,
        durationMinutes: Number(durationMinutes),
        passingMarks: Number(passingMarks),
        difficulty,
        questions,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.4rem', color: '#fff' }}>Create New Mock Test</h3>
          <button className="btn btn-outline" style={{ padding: '4px 10px' }} onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: '#f87171', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.9rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', background: '#1e293b', border: '1px solid var(--border-color)', color: '#fff' }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Test Title</label>
            <input
              type="text"
              placeholder="e.g. Microservices & Distributed Systems Test"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', background: '#1e293b', border: '1px solid var(--border-color)', color: '#fff' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Description</label>
            <textarea
              placeholder="Brief description of the test syllabus..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="2"
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', background: '#1e293b', border: '1px solid var(--border-color)', color: '#fff', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Duration (Mins)</label>
              <input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', background: '#1e293b', border: '1px solid var(--border-color)', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Passing Marks</label>
              <input
                type="number"
                min="1"
                value={passingMarks}
                onChange={(e) => setPassingMarks(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', background: '#1e293b', border: '1px solid var(--border-color)', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', background: '#1e293b', border: '1px solid var(--border-color)', color: '#fff' }}
              >
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '1.1rem', color: '#fff' }}>Questions ({questions.length})</h4>
              <button type="button" className="btn btn-outline" style={{ fontSize: '0.82rem', padding: '6px 12px' }} onClick={addQuestion}>
                ➕ Add Question
              </button>
            </div>

            {questions.map((q, qIdx) => (
              <div
                key={qIdx}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 700, color: '#38bdf8' }}>Question {qIdx + 1}</span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.85rem' }}
                      onClick={() => removeQuestion(qIdx)}
                    >
                      Delete
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Enter question statement..."
                  value={q.questionText}
                  onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', background: '#1e293b', border: '1px solid var(--border-color)', color: '#fff', marginBottom: '12px' }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {q.options.map((opt, optIdx) => (
                    <div key={opt.optionKey} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="radio"
                        name={`correct_opt_${qIdx}`}
                        checked={opt.isCorrect}
                        onChange={() => setCorrectOption(qIdx, optIdx)}
                        title="Mark as correct answer"
                        style={{ cursor: 'pointer', accentColor: '#10b981' }}
                      />
                      <span style={{ fontWeight: 700, minWidth: '20px', color: opt.isCorrect ? '#34d399' : 'var(--text-muted)' }}>
                        {opt.optionKey}:
                      </span>
                      <input
                        type="text"
                        placeholder={`Option ${opt.optionKey} text`}
                        value={opt.optionText}
                        onChange={(e) => updateOptionText(qIdx, optIdx, e.target.value)}
                        style={{
                          flexGrow: 1,
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: '#1e293b',
                          border: opt.isCorrect ? '1.5px solid var(--success)' : '1px solid var(--border-color)',
                          color: '#fff',
                        }}
                      />
                    </div>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Explanation / Solution rationale (optional)..."
                  value={q.explanation}
                  onChange={(e) => updateExplanation(qIdx, e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: '#1e293b', border: '1px solid var(--border-color)', color: '#94a3b8', fontSize: '0.85rem' }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Mock Test 🚀'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
