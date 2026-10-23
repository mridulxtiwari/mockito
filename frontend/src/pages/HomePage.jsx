import React, { useState, useEffect, useCallback } from 'react';
import { testApi } from '../api/testApi';
import { useAuth } from '../context/AuthContext';
import TestCard from '../components/TestCard';
import ManageEnrollmentModal from '../components/ManageEnrollmentModal';

export default function HomePage({
  onStartTest,
  categories,
  onRefreshCategories,
  onOpenAuth,
  onOpenCreate,
  onNavigateAdmin,
}) {
  const { user, isAuthenticated, isAdmin } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [candidateCount, setCandidateCount] = useState(0);
  const [managingEnrollmentTest, setManagingEnrollmentTest] = useState(null);

  const loadTests = useCallback(async (catId) => {
    setLoading(true);
    try {
      const data = await testApi.getTests(catId);
      setTests(data || []);
    } catch (err) {
      console.error('Failed to load tests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload tests whenever category or user authentication state changes
  useEffect(() => {
    loadTests(selectedCategory);
  }, [selectedCategory, user, loadTests]);

  // Load candidate count for admin dashboard metrics
  useEffect(() => {
    if (isAdmin) {
      testApi
        .getUsers()
        .then((users) => {
          const students = (users || []).filter(
            (u) => u.role !== 'ROLE_ADMIN' && u.role !== 'ADMIN'
          );
          setCandidateCount(students.length);
        })
        .catch(() => {});
    }
  }, [isAdmin]);

  const handleDeleteTest = async (testId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    setDeletingId(testId);
    try {
      await testApi.deleteTest(testId);
      setTests((prev) => prev.filter((t) => t.id !== testId));
      if (onRefreshCategories) onRefreshCategories();
    } catch (err) {
      alert('Failed to delete test: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Search filtering
  const filteredTests = tests.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="home-page-container">
      {/* 1. ROLE-BASED HERO / HEADER SECTION */}
      {isAdmin ? (
        /* ADMIN DASHBOARD HEADER */
        <section className="admin-hero glass">
          <div className="admin-hero-content">
            <div className="admin-hero-left">
              <div className="admin-badge-pill">
                <span>🛡️</span>
                <span>INSTRUCTOR CONTROL CENTER</span>
              </div>
              <h1 className="admin-hero-title">Assessment Management</h1>
              <p className="admin-hero-subtitle">
                Create and publish mock tests, manage candidate enrollment, and monitor assessments.
              </p>
            </div>
            <div className="admin-hero-actions">
              <button
                id="btn-goto-admin-console"
                type="button"
                className="btn btn-outline btn-create-test-hero"
                onClick={onNavigateAdmin}
                title="Open Comprehensive Admin Command Center"
              >
                <span>🛡️</span>
                <span>Open Admin Console</span>
              </button>
              <button
                id="btn-create-test-hero"
                type="button"
                className="btn btn-primary btn-create-test-hero"
                onClick={onOpenCreate}
              >
                <span>➕</span>
                <span>Create Mock Test</span>
              </button>
            </div>
          </div>

          {/* Platform KPI Metrics */}
          <div className="admin-kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon">📚</div>
              <div className="kpi-data">
                <span className="kpi-value">{tests.length}</span>
                <span className="kpi-label">Active Mock Tests</span>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon">🏷️</div>
              <div className="kpi-data">
                <span className="kpi-value">{categories.length}</span>
                <span className="kpi-label">Test Categories</span>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon">👥</div>
              <div className="kpi-data">
                <span className="kpi-value">{candidateCount}</span>
                <span className="kpi-label">Registered Students</span>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* STUDENT & GUEST CANDIDATE HERO */
        <section className="hero">
          <div className="hero-tag">✨ REAL-TIME ONLINE EXAMINATION ENGINE</div>
          <h1>Master Your Technical & Aptitude Tests</h1>
          <p>
            Timed mock examinations with live countdowns, question navigation palettes, instant evaluation, and in-depth solution reviews.
          </p>
        </section>
      )}

      {/* 2. CATEGORY FILTERS & SEARCH */}
      <section className="filter-controls-section">
        <div className="category-chips">
          <button
            className={`chip ${selectedCategory === null ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            🔥 All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`chip ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="search-bar-wrap">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search tests by topic, framework, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        {/* Guest Warning Banner if unauthenticated */}
        {!isAuthenticated && (
          <div className="guest-info-banner">
            <div>
              <span>💡 Viewing available mock tests. </span>
              <strong>Sign in</strong> to access your tests and track your assessment scorecard.
            </div>
            <button
              id="guest-signin-btn"
              className="btn btn-outline btn-guest-signin"
              onClick={onOpenAuth}
            >
              Sign In
            </button>
          </div>
        )}
      </section>

      {/* 3. TESTS GRID */}
      {loading ? (
        <div className="loading-grid">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="skeleton-card glass" />
          ))}
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="empty-tests-state glass">
          <div className="empty-icon">🔍</div>
          <h3>No mock tests found</h3>
          <p>Try adjusting your search criteria or selecting a different category.</p>
          {(searchQuery || selectedCategory !== null) && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="test-grid">
          {filteredTests.map((test) => (
            <TestCard
              key={test.id}
              test={test}
              isAdmin={isAdmin}
              onStartTest={onStartTest}
              onDeleteTest={handleDeleteTest}
              onManageEnrollment={(t) => setManagingEnrollmentTest(t)}
              isDeleting={deletingId === test.id}
            />
          ))}
        </div>
      )}

      {/* 4. MANAGE ENROLLMENT MODAL (ADMIN ONLY) */}
      {managingEnrollmentTest && (
        <ManageEnrollmentModal
          test={managingEnrollmentTest}
          onClose={() => setManagingEnrollmentTest(null)}
          onUpdated={() => {
            loadTests(selectedCategory);
            if (onRefreshCategories) onRefreshCategories();
          }}
        />
      )}
    </div>
  );
}
