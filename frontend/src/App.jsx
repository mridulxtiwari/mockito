import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ExamPage from './pages/ExamPage';
import ResultPage from './pages/ResultPage';
import CreateTestModal from './components/CreateTestModal';
import HistoryModal from './components/HistoryModal';
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
  const fetchCategories = async () => {
    try {
      const data = await testApi.getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handlers
  const handleStartTest = (testId) => {
    setSelectedTestId(testId);
    setCurrentView('exam');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinishExam = (result) => {
    setExamResult(result);
    setCurrentView('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetakeTest = () => {
    if (examResult && examResult.testId) {
      handleStartTest(examResult.testId);
    } else {
      setCurrentView('home');
    }
  };

  const handleViewAttemptFromHistory = async (attemptId) => {
    try {
      const result = await testApi.getAttemptResult(attemptId);
      setExamResult(result);
      setCurrentView('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert('Could not load attempt details: ' + err.message);
    }
  };

  return (
    <div className="app-container">
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (currentView === 'exam') {
            if (!window.confirm('Leave test? Progress is saved in your browser.')) return;
          }
          setCurrentView(view);
        }}
        onOpenCreate={() => setShowCreateModal(true)}
        onOpenHistory={() => setShowHistoryModal(true)}
      />

      <main>
        {currentView === 'home' && (
          <HomePage
            categories={categories}
            onStartTest={handleStartTest}
            onRefreshCategories={fetchCategories}
          />
        )}

        {currentView === 'exam' && selectedTestId && (
          <ExamPage
            testId={selectedTestId}
            onFinishExam={handleFinishExam}
            onCancelExam={() => setCurrentView('home')}
          />
        )}

        {currentView === 'result' && examResult && (
          <ResultPage
            result={examResult}
            onRetake={handleRetakeTest}
            onBackToHome={() => setCurrentView('home')}
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
  );
}
