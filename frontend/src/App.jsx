import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ExamPage from './pages/ExamPage';
import ResultPage from './pages/ResultPage';
import AdminPage from './pages/AdminPage';
import CreateTestModal from './components/CreateTestModal';
import HistoryModal from './components/HistoryModal';
import AuthModal from './components/AuthModal';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { testApi } from './api/testApi';

function AppContent() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'admin' | 'exam' | 'result'
  const [adminActiveTab, setAdminActiveTab] = useState('overview');
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [examResult, setExamResult] = useState(null);
  const [categories, setCategories] = useState([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

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
    if (extraState.tab) {
      setAdminActiveTab(extraState.tab);
    }

    let hash = '#/';
    if (view === 'admin') {
      hash = extraState.tab ? `#/admin?tab=${extraState.tab}` : '#/admin';
    } else if (view !== 'home') {
      hash = `#/${view}${extraState.testId ? `?testId=${extraState.testId}` : ''}`;
    }

    const state = { view, ...extraState };
    if (replace) {
      window.history.replaceState(state, '', hash);
    } else {
      window.history.pushState(state, '', hash);
    }
  }, []);

  // Default admin directly to admin view (admin does not require student browse view)
  useEffect(() => {
    if (!authLoading && isAdmin && currentView === 'home' && !window.location.hash.startsWith('#/exam') && !window.location.hash.startsWith('#/result')) {
      navigateTo('admin', { tab: 'overview' }, true);
    }
  }, [isAdmin, authLoading, currentView, navigateTo]);

  // Guard admin view: bounce non-admin and unauthenticated users away from admin view to student home
  useEffect(() => {
    if (!authLoading && !isAdmin && currentView === 'admin') {
      navigateTo('home', {}, true);
    }
  }, [isAdmin, authLoading, currentView, navigateTo]);

  // Listen to browser Back / Forward buttons and initialize route once on mount
  useEffect(() => {
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
    } else if (hash.startsWith('#/admin')) {
      const params = new URLSearchParams(hash.split('?')[1] || '');
      const tab = params.get('tab') || 'overview';
      if (isAdmin) {
        setAdminActiveTab(tab);
        setCurrentView('admin');
      } else {
        navigateTo('home', {}, true);
      }
    } else {
      navigateTo('home', {}, true);
    }

    const handlePopState = (event) => {
      const state = event?.state;
      if (state && state.view) {
        if (state.view === 'admin' && !isAdmin) {
          navigateTo('home', {}, true);
          return;
        }
        setCurrentView(state.view);
        if (state.tab) {
          setAdminActiveTab(state.tab);
        }
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
        const hashNow = window.location.hash;
        if (hashNow.startsWith('#/admin')) {
          if (isAdmin) {
            const params = new URLSearchParams(hashNow.split('?')[1] || '');
            const tab = params.get('tab') || 'overview';
            setAdminActiveTab(tab);
            setCurrentView('admin');
          } else {
            navigateTo('home', {}, true);
          }
        } else {
          setCurrentView('home');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [navigateTo, isAdmin]);

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
    <div className="app-container">
      <Navbar
        currentView={currentView}
        adminActiveTab={adminActiveTab}
        onNavigate={(view, extraState = {}) => {
          if (currentView === 'exam') {
            if (!window.confirm('Leave test? Progress is saved in your browser.')) return;
          }
          navigateTo(view, extraState);
        }}
        onOpenCreate={() => setShowCreateModal(true)}
        onOpenHistory={() => setShowHistoryModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
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
        ) : (currentView === 'admin' && isAdmin) ? (
          <AdminPage
            categories={categories}
            initialTab={adminActiveTab}
            onTabChange={(tab) => navigateTo('admin', { tab })}
            onStartTest={handleStartTest}
            onRefreshCategories={fetchCategories}
            onViewAttempt={handleViewAttemptFromHistory}
          />
        ) : (
          <HomePage
            categories={categories}
            onStartTest={handleStartTest}
            onRefreshCategories={fetchCategories}
            onOpenAuth={() => setShowAuthModal(true)}
            onOpenCreate={() => setShowCreateModal(true)}
            onNavigateAdmin={() => navigateTo('admin')}
          />
        )}
      </main>

      {/* Create Test Modal (Admin Only) */}
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

      {/* Auth Modal (Login / Register) */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={(authUser) => {
            fetchCategories();
            const userIsAdmin = authUser?.role === 'ROLE_ADMIN' || authUser?.role === 'ADMIN';
            if (userIsAdmin) {
              navigateTo('admin', { tab: 'overview' }, true);
            } else {
              navigateTo('home', {}, true);
            }
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
