import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ExamPage from './pages/ExamPage';
import ResultPage from './pages/ResultPage';
import CreateTestModal from './components/CreateTestModal';
import HistoryModal from './components/HistoryModal';
import ErrorBoundary from './components/ErrorBoundary';
import { testApi } from './api/testApi';

export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'exam' | 'result'
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [examResult, setExamResult] = useState(null);
  const [categories, setCategories] = useState([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Load categories on start
  const fetchCategories = useCallback(async () => {
    try {
      const data = await testApi.getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }, []);

  // Fetch categories once on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Helper to sync view changes with browser history
  const navigateTo = useCallback((view, extraState = {}, replace = false) => {
    setCurrentView(view);
    const hash =
      view === 'home'
        ? '#/'
        : `#/${view}${extraState.testId ? `?testId=${extraState.testId}` : ''}`;

    const state = { view, ...extraState };
    if (replace) {
      window.history.replaceState(state, '', hash);
    } else {
      window.history.pushState(state, '', hash);
    }
  }, []);

  // Listen to browser Back / Forward buttons and initialize route once on mount
  useEffect(() => {
    // Check initial hash route or cached state
    const hash = window.location.hash;
    if (hash.startsWith('#/exam')) {
      const params = new URLSearchParams(hash.split('?')[1] || '');
      const testId = params.get('testId');
      if (testId) {
        setSelectedTestId(Number(testId));
        setCurrentView('exam');
      } else {
        navigateTo('home', {}, true);
      }
    } else if (hash.startsWith('#/result')) {
      try {
        const cached = sessionStorage.getItem('last_exam_result');
        if (cached) {
          setExamResult(JSON.parse(cached));
          setCurrentView('result');
        } else {
          navigateTo('home', {}, true);
        }
      } catch {
        navigateTo('home', {}, true);
      }
    } else {
      navigateTo('home', {}, true);
    }

    // Handle browser Back / Forward navigation
    const handlePopState = (event) => {
      const state = event.state;
      if (state && state.view) {
        setCurrentView(state.view);
        if (state.testId) {
          setSelectedTestId(state.testId);
        }
        if (state.view === 'result') {
          try {
            const cached = sessionStorage.getItem('last_exam_result');
            if (cached) setExamResult(JSON.parse(cached));
          } catch {}
        }
      } else {
        // Fallback safely to home if no state
        setCurrentView('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigateTo]);

  // Handlers
  const handleStartTest = (testId) => {
    setSelectedTestId(testId);
    navigateTo('exam', { testId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinishExam = (result) => {
    setExamResult(result);
    try {
      sessionStorage.setItem('last_exam_result', JSON.stringify(result));
    } catch {}
    navigateTo('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetakeTest = () => {
    if (examResult && examResult.testId) {
      handleStartTest(examResult.testId);
    } else {
      navigateTo('home');
    }
  };

  const handleBackToHome = () => {
    navigateTo('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewAttemptFromHistory = async (attemptId) => {
    try {
      const result = await testApi.getAttemptResult(attemptId);
      setExamResult(result);
      try {
        sessionStorage.setItem('last_exam_result', JSON.stringify(result));
      } catch {}
      navigateTo('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert('Could not load attempt details: ' + err.message);
    }
  };

  return (
    <ErrorBoundary>
      <div className="app-container">
        <Navbar
          currentView={currentView}
          onNavigate={(view) => {
            if (currentView === 'exam') {
              if (!window.confirm('Leave test? Progress is saved in your browser.')) return;
            }
            navigateTo(view);
          }}
          onOpenCreate={() => setShowCreateModal(true)}
          onOpenHistory={() => setShowHistoryModal(true)}
        />

        <main>
          {currentView === 'exam' && selectedTestId ? (
            <ExamPage
              testId={selectedTestId}
              onFinishExam={handleFinishExam}
              onCancelExam={handleBackToHome}
            />
          ) : currentView === 'result' && examResult ? (
            <ResultPage
              result={examResult}
              onRetake={handleRetakeTest}
              onBackToHome={handleBackToHome}
            />
          ) : (
            <HomePage
              categories={categories}
              onStartTest={handleStartTest}
              onRefreshCategories={fetchCategories}
            />
          )}
        </main>

        {/* Create Test Modal */}
        {showCreateModal && (
          <CreateTestModal
            categories={categories}
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              fetchCategories();
              alert('🎉 Mock test created successfully!');
            }}
          />
        )}

        {/* History Modal */}
        {showHistoryModal && (
          <HistoryModal
            onClose={() => setShowHistoryModal(false)}
            onViewAttempt={handleViewAttemptFromHistory}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
