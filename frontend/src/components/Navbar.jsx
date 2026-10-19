import React from 'react';

export default function Navbar({ onNavigate, onOpenCreate, onOpenHistory, currentView }) {
  return (
    <header className="navbar">
      <div className="brand" onClick={() => onNavigate('home')} role="button" tabIndex={0} title="ExamPulse Home">
        <div className="brand-icon">🎯</div>
        <div className="brand-title">
          <span style={{ color: '#fff' }}>Exam</span>
          <span style={{ color: '#38bdf8' }}>Pulse</span>
        </div>
      </div>

      <nav className="nav-links">
        <button
          className={`btn ${currentView === 'home' ? 'btn-secondary' : 'btn-outline'} nav-btn nav-btn-tests`}
          onClick={() => onNavigate('home')}
          title="Browse All Tests"
          aria-label="All Tests"
        >
          <span className="nav-btn-icon">📚</span>
          <span className="nav-btn-label">All Tests</span>
        </button>

        <button
          className="btn btn-outline nav-btn nav-btn-history"
          onClick={onOpenHistory}
          title="Past Attempt History"
          aria-label="History"
        >
          <span className="nav-btn-icon">📊</span>
          <span className="nav-btn-label">History</span>
        </button>

        <button
          className="btn btn-primary nav-btn nav-btn-create"
          onClick={onOpenCreate}
          title="Create New Test"
          aria-label="New Test"
        >
          <span className="nav-btn-icon">➕</span>
          <span className="nav-btn-label">New Test</span>
        </button>
      </nav>
    </header>
  );
}
