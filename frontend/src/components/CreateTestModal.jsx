import React, { useState } from 'react';
import { testApi } from '../api/testApi';
import CandidatePicker from './CandidatePicker';
import QuestionBuilder from './QuestionBuilder';

export default function CreateTestModal({ categories, onClose, onCreated }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [passingMarks, setPassingMarks] = useState(5);
  const [difficulty, setDifficulty] = useState('MEDIUM');

  // Test Access & User Assignment
  const [isAllUsers, setIsAllUsers] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Dynamic Questions
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Test title is required');
      return;
    }

    if (!isAllUsers && selectedUserIds.length === 0) {
      setError('Please select at least one student, or select "All Users".');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText.trim()) {
        setError(`Question ${i + 1} prompt is empty`);
        return;
      }
      for (let j = 0; j < questions[i].options.length; j++) {
        if (!questions[i].options[j].optionText.trim()) {
          setError(`Question ${i + 1}, Option ${questions[i].options[j].optionKey} text is empty`);
          return;
        }
      }
    }

    setLoading(true);
    setError('');

    try {
      await testApi.createTest({
        categoryId: Number(categoryId),
        title: title.trim(),
        description: description.trim(),
        durationMinutes: Number(durationMinutes),
        passingMarks: Number(passingMarks),
        difficulty,
        accessType: isAllUsers ? 'COMMON' : 'ASSIGNED',
        assignedUserIds: isAllUsers ? [] : selectedUserIds,
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
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content create-test-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">➕</span>
            <div>
              <h2 className="modal-title">Create New Mock Test</h2>
              <p className="modal-subtitle">
                Configure test parameters, select candidate visibility, and define questions
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

        <form onSubmit={handleSubmit} className="create-test-form">
          {/* Section 1: Basic Parameters */}
          <div className="form-section-box">
            <h4 className="section-title">1. Basic Test Details</h4>
            
            <div className="form-grid-2">
              <div className="form-group">
                <label>Category</label>
                <select
                  className="form-control"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Difficulty</label>
                <select
                  className="form-control"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Test Title</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Microservices & Distributed Systems Essentials"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Description / Syllabus</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Brief summary of test topics..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Duration (Minutes)</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="180"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Passing Marks</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="500"
                  value={passingMarks}
                  onChange={(e) => setPassingMarks(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Candidate Enrollment & Access */}
          <div className="form-section-box">
            <h4 className="section-title">2. Candidate Enrollment & Access</h4>
            <p className="form-section-desc">
              Select <strong>All Users</strong> for an open test, or pick specific candidates to assign this test exclusively.
            </p>
            <CandidatePicker
              isAllUsers={isAllUsers}
              selectedUserIds={selectedUserIds}
              onChange={({ isAllUsers: all, selectedUserIds: ids }) => {
                setIsAllUsers(all);
                setSelectedUserIds(ids);
              }}
            />
          </div>

          {/* Section 3: Questions & Answers */}
          <div className="form-section-box">
            <h4 className="section-title">3. Test Questions</h4>
            <QuestionBuilder
              questions={questions}
              onQuestionsChange={setQuestions}
            />
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button id="btn-cancel-create" type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              id="btn-publish-test"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ minWidth: '150px' }}
            >
              {loading ? 'Creating Test...' : 'Publish Mock Test 🚀'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
