import React, { useState, useEffect, useCallback, useRef } from 'react';
import { testApi } from '../api/testApi';
import ExamTimer from '../components/ExamTimer';
import QuestionCard from '../components/QuestionCard';
import QuestionPalette from '../components/QuestionPalette';
import SubmitConfirmModal from '../components/SubmitConfirmModal';

export default function ExamPage({ testId, onFinishExam, onCancelExam }) {
  const [examPaper, setExamPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flaggedIds, setFlaggedIds] = useState(new Set());
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);

  const initialDurationRef = useRef(0);
  const storageKey = `mock_exam_progress_${testId}`;

  // 1. Fetch test questions on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    testApi
      .startExam(testId)
      .then((paper) => {
        if (!isMounted) return;
        setExamPaper(paper);

        const totalSecs = (paper.durationMinutes || 10) * 60;
        initialDurationRef.current = totalSecs;

        // Check if there was saved state in localStorage
        try {
          const cached = localStorage.getItem(storageKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.answers) setAnswers(parsed.answers);
            if (parsed && parsed.flaggedIds) setFlaggedIds(new Set(parsed.flaggedIds));
            if (parsed && typeof parsed.secondsLeft === 'number' && parsed.secondsLeft > 0) {
              setSecondsLeft(parsed.secondsLeft);
            } else {
              setSecondsLeft(totalSecs);
            }
          } else {
            setSecondsLeft(totalSecs);
          }
        } catch {
          setSecondsLeft(totalSecs);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load exam paper');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [testId, storageKey]);

  // 2. Persist answers and timer to localStorage
  useEffect(() => {
    if (!examPaper) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          answers,
          flaggedIds: Array.from(flaggedIds),
          secondsLeft,
        })
      );
    } catch {
      // ignore storage errors
    }
  }, [answers, flaggedIds, secondsLeft, examPaper, storageKey]);

  // 3. Timer tick handler
  const handleTick = useCallback(() => {
    setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  // 4. Submit submission logic
  const executeSubmit = useCallback(
    async (timedOut = false) => {
      if (isSubmitting || !examPaper) return;
      setIsSubmitting(true);

      const timeTaken = initialDurationRef.current - secondsLeft;

      const payload = {
        testId: examPaper.testId,
        candidateName: candidateName.trim() || 'Guest Candidate',
        timeTakenSeconds: Math.max(0, timeTaken),
        timedOut,
        answers,
      };

      try {
        const result = await testApi.submitExam(payload);
        // Clear cached progress
        localStorage.removeItem(storageKey);
        onFinishExam(result);
      } catch (err) {
        alert('Submission failed: ' + err.message);
        setIsSubmitting(false);
      }
    },
    [isSubmitting, examPaper, secondsLeft, candidateName, answers, storageKey, onFinishExam]
  );

  // 5. Timer expired handler
  const handleExpire = useCallback(() => {
    alert('⏱️ Time has expired! Your exam will now be automatically submitted.');
    executeSubmit(true);
  }, [executeSubmit]);

  // Option select
  const handleSelectOption = (optionId) => {
    const currentQuestion = examPaper.questions[currentIndex];
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  // Option clear
  const handleClearOption = () => {
    const currentQuestion = examPaper.questions[currentIndex];
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQuestion.id];
      return copy;
    });
  };

  // Flag toggle
  const handleToggleFlag = () => {
    const currentQuestion = examPaper.questions[currentIndex];
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) {
        next.delete(currentQuestion.id);
      } else {
        next.add(currentQuestion.id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>📝</div>
        <h2>Preparing your exam paper...</h2>
      </div>
    );
  }

  if (error || !examPaper) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2 style={{ color: '#f87171', marginBottom: '16px' }}>⚠️ Error Loading Exam</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{error}</p>
        <button className="btn btn-secondary" onClick={onCancelExam}>
          Return to All Tests
        </button>
      </div>
    );
  }

  const currentQuestion = examPaper.questions[currentIndex];
  const selectedOptionId = currentQuestion ? answers[currentQuestion.id] : null;
  const isFlagged = currentQuestion ? flaggedIds.has(currentQuestion.id) : false;
  const answeredCount = Object.keys(answers).length;
  const totalCount = examPaper.questions.length;
  const progressPercent = Math.round((answeredCount / totalCount) * 100);

  return (
    <div className="exam-container">
      {/* Exam Header */}
      <div className="exam-header">
        <div className="exam-header-left">
          <span className="exam-category-tag">
            {examPaper.categoryName}
          </span>
          <h2 className="exam-title">
            {examPaper.testTitle}
          </h2>
        </div>

        <div className="exam-header-right">
          <ExamTimer
            secondsLeft={secondsLeft}
            onTick={handleTick}
            onExpire={handleExpire}
          />

          {/* Quick Mobile Palette Toggle Button */}
          <button
            className="btn btn-secondary mobile-palette-trigger"
            onClick={() => setIsMobilePaletteOpen(true)}
            title="Open Question Palette"
          >
            📋 <span className="mobile-palette-text">Grid ({answeredCount}/{totalCount})</span>
          </button>

          <button
            className="btn btn-outline exam-exit-btn"
            onClick={() => {
              if (window.confirm('Are you sure you want to exit the exam? Your progress will be saved.')) {
                onCancelExam();
              }
            }}
          >
            Exit
          </button>
        </div>
      </div>

      {/* Mini Progress Bar on Mobile & Desktop */}
      <div className="exam-progress-bar-wrap">
        <div className="exam-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Main Examination Layout */}
      <div className="exam-layout">
        <main className="exam-main">
          <QuestionCard
            question={currentQuestion}
            currentIndex={currentIndex}
            totalQuestions={examPaper.questions.length}
            selectedOptionId={selectedOptionId}
            isFlagged={isFlagged}
            onSelectOption={handleSelectOption}
            onClearOption={handleClearOption}
            onToggleFlag={handleToggleFlag}
            onPrev={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            onNext={() => setCurrentIndex((prev) => Math.min(examPaper.questions.length - 1, prev + 1))}
            isFirst={currentIndex === 0}
            isLast={currentIndex === examPaper.questions.length - 1}
            onSubmitPrompt={() => setShowSubmitModal(true)}
          />
        </main>

        {/* Desktop Sidebar Question Palette */}
        <div className="desktop-palette-wrapper">
          <QuestionPalette
            questions={examPaper.questions}
            currentIndex={currentIndex}
            answers={answers}
            flaggedIds={flaggedIds}
            onSelectIndex={(idx) => setCurrentIndex(idx)}
            onSubmitPrompt={() => setShowSubmitModal(true)}
          />
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <nav className="mobile-exam-bottom-bar">
        <button
          className="btn btn-secondary mobile-bar-btn"
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          style={{ opacity: currentIndex === 0 ? 0.4 : 1 }}
        >
          ← Prev
        </button>

        <button
          className="btn btn-secondary mobile-bar-btn mobile-bar-center-btn"
          onClick={() => setIsMobilePaletteOpen(true)}
        >
          📋 {answeredCount}/{totalCount}
        </button>

        {currentIndex < examPaper.questions.length - 1 ? (
          <button
            className="btn btn-primary mobile-bar-btn"
            onClick={() => setCurrentIndex((prev) => Math.min(examPaper.questions.length - 1, prev + 1))}
          >
            Next →
          </button>
        ) : (
          <button
            className="btn btn-success mobile-bar-btn"
            onClick={() => setShowSubmitModal(true)}
          >
            Finish ✓
          </button>
        )}
      </nav>

      {/* Mobile Drawer Bottom Sheet for Question Palette */}
      {isMobilePaletteOpen && (
        <QuestionPalette
          isMobileDrawer={true}
          onCloseDrawer={() => setIsMobilePaletteOpen(false)}
          questions={examPaper.questions}
          currentIndex={currentIndex}
          answers={answers}
          flaggedIds={flaggedIds}
          onSelectIndex={(idx) => setCurrentIndex(idx)}
          onSubmitPrompt={() => {
            setIsMobilePaletteOpen(false);
            setShowSubmitModal(true);
          }}
        />
      )}

      {/* Submission confirmation modal */}
      {showSubmitModal && (
        <SubmitConfirmModal
          totalQuestions={examPaper.questions.length}
          answeredCount={Object.keys(answers).length}
          flaggedCount={flaggedIds.size}
          candidateName={candidateName}
          onCandidateNameChange={setCandidateName}
          onConfirm={() => executeSubmit(false)}
          onCancel={() => setShowSubmitModal(false)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
