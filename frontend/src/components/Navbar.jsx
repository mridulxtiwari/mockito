import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({
  onNavigate,
  onOpenCreate,
  onOpenHistory,
  onOpenAuth,
  currentView,
  adminActiveTab = 'overview',
}) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <header className="navbar">
      <div
        className="brand"
        onClick={() => onNavigate(isAdmin ? 'admin' : 'home', { tab: 'overview' })}
        role="button"
        tabIndex={0}
        title={isAdmin ? 'ExamPulse Admin Console' : 'ExamPulse Home'}
      >
        <div className="brand-icon">🎯</div>
        <div className="brand-title">
          <span style={{ color: '#fff' }}>Exam</span>
          <span style={{ color: '#38bdf8' }}>Pulse</span>
        </div>
      </div>

      <nav className="nav-links">
        {isAdmin ? (
          /* ================= ADMIN NAVIGATION ================= */
          <>
            <button
              id="nav-btn-admin-console"
              className={`btn ${currentView === 'admin' && adminActiveTab !== 'history' ? 'btn-primary nav-btn-admin-active' : 'btn-outline'} nav-btn nav-btn-admin`}
              onClick={() => onNavigate('admin', { tab: 'overview' })}
              title="Instructor & Admin Console"
              aria-label="Admin Console"
            >
              <span className="nav-btn-icon">🛡️</span>
              <span className="nav-btn-label">Admin Console</span>
            </button>

            <button
              id="nav-btn-admin-history"
              className={`btn ${currentView === 'admin' && adminActiveTab === 'history' ? 'btn-primary nav-btn-admin-active' : 'btn-outline'} nav-btn nav-btn-history`}
              onClick={() => onNavigate('admin', { tab: 'history' })}
              title="All Candidate Submissions & Exam History"
              aria-label="Exam History"
            >
              <span className="nav-btn-icon">📜</span>
              <span className="nav-btn-label">Exam History</span>
            </button>
          </>
        ) : (
          /* ================= STUDENT / GUEST NAVIGATION ================= */
          <>
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
          </>
        )}

        {/* User Profile / Auth Actions */}
        <div className="nav-auth-section" ref={dropdownRef}>
          {isAuthenticated ? (
            <div className="user-dropdown-container">
              <button
                id="user-profile-trigger"
                type="button"
                className={`user-profile-trigger ${dropdownOpen ? 'active' : ''}`}
                onClick={() => setDropdownOpen((prev) => !prev)}
                title={user.email}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <div className="user-avatar">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="user-display-name">{user.fullName}</span>
                <span className="dropdown-caret">{dropdownOpen ? '▴' : '▾'}</span>
              </button>

              {/* Profile Dropdown Menu */}
              {dropdownOpen && (
                <div className="user-dropdown-menu glass" id="user-dropdown-menu">
                  <div className="dropdown-header">
                    <span className="dropdown-name">{user.fullName}</span>
                    <span className="dropdown-email">{user.email}</span>
                  </div>

                  <div className="dropdown-divider" />

                  {isAdmin && (
                    <>
                      <button
                        id="dropdown-admin-btn"
                        type="button"
                        className="dropdown-menu-item"
                        onClick={() => {
                          setDropdownOpen(false);
                          onNavigate('admin', { tab: 'overview' });
                        }}
                      >
                        <span className="menu-item-icon">🛡️</span>
                        <span>Admin Console</span>
                      </button>

                      <button
                        id="dropdown-admin-history-btn"
                        type="button"
                        className="dropdown-menu-item"
                        onClick={() => {
                          setDropdownOpen(false);
                          onNavigate('admin', { tab: 'history' });
                        }}
                      >
                        <span className="menu-item-icon">📜</span>
                        <span>Exam History</span>
                      </button>
                    </>
                  )}

                  <button
                    id="dropdown-logout-btn"
                    type="button"
                    className="dropdown-menu-item dropdown-logout-btn"
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                      onNavigate('home');
                    }}
                  >
                    <span className="menu-item-icon">🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              id="nav-signin-btn"
              className="btn btn-primary nav-btn nav-signin-btn"
              onClick={onOpenAuth}
              title="Sign In or Register"
            >
              <span className="nav-btn-icon">👤</span>
              <span className="nav-btn-label">Sign In</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
