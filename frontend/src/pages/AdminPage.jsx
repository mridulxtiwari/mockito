import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { testApi } from '../api/testApi';
import CandidatePicker from '../components/CandidatePicker';
import ManageEnrollmentModal from '../components/ManageEnrollmentModal';
import { useAuth } from '../context/AuthContext';

export default function AdminPage({
  categories = [],
  initialTab = 'overview',
  onTabChange,
  onStartTest,
  onRefreshCategories,
  onViewAttempt,
}) {
  const { isAdmin } = useAuth();

  // Navigation tabs: 'overview' | 'history' | 'tests' | 'students' | 'studio'
  const [activeTab, setActiveTab] = useState(initialTab || 'overview');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Core Data
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);

  // Modals & Inspection States
  const [managingEnrollmentTest, setManagingEnrollmentTest] = useState(null); // Test-centric enrollment
  const [managingStudentTests, setManagingStudentTests] = useState(null);     // Student-centric enrollment
  const [viewingStudentScorecards, setViewingStudentScorecards] = useState(null); // Student scorecards
  const [inspectingAttempt, setInspectingAttempt] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Filter & Search states for Tests Tab
  const [testSearch, setTestSearch] = useState('');
  const [testCategoryFilter, setTestCategoryFilter] = useState('ALL');
  const [testAccessFilter, setTestAccessFilter] = useState('ALL'); // 'ALL' | 'COMMON' | 'ASSIGNED'
  const [testViewMode, setTestViewMode] = useState('table'); // 'table' | 'cards'

  // Filter & Search states for Submissions History Tab
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('ALL'); // 'ALL' | 'PASSED' | 'FAILED'
  const [submissionCategoryFilter, setSubmissionCategoryFilter] = useState('ALL');

  // Filter & Search for Student Directory Tab
  const [studentSearch, setStudentSearch] = useState('');

  // ----------------------------------------------------
  // TEST STUDIO STATE (Authoring Assessments)
  // ----------------------------------------------------
  const [studioCategoryId, setStudioCategoryId] = useState(categories[0]?.id || 1);
  const [studioTitle, setStudioTitle] = useState('');
  const [studioDescription, setStudioDescription] = useState('');
  const [studioDuration, setStudioDuration] = useState(15);
  const [studioPassingMarks, setStudioPassingMarks] = useState(5);
  const [studioDifficulty, setStudioDifficulty] = useState('MEDIUM');
  const [studioIsAllUsers, setStudioIsAllUsers] = useState(true);
  const [studioSelectedUserIds, setStudioSelectedUserIds] = useState([]);
  const [studioQuestions, setStudioQuestions] = useState([
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
  const [studioSubmitting, setStudioSubmitting] = useState(false);
  const [studioError, setStudioError] = useState('');
  const [studioSuccess, setStudioSuccess] = useState('');

  // ----------------------------------------------------
  // DATA FETCHING
  // ----------------------------------------------------
  const fetchAllAdminData = useCallback(async () => {
    setLoadingData(true);
    setDataError(null);
    try {
      const [testsData, attemptsData, usersData] = await Promise.all([
        testApi.getTests(),
        testApi.getAttemptHistory().catch(() => []),
        testApi.getUsers().catch(() => []),
      ]);

      setTests(testsData || []);
      setAttempts(attemptsData || []);
      setUsers(usersData || []);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
      setDataError('Could not load administrative data: ' + (err.message || 'Server error'));
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchAllAdminData();
  }, [fetchAllAdminData]);

  // Sync category default if categories loaded later
  useEffect(() => {
    if (categories.length > 0 && !studioCategoryId) {
      setStudioCategoryId(categories[0].id);
    }
  }, [categories, studioCategoryId]);

  // ----------------------------------------------------
  // METRICS COMPUTATION
  // ----------------------------------------------------
  const metrics = useMemo(() => {
    const totalTests = tests.length;
    const publicTests = tests.filter((t) => t.accessType === 'COMMON').length;
    const assignedTests = tests.filter((t) => t.accessType === 'ASSIGNED').length;

    const totalSubmissions = attempts.length;
    const passedSubmissions = attempts.filter((a) => a.passed).length;
    const passRate = totalSubmissions > 0
      ? Math.round((passedSubmissions / totalSubmissions) * 100)
      : 0;

    const avgScore = totalSubmissions > 0
      ? (attempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / totalSubmissions).toFixed(1)
      : 0;

    const students = users.filter((u) => u.role !== 'ROLE_ADMIN' && u.role !== 'ADMIN');
    const totalStudents = students.length;

    return {
      totalTests,
      publicTests,
      assignedTests,
      totalSubmissions,
      passedSubmissions,
      passRate,
      avgScore,
      totalStudents,
    };
  }, [tests, attempts, users]);

  // ----------------------------------------------------
  // TEST DELETION
  // ----------------------------------------------------
  const handleDeleteTest = async (testId, title) => {
    if (!window.confirm(`⚠️ Permanently delete mock test "${title}"?\n\nThis will remove all associated questions and student enrollment.`)) {
      return;
    }
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

  // ----------------------------------------------------
  // SUBMISSION REVIEW INSPECTION
  // ----------------------------------------------------
  const handleOpenAttemptReview = async (attemptId) => {
    try {
      const detailedResult = await testApi.getAttemptResult(attemptId);
      setInspectingAttempt(detailedResult);
    } catch (err) {
      alert('Failed to load attempt details: ' + err.message);
    }
  };

  // ----------------------------------------------------
  // TEST STUDIO ACTIONS (Duplicate, Reorder, Presets)
  // ----------------------------------------------------
  const handleAddQuestion = () => {
    setStudioQuestions((prev) => [
      ...prev,
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

  const handleDuplicateQuestion = (index) => {
    const target = studioQuestions[index];
    const duplicated = {
      ...target,
      questionText: `${target.questionText} (Copy)`,
      options: target.options.map((opt) => ({ ...opt })),
    };
    const updated = [...studioQuestions];
    updated.splice(index + 1, 0, duplicated);
    setStudioQuestions(updated);
  };

  const handleMoveQuestion = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= studioQuestions.length) return;
    const updated = [...studioQuestions];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setStudioQuestions(updated);
  };

  const handleRemoveQuestion = (index) => {
    if (studioQuestions.length <= 1) return;
    setStudioQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuestion = (index, field, value) => {
    setStudioQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleUpdateOption = (qIndex, optIndex, text) => {
    setStudioQuestions((prev) => {
      const updated = [...prev];
      const opts = [...updated[qIndex].options];
      opts[optIndex] = { ...opts[optIndex], optionText: text };
      updated[qIndex] = { ...updated[qIndex], options: opts };
      return updated;
    });
  };

  const handleSetCorrectOption = (qIndex, optIndex) => {
    setStudioQuestions((prev) => {
      const updated = [...prev];
      const opts = updated[qIndex].options.map((opt, i) => ({
        ...opt,
        isCorrect: i === optIndex,
      }));
      updated[qIndex] = { ...updated[qIndex], options: opts };
      return updated;
    });
  };

  const handleLoadTemplate = (type) => {
    if (studioQuestions.some((q) => q.questionText.trim()) && !window.confirm('Replace current question draft with preset questions?')) {
      return;
    }

    if (type === 'JAVA') {
      const cat = categories.find((c) => c.name.toLowerCase().includes('java')) || categories[0];
      if (cat) setStudioCategoryId(cat.id);
      setStudioTitle('Java Concurrency & Virtual Threads Benchmark');
      setStudioDescription('Comprehensive evaluation of Project Loom virtual threads, concurrent locks, and ForkJoinPool.');
      setStudioDifficulty('HARD');
      setStudioDuration(20);
      setStudioPassingMarks(10);
      setStudioQuestions([
        {
          questionText: 'Which JVM thread carrier model is utilized by Java 21 Virtual Threads when executing CPU-bound tasks?',
          explanation: 'Virtual threads run on a small pool of carrier threads (typically ForkJoinPool.commonPool()) using work-stealing.',
          marks: 5,
          options: [
            { optionKey: 'A', optionText: 'Operating System 1:1 kernel threads directly', isCorrect: false },
            { optionKey: 'B', optionText: 'ForkJoinPool carrier threads in a M:N lightweight mounting model', isCorrect: true },
            { optionKey: 'C', optionText: 'Green Threads without OS scheduling', isCorrect: false },
            { optionKey: 'D', optionText: 'POSIX thread pooling with synchronized locks', isCorrect: false },
          ],
        },
        {
          questionText: 'When does a Virtual Thread pin to its carrier platform thread, preventing unmounting?',
          explanation: 'Virtual threads are pinned when executing inside a synchronized block/method or invoking JNI native calls.',
          marks: 5,
          options: [
            { optionKey: 'A', optionText: 'During any blocking socket I/O operation', isCorrect: false },
            { optionKey: 'B', optionText: 'Inside a synchronized block or native JNI call', isCorrect: true },
            { optionKey: 'C', optionText: 'When acquiring a ReentrantLock', isCorrect: false },
            { optionKey: 'D', optionText: 'During Thread.sleep()', isCorrect: false },
          ],
        },
      ]);
    } else if (type === 'SQL') {
      const cat = categories.find((c) => c.name.toLowerCase().includes('sql') || c.name.toLowerCase().includes('database')) || categories[0];
      if (cat) setStudioCategoryId(cat.id);
      setStudioTitle('PostgreSQL Query Execution & Indexing Mastery');
      setStudioDescription('Assessment covering B-Tree, BRIN, GIN indexes, execution plans (EXPLAIN ANALYZE), and vacuuming.');
      setStudioDifficulty('MEDIUM');
      setStudioDuration(15);
      setStudioPassingMarks(8);
      setStudioQuestions([
        {
          questionText: 'Which PostgreSQL index type is most memory-efficient for append-only time-series data with physical clustering?',
          explanation: 'BRIN (Block Range Index) stores min/max values for ranges of physical pages, offering tiny index sizes for sorted data.',
          marks: 4,
          options: [
            { optionKey: 'A', optionText: 'B-Tree Index', isCorrect: false },
            { optionKey: 'B', optionText: 'BRIN (Block Range Index)', isCorrect: true },
            { optionKey: 'C', optionText: 'GIN Index', isCorrect: false },
            { optionKey: 'D', optionText: 'Hash Index', isCorrect: false },
          ],
        },
        {
          questionText: 'What does "Bitmap Index Scan" combined with "Bitmap Heap Scan" represent in an EXPLAIN execution plan?',
          explanation: 'PostgreSQL scans the index to build a memory bitmap of matching tuple TID locations, then visits table pages sequentially.',
          marks: 4,
          options: [
            { optionKey: 'A', optionText: 'Full sequential scan across all heap disk blocks', isCorrect: false },
            { optionKey: 'B', optionText: 'Two-phase retrieval building a page bitmap before sequential heap page fetching', isCorrect: true },
            { optionKey: 'C', optionText: 'A direct index-only scan bypassing heap pages entirely', isCorrect: false },
            { optionKey: 'D', optionText: 'An in-memory hash join between two tables', isCorrect: false },
          ],
        },
      ]);
    } else if (type === 'REACT') {
      const cat = categories.find((c) => c.name.toLowerCase().includes('react') || c.name.toLowerCase().includes('frontend')) || categories[0];
      if (cat) setStudioCategoryId(cat.id);
      setStudioTitle('React 19 & State Concurrency Assessment');
      setStudioDescription('Advanced examination on useActionState, Server Components, and concurrent rendering transitions.');
      setStudioDifficulty('MEDIUM');
      setStudioDuration(15);
      setStudioPassingMarks(6);
      setStudioQuestions([
        {
          questionText: 'What is the primary benefit of wrapping a state update inside startTransition() in React 18/19?',
          explanation: 'Transitions mark state updates as non-urgent, allowing high-priority user interactions (like typing) to interrupt.',
          marks: 3,
          options: [
            { optionKey: 'A', optionText: 'It automatically debounces network API requests', isCorrect: false },
            { optionKey: 'B', optionText: 'It marks the state update as non-urgent so responsive user input can interrupt it', isCorrect: true },
            { optionKey: 'C', optionText: 'It runs the component render synchronously in a Web Worker', isCorrect: false },
            { optionKey: 'D', optionText: 'It caches the return value in localStorage', isCorrect: false },
          ],
        },
        {
          questionText: 'Which hook in React 19 simplifies handling form submissions with pending states and optimistic updates?',
          explanation: 'useActionState (formerly useFormState) manages form actions with pending status and updated state return values.',
          marks: 3,
          options: [
            { optionKey: 'A', optionText: 'useActionState', isCorrect: true },
            { optionKey: 'B', optionText: 'useFormStatusOnly', isCorrect: false },
            { optionKey: 'C', optionText: 'useDeferredForm', isCorrect: false },
            { optionKey: 'D', optionText: 'useLayoutAction', isCorrect: false },
          ],
        },
      ]);
    }
  };

  const handlePublishStudioTest = async (e) => {
    e.preventDefault();
    setStudioError('');
    setStudioSuccess('');

    if (!studioTitle.trim()) {
      setStudioError('Please enter a mock test title');
      return;
    }

    if (!studioIsAllUsers && studioSelectedUserIds.length === 0) {
      setStudioError('Please select at least one student, or mark the test as "All Users".');
      return;
    }

    for (let i = 0; i < studioQuestions.length; i++) {
      if (!studioQuestions[i].questionText.trim()) {
        setStudioError(`Question #${i + 1} prompt cannot be empty`);
        return;
      }
      for (let j = 0; j < studioQuestions[i].options.length; j++) {
        if (!studioQuestions[i].options[j].optionText.trim()) {
          setStudioError(`Question #${i + 1}, Option ${studioQuestions[i].options[j].optionKey} is missing text`);
          return;
        }
      }
    }

    setStudioSubmitting(true);
    try {
      await testApi.createTest({
        categoryId: Number(studioCategoryId),
        title: studioTitle.trim(),
        description: studioDescription.trim(),
        durationMinutes: Number(studioDuration),
        passingMarks: Number(studioPassingMarks),
        difficulty: studioDifficulty,
        accessType: studioIsAllUsers ? 'COMMON' : 'ASSIGNED',
        assignedUserIds: studioIsAllUsers ? [] : studioSelectedUserIds,
        questions: studioQuestions,
      });

      setStudioSuccess(`🎉 Mock test "${studioTitle}" published successfully!`);
      fetchAllAdminData();
      if (onRefreshCategories) onRefreshCategories();

      setTimeout(() => {
        setStudioTitle('');
        setStudioDescription('');
        setStudioSelectedUserIds([]);
        setStudioIsAllUsers(true);
        setStudioQuestions([
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
        switchTab('tests');
        setStudioSuccess('');
      }, 1200);
    } catch (err) {
      setStudioError(err.message || 'Failed to publish test');
    } finally {
      setStudioSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // FILTERED LISTS
  // ----------------------------------------------------
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.categoryName?.toLowerCase().includes(testSearch.toLowerCase());

      const matchCat =
        testCategoryFilter === 'ALL' ||
        String(t.categoryId) === String(testCategoryFilter);

      const matchAccess =
        testAccessFilter === 'ALL' ||
        (testAccessFilter === 'COMMON' && t.accessType === 'COMMON') ||
        (testAccessFilter === 'ASSIGNED' && t.accessType === 'ASSIGNED');

      return matchSearch && matchCat && matchAccess;
    });
  }, [tests, testSearch, testCategoryFilter, testAccessFilter]);

  const filteredSubmissions = useMemo(() => {
    return attempts.filter((att) => {
      const q = submissionSearch.toLowerCase();
      const matchSearch =
        (att.candidateName && att.candidateName.toLowerCase().includes(q)) ||
        (att.candidateEmail && att.candidateEmail.toLowerCase().includes(q)) ||
        (att.testTitle && att.testTitle.toLowerCase().includes(q));

      const matchStatus =
        submissionStatusFilter === 'ALL' ||
        (submissionStatusFilter === 'PASSED' && att.passed) ||
        (submissionStatusFilter === 'FAILED' && !att.passed);

      const matchCategory =
        submissionCategoryFilter === 'ALL' ||
        (att.categoryName && att.categoryName === submissionCategoryFilter);

      return matchSearch && matchStatus && matchCategory;
    });
  }, [attempts, submissionSearch, submissionStatusFilter, submissionCategoryFilter]);

  const registeredStudents = useMemo(() => {
    const students = users.filter((u) => u.role !== 'ROLE_ADMIN' && u.role !== 'ADMIN');
    return students.filter((s) => {
      const q = studentSearch.toLowerCase();
      return (
        (s.fullName && s.fullName.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
      );
    });
  }, [users, studentSearch]);

  const totalCalculatedStudioMarks = useMemo(() => {
    return studioQuestions.reduce((acc, q) => acc + (Number(q.marks) || 1), 0);
  }, [studioQuestions]);

  if (!isAdmin) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 20px', color: '#94a3b8' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '12px' }}>Access Restricted</h2>
        <p>The Instructor & Admin Console is reserved for verified administrators.</p>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      {/* 1. TOP HEADER (CLEAN & ADMIN-FOCUSED: NO REDUNDANT CREATE BUTTONS, NO STUDENT VIEW) */}
      <header className="admin-console-header glass">
        <div className="admin-console-header-left">
          <div className="admin-badge-pill">
            <span>🛡️</span>
            <span>INSTRUCTOR & ADMIN CONSOLE</span>
          </div>
          <h1 className="admin-console-title">Assessment Command Center</h1>
          <p className="admin-console-subtitle">
            Manage mock tests, track live candidate scorecards, manage student enrollment, and author examinations.
          </p>
        </div>
      </header>

      {/* 2. TABBED NAVIGATION */}
      <nav className="admin-tabs-bar glass">
        <button
          id="tab-btn-overview"
          className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => switchTab('overview')}
        >
          <span className="tab-icon">📊</span>
          <span className="tab-label">Overview & Analytics</span>
        </button>

        <button
          id="tab-btn-history"
          className={`admin-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => switchTab('history')}
        >
          <span className="tab-icon">📜</span>
          <span className="tab-label">Submissions History</span>
          {attempts.length > 0 && <span className="tab-count-badge">{attempts.length}</span>}
        </button>

        <button
          id="tab-btn-tests"
          className={`admin-tab-btn ${activeTab === 'tests' ? 'active' : ''}`}
          onClick={() => switchTab('tests')}
        >
          <span className="tab-icon">📚</span>
          <span className="tab-label">Assessments & Tests</span>
          <span className="tab-count-badge">{tests.length}</span>
        </button>

        <button
          id="tab-btn-students"
          className={`admin-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => switchTab('students')}
        >
          <span className="tab-icon">👥</span>
          <span className="tab-label">Student Directory & Options</span>
          <span className="tab-count-badge">{metrics.totalStudents}</span>
        </button>

        <button
          id="tab-btn-studio"
          className={`admin-tab-btn ${activeTab === 'studio' ? 'active' : ''}`}
          onClick={() => switchTab('studio')}
        >
          <span className="tab-icon">✨</span>
          <span className="tab-label">Test Studio (Builder)</span>
        </button>
      </nav>

      {/* ERROR BANNER */}
      {dataError && (
        <div className="auth-error-banner" style={{ margin: '16px 0' }} role="alert">
          <span>⚠️</span>
          <span>{dataError}</span>
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: '2px 8px', fontSize: '0.75rem', marginLeft: 'auto' }}
            onClick={fetchAllAdminData}
          >
            Retry
          </button>
        </div>
      )}

      {/* ============================================================
          TAB 1: OVERVIEW & ANALYTICS
          ============================================================ */}
      {activeTab === 'overview' && (
        <div className="admin-tab-content">
          {/* KPI CARDS GRID */}
          <div className="admin-kpi-grid">
            <div className="kpi-card glass">
              <div className="kpi-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                📚
              </div>
              <div className="kpi-data">
                <span className="kpi-value">{metrics.totalTests}</span>
                <span className="kpi-label">Active Mock Tests</span>
                <span className="kpi-subtext">
                  {metrics.publicTests} Public • {metrics.assignedTests} Targeted
                </span>
              </div>
            </div>

            <div className="kpi-card glass">
              <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                📝
              </div>
              <div className="kpi-data">
                <span className="kpi-value">{metrics.totalSubmissions}</span>
                <span className="kpi-label">Total Submissions</span>
                <span className="kpi-subtext">Evaluated attempts</span>
              </div>
            </div>

            <div className="kpi-card glass">
              <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                🎯
              </div>
              <div className="kpi-data">
                <span className="kpi-value">{metrics.passRate}%</span>
                <span className="kpi-label">Overall Pass Rate</span>
                <span className="kpi-subtext">{metrics.passedSubmissions} passed candidates</span>
              </div>
            </div>

            <div className="kpi-card glass">
              <div className="kpi-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                👥
              </div>
              <div className="kpi-data">
                <span className="kpi-value">{metrics.totalStudents}</span>
                <span className="kpi-label">Registered Students</span>
                <span className="kpi-subtext">Active accounts</span>
              </div>
            </div>
          </div>

          {/* Quick Categories Overview */}
          <section className="admin-section-box glass" style={{ marginTop: '20px' }}>
            <div className="admin-section-header">
              <div>
                <h3 className="admin-section-title">Assessment Domains & Categories</h3>
                <p className="admin-section-desc">Active examination categories configured in ExamPulse</p>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => switchTab('tests')}
              >
                Browse All Tests →
              </button>
            </div>

            <div className="admin-domain-grid">
              {categories.map((c) => {
                const count = tests.filter((t) => t.categoryId === c.id).length;
                return (
                  <div key={c.id} className="domain-card glass">
                    <div className="domain-card-header">
                      <span className="domain-icon">{c.icon}</span>
                      <span className="domain-count-badge">{count} tests</span>
                    </div>
                    <h4 className="domain-title">{c.name}</h4>
                    <p className="domain-desc">{c.description || 'Practice tests & assessments.'}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recent Submissions Preview */}
          <section className="admin-section-box glass" style={{ marginTop: '20px' }}>
            <div className="admin-section-header">
              <div>
                <h3 className="admin-section-title">Recent Candidate Activity</h3>
                <p className="admin-section-desc">Latest mock test attempts submitted across all candidates</p>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => switchTab('history')}
              >
                View Full Submissions History ({attempts.length}) →
              </button>
            </div>

            {attempts.length === 0 ? (
              <div className="admin-table-empty">
                <span className="empty-icon">📝</span>
                <h4>No submissions recorded yet</h4>
                <p>When candidates complete exams, their results will appear here automatically.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Assessment Test</th>
                      <th>Score</th>
                      <th>Accuracy</th>
                      <th>Submitted On</th>
                      <th style={{ textAlign: 'right' }}>Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.slice(0, 5).map((att) => (
                      <tr key={att.id} className="admin-table-row">
                        <td>
                          <div className="candidate-cell">
                            <div className="candidate-avatar-small">
                              {att.candidateName ? att.candidateName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="candidate-cell-info">
                              <span className="candidate-name-bold">{att.candidateName || 'Candidate'}</span>
                              <span className="candidate-email-muted">{att.candidateEmail || 'No email'}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="test-cell">
                            <span className="test-cell-title">{att.testTitle || 'Mock Test'}</span>
                            <span className="test-cell-category">{att.categoryName || 'General'}</span>
                          </div>
                        </td>

                        <td>
                          <div className="score-cell">
                            <span
                              className={`result-badge ${
                                att.passed ? 'result-badge-passed' : 'result-badge-failed'
                              }`}
                            >
                              {att.passed ? '✓ PASSED' : '✕ FAILED'}
                            </span>
                            <span className="score-value-bold">{att.score} pts ({att.percentage}%)</span>
                          </div>
                        </td>

                        <td>
                          <span className="accuracy-cell-pill">
                            {(att.correctAnswers || 0) + (att.wrongAnswers || 0) > 0
                              ? `${Math.round(((att.correctAnswers || 0) / ((att.correctAnswers || 0) + (att.wrongAnswers || 0))) * 100)}%`
                              : '0%'}
                          </span>
                        </td>

                        <td>
                          <span className="date-cell">
                            {att.submittedAt ? new Date(att.submittedAt).toLocaleString() : 'Recent'}
                          </span>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm btn-inspect-attempt"
                            onClick={() => handleOpenAttemptReview(att.id)}
                          >
                            <span>🔍</span>
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ============================================================
          TAB 2: SUBMISSIONS HISTORY (HISTORY FOR ADMIN)
          ============================================================ */}
      {activeTab === 'history' && (
        <div className="admin-tab-content">
          <section className="admin-section-box glass">
            <div className="admin-section-header">
              <div>
                <h3 className="admin-section-title">Candidate Examination & Submissions History</h3>
                <p className="admin-section-desc">
                  Comprehensive audit of all completed test attempts, evaluations, and question-by-question answer sheets.
                </p>
              </div>

              {/* Submissions Filter Toolbar */}
              <div className="admin-filter-toolbar">
                <div className="search-bar-wrap inline-search">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="🔍 Search candidate, email, or test..."
                    value={submissionSearch}
                    onChange={(e) => setSubmissionSearch(e.target.value)}
                  />
                  {submissionSearch && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setSubmissionSearch('')}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="filter-pill-group">
                  <button
                    className={`filter-pill-btn ${submissionStatusFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setSubmissionStatusFilter('ALL')}
                  >
                    All ({attempts.length})
                  </button>
                  <button
                    className={`filter-pill-btn filter-passed ${submissionStatusFilter === 'PASSED' ? 'active' : ''}`}
                    onClick={() => setSubmissionStatusFilter('PASSED')}
                  >
                    ✓ Passed ({attempts.filter((a) => a.passed).length})
                  </button>
                  <button
                    className={`filter-pill-btn filter-failed ${submissionStatusFilter === 'FAILED' ? 'active' : ''}`}
                    onClick={() => setSubmissionStatusFilter('FAILED')}
                  >
                    ✕ Failed ({attempts.filter((a) => !a.passed).length})
                  </button>
                </div>
              </div>
            </div>

            {loadingData ? (
              <div className="admin-table-loading">
                <span className="spinner">⏳</span> Fetching candidate attempts...
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="admin-table-empty">
                <span className="empty-icon">🔍</span>
                <h4>No candidate submissions match your criteria</h4>
                <p>Adjust your search query or reset the pass/fail status filters.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Assessment Test</th>
                      <th>Score & Result</th>
                      <th>Accuracy</th>
                      <th>Time Taken</th>
                      <th>Submitted On</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map((att) => {
                      const minutes = Math.floor((att.timeTakenSeconds || 0) / 60);
                      const seconds = (att.timeTakenSeconds || 0) % 60;
                      const timeStr = `${minutes}m ${seconds}s`;
                      const answered = (att.correctAnswers || 0) + (att.wrongAnswers || 0);
                      const accStr = answered > 0
                        ? `${Math.round(((att.correctAnswers || 0) / answered) * 100)}%`
                        : '0%';

                      return (
                        <tr key={att.id} className="admin-table-row">
                          <td>
                            <div className="candidate-cell">
                              <div className="candidate-avatar-small">
                                {att.candidateName ? att.candidateName.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div className="candidate-cell-info">
                                <span className="candidate-name-bold">{att.candidateName || 'Candidate'}</span>
                                <span className="candidate-email-muted">{att.candidateEmail || 'No email'}</span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="test-cell">
                              <span className="test-cell-title">{att.testTitle || 'Mock Test'}</span>
                              <span className="test-cell-category">{att.categoryName || 'General'}</span>
                            </div>
                          </td>

                          <td>
                            <div className="score-cell">
                              <span
                                className={`result-badge ${
                                  att.passed ? 'result-badge-passed' : 'result-badge-failed'
                                }`}
                              >
                                {att.passed ? '✓ PASSED' : '✕ FAILED'}
                              </span>
                              <span className="score-value-bold">
                                {att.score} pts ({att.percentage}%)
                              </span>
                            </div>
                          </td>

                          <td>
                            <span className="accuracy-cell-pill">{accStr}</span>
                          </td>

                          <td>
                            <span className="time-taken-cell">⏱️ {timeStr}</span>
                          </td>

                          <td>
                            <span className="date-cell">
                              {att.submittedAt ? new Date(att.submittedAt).toLocaleString() : 'Recent'}
                            </span>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <button
                              id={`btn-inspect-attempt-${att.id}`}
                              type="button"
                              className="btn btn-outline btn-sm btn-inspect-attempt"
                              onClick={() => handleOpenAttemptReview(att.id)}
                              title="Inspect question-by-question candidate scorecard"
                            >
                              <span>🔍</span>
                              <span>Inspect Review</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ============================================================
          TAB 3: ASSESSMENTS & TESTS MANAGEMENT
          ============================================================ */}
      {activeTab === 'tests' && (
        <div className="admin-tab-content">
          <section className="admin-section-box glass">
            <div className="admin-section-header">
              <div>
                <h3 className="admin-section-title">Mock Test Repository</h3>
                <p className="admin-section-desc">
                  Maintain question papers, update candidate enrollment, preview tests, or remove inactive assessments.
                </p>
              </div>

              {/* Seamless tab switch to Test Studio */}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => switchTab('studio')}
              >
                <span>➕</span>
                <span>Author in Test Studio</span>
              </button>
            </div>

            {/* Filters Bar */}
            <div className="admin-tests-filter-bar">
              {/* Category Chips */}
              <div className="category-chips-scroll">
                <button
                  className={`chip ${testCategoryFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setTestCategoryFilter('ALL')}
                >
                  All Categories ({tests.length})
                </button>
                {categories.map((c) => {
                  const countInCat = tests.filter((t) => t.categoryId === c.id).length;
                  return (
                    <button
                      key={c.id}
                      className={`chip ${String(testCategoryFilter) === String(c.id) ? 'active' : ''}`}
                      onClick={() => setTestCategoryFilter(String(c.id))}
                    >
                      <span>{c.icon}</span>
                      <span>{c.name}</span>
                      <span className="chip-count">({countInCat})</span>
                    </button>
                  );
                })}
              </div>

              {/* Search & Access Filter & View Switch */}
              <div className="admin-tests-subfilter-row">
                <div className="search-bar-wrap inline-search">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="🔍 Filter tests by title or keyword..."
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                  />
                  {testSearch && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setTestSearch('')}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="filter-pill-group">
                  <button
                    className={`filter-pill-btn ${testAccessFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setTestAccessFilter('ALL')}
                  >
                    All Access
                  </button>
                  <button
                    className={`filter-pill-btn ${testAccessFilter === 'COMMON' ? 'active' : ''}`}
                    onClick={() => setTestAccessFilter('COMMON')}
                  >
                    🌐 Public ({tests.filter((t) => t.accessType === 'COMMON').length})
                  </button>
                  <button
                    className={`filter-pill-btn ${testAccessFilter === 'ASSIGNED' ? 'active' : ''}`}
                    onClick={() => setTestAccessFilter('ASSIGNED')}
                  >
                    🎯 Assigned ({tests.filter((t) => t.accessType === 'ASSIGNED').length})
                  </button>
                </div>

                <div className="view-mode-toggle">
                  <button
                    type="button"
                    className={`view-toggle-btn ${testViewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setTestViewMode('table')}
                    title="Dense Table View"
                  >
                    ☰ Table
                  </button>
                  <button
                    type="button"
                    className={`view-toggle-btn ${testViewMode === 'cards' ? 'active' : ''}`}
                    onClick={() => setTestViewMode('cards')}
                    title="Visual Card Grid"
                  >
                    ⊞ Cards
                  </button>
                </div>
              </div>
            </div>

            {/* Test Content */}
            {loadingData ? (
              <div className="admin-table-loading">
                <span className="spinner">⏳</span> Loading mock tests...
              </div>
            ) : filteredTests.length === 0 ? (
              <div className="admin-table-empty">
                <span className="empty-icon">🔍</span>
                <h4>No assessments found</h4>
                <p>Adjust your search filters or author a new test in the Test Studio tab.</p>
              </div>
            ) : testViewMode === 'table' ? (
              /* Professional Dense Data Grid */
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Test Title & Category</th>
                      <th>Difficulty</th>
                      <th>Duration</th>
                      <th>Questions</th>
                      <th>Pass Mark</th>
                      <th>Audience Access</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTests.map((test) => {
                      const enrolledLabel =
                        test.accessType === 'COMMON'
                          ? '🌐 Public (All)'
                          : `🎯 ${test.assignedUserCount || 0} candidate(s)`;

                      return (
                        <tr key={test.id} className="admin-table-row">
                          <td>
                            <div className="test-cell">
                              <span className="test-cell-title">{test.title}</span>
                              <span className="test-cell-category">{test.categoryName}</span>
                            </div>
                          </td>

                          <td>
                            <span
                              className={`test-badge ${
                                test.difficulty === 'EASY'
                                  ? 'badge-easy'
                                  : test.difficulty === 'HARD'
                                  ? 'badge-hard'
                                  : 'badge-medium'
                              }`}
                            >
                              {test.difficulty || 'MEDIUM'}
                            </span>
                          </td>

                          <td>
                            <span className="meta-text">⏱️ {test.durationMinutes} mins</span>
                          </td>

                          <td>
                            <span className="meta-text">❓ {test.totalQuestions} Qs</span>
                          </td>

                          <td>
                            <span className="meta-text">
                              🎯 {test.passingMarks}/{test.totalMarks}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className={`access-pill-btn ${
                                test.accessType === 'COMMON' ? 'access-common' : 'access-assigned'
                              }`}
                              onClick={() => setManagingEnrollmentTest(test)}
                              title="Click to manage candidate enrollment"
                            >
                              {enrolledLabel} ⚙️
                            </button>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <div className="admin-row-actions">
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => onStartTest(test.id)}
                                title="Preview this test as a student"
                              >
                                🚀 Preview
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => setManagingEnrollmentTest(test)}
                                title="Manage Candidate Enrollment"
                              >
                                👥 Students
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger-outline btn-sm"
                                onClick={() => handleDeleteTest(test.id, test.title)}
                                disabled={deletingId === test.id}
                                title="Permanently delete test"
                              >
                                {deletingId === test.id ? '⏳' : '🗑️'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Card Grid Mode */
              <div className="test-grid" style={{ marginTop: '20px' }}>
                {filteredTests.map((test) => (
                  <div key={test.id} className="glass test-card">
                    <div className="test-card-body">
                      <div className="test-card-top">
                        <span className="test-category-tag">{test.categoryName}</span>
                        <span
                          className={`test-badge ${
                            test.difficulty === 'EASY'
                              ? 'badge-easy'
                              : test.difficulty === 'HARD'
                              ? 'badge-hard'
                              : 'badge-medium'
                          }`}
                        >
                          {test.difficulty || 'MEDIUM'}
                        </span>
                      </div>
                      <h3 className="test-title">{test.title}</h3>
                      <p className="test-desc">{test.description || 'Mock test assessment.'}</p>
                    </div>

                    <div className="test-card-footer">
                      <div className="test-meta">
                        <div className="meta-item">
                          <span>⏱️</span>
                          <span>{test.durationMinutes} mins</span>
                        </div>
                        <div className="meta-item">
                          <span>❓</span>
                          <span>{test.totalQuestions} Qs</span>
                        </div>
                        <div className="meta-item">
                          <span>🎯</span>
                          <span>{test.passingMarks}/{test.totalMarks}</span>
                        </div>
                      </div>

                      <div className="test-card-admin-actions">
                        <button
                          type="button"
                          className="btn btn-primary btn-action-preview"
                          onClick={() => onStartTest(test.id)}
                        >
                          Launch Preview 🚀
                        </button>
                        <div className="test-card-admin-subactions">
                          <button
                            type="button"
                            className="btn btn-secondary btn-action-enrolled"
                            onClick={() => setManagingEnrollmentTest(test)}
                          >
                            👥 {test.accessType === 'COMMON' ? 'All' : test.assignedUserCount || 0}
                          </button>
                          <button
                            type="button"
                            className="btn btn-action-delete"
                            onClick={() => handleDeleteTest(test.id, test.title)}
                            disabled={deletingId === test.id}
                          >
                            {deletingId === test.id ? '⏳' : '🗑️ Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ============================================================
          TAB 4: STUDENT DIRECTORY & STUDENT OPTIONS
          ============================================================ */}
      {activeTab === 'students' && (
        <div className="admin-tab-content">
          <section className="admin-section-box glass">
            <div className="admin-section-header">
              <div>
                <h3 className="admin-section-title">Candidate Directory & Student Management</h3>
                <p className="admin-section-desc">
                  Manage individual student enrollment access, review personalized exam scorecards, and monitor performance.
                </p>
              </div>

              <div className="search-bar-wrap inline-search">
                <input
                  type="text"
                  className="search-input"
                  placeholder="🔍 Search candidate by name or email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
                {studentSearch && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setStudentSearch('')}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {registeredStudents.length === 0 ? (
              <div className="admin-table-empty">
                <span className="empty-icon">👥</span>
                <h4>No registered students found</h4>
                <p>New candidates who sign up will appear here automatically.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Candidate Name</th>
                      <th>Email Address</th>
                      <th>Account Role</th>
                      <th>Tests Taken</th>
                      <th>Avg Score</th>
                      <th>Pass Rate</th>
                      <th style={{ textAlign: 'right' }}>Student Options</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredStudents.map((s) => {
                      const studentAttempts = attempts.filter(
                        (a) => a.candidateEmail === s.email || a.candidateName === s.fullName
                      );
                      const totalTaken = studentAttempts.length;
                      const passedCount = studentAttempts.filter((a) => a.passed).length;
                      const sPassRate = totalTaken > 0 ? Math.round((passedCount / totalTaken) * 100) : 0;
                      const sAvgScore = totalTaken > 0
                        ? (studentAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / totalTaken).toFixed(1)
                        : '—';

                      return (
                        <tr key={s.id} className="admin-table-row">
                          <td>
                            <div className="candidate-cell">
                              <div className="candidate-avatar-small">
                                {s.fullName ? s.fullName.charAt(0).toUpperCase() : 'S'}
                              </div>
                              <span className="candidate-name-bold">{s.fullName}</span>
                            </div>
                          </td>

                          <td>
                            <span className="candidate-email-muted">{s.email}</span>
                          </td>

                          <td>
                            <span className="candidate-role-pill role-student">STUDENT</span>
                          </td>

                          <td>
                            <span className="meta-text">{totalTaken} attempt(s)</span>
                          </td>

                          <td>
                            <span className="score-value-bold">{sAvgScore !== '—' ? `${sAvgScore}%` : '—'}</span>
                          </td>

                          <td>
                            {totalTaken > 0 ? (
                              <span
                                className={`result-badge ${
                                  sPassRate >= 50 ? 'result-badge-passed' : 'result-badge-failed'
                                }`}
                              >
                                {sPassRate}% ({passedCount}/{totalTaken})
                              </span>
                            ) : (
                              <span className="meta-text">No attempts</span>
                            )}
                          </td>

                          {/* Student Options Action Buttons */}
                          <td style={{ textAlign: 'right' }}>
                            <div className="admin-row-actions">
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => setManagingStudentTests(s)}
                                title={`Manage tests assigned to ${s.fullName}`}
                              >
                                📋 Manage Access
                              </button>

                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => setViewingStudentScorecards(s)}
                                title={`View scorecards & attempts for ${s.fullName}`}
                              >
                                📊 Scorecards ({totalTaken})
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ============================================================
          TAB 5: FULL-PAGE TEST CREATOR STUDIO
          ============================================================ */}
      {activeTab === 'studio' && (
        <div className="admin-tab-content">
          <form onSubmit={handlePublishStudioTest} className="test-studio-form">
            {/* Studio Header Bar */}
            <div className="studio-top-banner glass">
              <div>
                <span className="studio-pill">✨ MOCK TEST CREATION STUDIO</span>
                <h2 className="studio-title">Author Assessment Exam</h2>
                <p className="studio-desc">
                  Design examination questions, establish passing criteria, and assign target student audiences.
                </p>
              </div>

              {/* Template Quick Presets */}
              <div className="studio-presets-container">
                <span className="presets-label">⚡ Quick Presets:</span>
                <div className="preset-buttons">
                  <button
                    type="button"
                    className="preset-btn"
                    onClick={() => handleLoadTemplate('JAVA')}
                    title="Load Java Concurrency sample questions"
                  >
                    ☕ Java 21 Loom
                  </button>
                  <button
                    type="button"
                    className="preset-btn"
                    onClick={() => handleLoadTemplate('SQL')}
                    title="Load PostgreSQL sample questions"
                  >
                    🗄️ SQL & Indexing
                  </button>
                  <button
                    type="button"
                    className="preset-btn"
                    onClick={() => handleLoadTemplate('REACT')}
                    title="Load React 19 sample questions"
                  >
                    ⚛️ React 19 State
                  </button>
                </div>
              </div>
            </div>

            {studioError && (
              <div className="auth-error-banner" role="alert">
                <span>⚠️</span>
                <span>{studioError}</span>
              </div>
            )}

            {studioSuccess && (
              <div className="enrollment-success-banner" role="alert">
                <span>✅</span>
                <span>{studioSuccess}</span>
              </div>
            )}

            {/* Section 1: Specifications */}
            <div className="form-section-box glass">
              <h4 className="section-title">1. Test Specifications & Guidelines</h4>
              
              <div className="form-grid-3">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    className="form-control"
                    value={studioCategoryId}
                    onChange={(e) => setStudioCategoryId(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Difficulty Tier</label>
                  <select
                    className="form-control"
                    value={studioDifficulty}
                    onChange={(e) => setStudioDifficulty(e.target.value)}
                  >
                    <option value="EASY">EASY (Foundational)</option>
                    <option value="MEDIUM">MEDIUM (Intermediate)</option>
                    <option value="HARD">HARD (Advanced / Architectural)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Duration (Minutes)</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    max="180"
                    value={studioDuration}
                    onChange={(e) => setStudioDuration(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Examination Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Distributed Caching & Redis Patterns"
                  value={studioTitle}
                  onChange={(e) => setStudioTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description / Syllabus Highlights</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Summarize key learning objectives and topics tested..."
                  value={studioDescription}
                  onChange={(e) => setStudioDescription(e.target.value)}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Passing Marks</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    max="500"
                    value={studioPassingMarks}
                    onChange={(e) => setStudioPassingMarks(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Total Questions & Computed Marks</label>
                  <div className="computed-marks-pill">
                    <span>❓ <strong>{studioQuestions.length}</strong> Questions</span>
                    <span>•</span>
                    <span>🎯 <strong>{totalCalculatedStudioMarks}</strong> Total Marks</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Candidate Enrollment */}
            <div className="form-section-box glass">
              <h4 className="section-title">2. Target Candidate Enrollment</h4>
              <p className="form-section-desc">
                Make this mock test public for <strong>All Users</strong> or assign it selectively to target students.
              </p>
              <CandidatePicker
                isAllUsers={studioIsAllUsers}
                selectedUserIds={studioSelectedUserIds}
                onChange={({ isAllUsers: all, selectedUserIds: ids }) => {
                  setStudioIsAllUsers(all);
                  setStudioSelectedUserIds(ids);
                }}
              />
            </div>

            {/* Section 3: Question Studio Stack */}
            <div className="form-section-box glass">
              <div className="studio-questions-header">
                <div>
                  <h4 className="section-title">3. Question Builder Studio</h4>
                  <p className="form-section-desc">
                    Add questions, mark options, specify points, and provide detailed explanations shown during answer review.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleAddQuestion}
                >
                  ➕ Add Question ({studioQuestions.length})
                </button>
              </div>

              <div className="questions-stack">
                {studioQuestions.map((q, qIndex) => (
                  <div key={qIndex} className="question-editor-card glass">
                    {/* Top bar with Move Up/Down, Duplicate, Delete */}
                    <div className="q-card-top">
                      <div className="q-index-wrap">
                        <span className="q-index-badge">Question {qIndex + 1}</span>
                        <div className="q-marks-pill">
                          <label>Marks:</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            className="q-marks-input"
                            value={q.marks || 1}
                            onChange={(e) => handleUpdateQuestion(qIndex, 'marks', Number(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="q-card-actions">
                        <button
                          type="button"
                          className="btn-q-icon"
                          disabled={qIndex === 0}
                          onClick={() => handleMoveQuestion(qIndex, 'up')}
                          title="Move Up"
                        >
                          ⬆️
                        </button>
                        <button
                          type="button"
                          className="btn-q-icon"
                          disabled={qIndex === studioQuestions.length - 1}
                          onClick={() => handleMoveQuestion(qIndex, 'down')}
                          title="Move Down"
                        >
                          ⬇️
                        </button>
                        <button
                          type="button"
                          className="btn-q-icon"
                          onClick={() => handleDuplicateQuestion(qIndex)}
                          title="Duplicate Question"
                        >
                          📋 Copy
                        </button>
                        {studioQuestions.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove-q"
                            onClick={() => handleRemoveQuestion(qIndex)}
                            title="Remove Question"
                          >
                            ✕ Remove
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Question Prompt */}
                    <div className="form-group">
                      <label>Question Prompt / Problem Statement</label>
                      <textarea
                        className="form-control q-textarea"
                        rows="2"
                        placeholder="Enter question text here..."
                        value={q.questionText}
                        onChange={(e) => handleUpdateQuestion(qIndex, 'questionText', e.target.value)}
                        required
                      />
                    </div>

                    {/* Options Editor */}
                    <div className="options-editor-section">
                      <label className="options-section-label">
                        Options (Select the radio button for the correct answer):
                      </label>
                      <div className="options-editor-grid">
                        {q.options.map((opt, optIndex) => (
                          <div
                            key={opt.optionKey}
                            className={`option-editor-row ${opt.isCorrect ? 'correct-choice' : ''}`}
                          >
                            <label className="option-radio-wrap" title="Mark as correct answer">
                              <input
                                type="radio"
                                name={`studio_correct_opt_${qIndex}`}
                                checked={opt.isCorrect}
                                onChange={() => handleSetCorrectOption(qIndex, optIndex)}
                              />
                              <span className="option-key-label">{opt.optionKey}</span>
                            </label>
                            <input
                              type="text"
                              className="form-control option-text-input"
                              placeholder={`Option ${opt.optionKey} text...`}
                              value={opt.optionText}
                              onChange={(e) => handleUpdateOption(qIndex, optIndex, e.target.value)}
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
                    <div className="form-group" style={{ marginTop: '14px' }}>
                      <label>Explanation / Solution Rationale (Displayed during result review):</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Why is this option correct? (Optional)"
                        value={q.explanation || ''}
                        onChange={(e) => handleUpdateQuestion(qIndex, 'explanation', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="studio-bottom-add">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleAddQuestion}
                >
                  ➕ Add Another Question
                </button>
              </div>
            </div>

            {/* Studio Publish Sticky Bar */}
            <div className="studio-actions-footer glass">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => switchTab('tests')}
              >
                Cancel & Return
              </button>

              <button
                id="btn-publish-studio"
                type="submit"
                className="btn btn-primary btn-publish-large"
                disabled={studioSubmitting}
              >
                {studioSubmitting ? 'Publishing Test...' : 'Publish Mock Test to ExamPulse 🚀'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================
          MODAL 1: INSPECTION MODAL FOR CANDIDATE ATTEMPT
          ============================================================ */}
      {inspectingAttempt && (
        <div
          className="modal-backdrop"
          onClick={() => setInspectingAttempt(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-content admin-inspect-modal-card glass"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-icon">🔍</span>
                <div>
                  <h2 className="modal-title">Candidate Answer Sheet Inspection</h2>
                  <p className="modal-subtitle">
                    Candidate: <strong>{inspectingAttempt.candidateName}</strong> ({inspectingAttempt.candidateEmail || 'Guest'}) • Test: <strong>{inspectingAttempt.testTitle}</strong>
                  </p>
                </div>
              </div>
              <button
                className="btn-close"
                onClick={() => setInspectingAttempt(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Summary Metrics Bar */}
            <div className="inspect-metrics-bar">
              <div className="inspect-metric-pill">
                <span className="label">Result:</span>
                <span
                  className={`result-badge ${
                    inspectingAttempt.passed ? 'result-badge-passed' : 'result-badge-failed'
                  }`}
                >
                  {inspectingAttempt.passed ? '✓ PASSED' : '✕ FAILED'}
                </span>
              </div>
              <div className="inspect-metric-pill">
                <span className="label">Score:</span>
                <strong>{inspectingAttempt.score} / {inspectingAttempt.totalMarks} ({inspectingAttempt.percentage}%)</strong>
              </div>
              <div className="inspect-metric-pill">
                <span className="label">Accuracy:</span>
                <strong>{inspectingAttempt.accuracy || 0}%</strong>
              </div>
              <div className="inspect-metric-pill">
                <span className="label">Correct / Wrong:</span>
                <span style={{ color: '#34d399' }}>✓ {inspectingAttempt.correctAnswers}</span> /{' '}
                <span style={{ color: '#f87171' }}>✕ {inspectingAttempt.wrongAnswers}</span>
              </div>
              <div className="inspect-metric-pill">
                <span className="label">Unattempted:</span>
                <strong>{inspectingAttempt.unattempted}</strong>
              </div>
            </div>

            {/* Questions Inspection List */}
            <div className="inspect-questions-list">
              {(inspectingAttempt.review || inspectingAttempt.questionReviews || []).map((rev, idx) => (
                <div
                  key={rev.questionId || idx}
                  className={`inspect-q-item glass ${
                    !rev.isAttempted
                      ? 'q-unattempted'
                      : rev.isCorrect
                      ? 'q-correct'
                      : 'q-wrong'
                  }`}
                >
                  <div className="inspect-q-header">
                    <span className="q-num-tag">Q{idx + 1}</span>
                    <span className="inspect-q-status">
                      {!rev.isAttempted
                        ? '⚪ Unattempted'
                        : rev.isCorrect
                        ? '✓ Correct'
                        : '✕ Incorrect'}
                    </span>
                    <span className="q-points-tag">{rev.marks} marks</span>
                  </div>

                  <p className="inspect-q-text">{rev.questionText}</p>

                  <div className="inspect-options-grid">
                    {rev.options?.map((opt) => {
                      const isUserSelected = opt.isSelected || opt.isSelectedByUser;
                      const isCorrectAnswer = opt.isCorrect;

                      let optClass = '';
                      if (isCorrectAnswer) optClass = 'opt-correct';
                      if (isUserSelected && !isCorrectAnswer) optClass = 'opt-wrong-choice';

                      return (
                        <div key={opt.id} className={`inspect-opt-row ${optClass}`}>
                          <span className="opt-key">{opt.optionKey}</span>
                          <span className="opt-text">{opt.optionText}</span>
                          {isCorrectAnswer && (
                            <span className="opt-badge-correct">✓ Correct Key</span>
                          )}
                          {isUserSelected && !isCorrectAnswer && (
                            <span className="opt-badge-selected">✕ Candidate Picked</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {rev.explanation && (
                    <div className="inspect-explanation-box">
                      <span className="exp-icon">💡</span>
                      <div>
                        <strong>Explanation: </strong>
                        <span>{rev.explanation}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setInspectingAttempt(null)}
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 2: MANAGE TEST ENROLLMENT (TEST-CENTRIC)
          ============================================================ */}
      {managingEnrollmentTest && (
        <ManageEnrollmentModal
          test={managingEnrollmentTest}
          onClose={() => setManagingEnrollmentTest(null)}
          onUpdated={() => {
            fetchAllAdminData();
            if (onRefreshCategories) onRefreshCategories();
          }}
        />
      )}

      {/* ============================================================
          MODAL 3: STUDENT OPTIONS -> MANAGE ENROLLED TESTS FOR STUDENT
          ============================================================ */}
      {managingStudentTests && (
        <ManageStudentAccessModal
          student={managingStudentTests}
          allTests={tests}
          onClose={() => setManagingStudentTests(null)}
          onUpdated={() => {
            fetchAllAdminData();
          }}
        />
      )}

      {/* ============================================================
          MODAL 4: STUDENT OPTIONS -> VIEW STUDENT EXAM SCORECARDS
          ============================================================ */}
      {viewingStudentScorecards && (
        <StudentScorecardsModal
          student={viewingStudentScorecards}
          attempts={attempts.filter(
            (a) =>
              a.candidateEmail === viewingStudentScorecards.email ||
              a.candidateName === viewingStudentScorecards.fullName
          )}
          onInspectAttempt={handleOpenAttemptReview}
          onClose={() => setViewingStudentScorecards(null)}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// SUB-COMPONENT: STUDENT ENROLLED TESTS MODAL
// ------------------------------------------------------------------
function ManageStudentAccessModal({ student, allTests, onClose, onUpdated }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Map of testId -> boolean indicating if student is enrolled
  const [enrollmentMap, setEnrollmentMap] = useState({});
  // Map of testId -> original assigned user IDs array
  const [originalUserIdsMap, setOriginalUserIdsMap] = useState({});

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const assignedTests = allTests.filter((t) => t.accessType === 'ASSIGNED');

    // Fetch assigned users for all ASSIGNED tests in parallel
    Promise.all(
      assignedTests.map(async (test) => {
        try {
          const assignedUsers = await testApi.getAssignedUsers(test.id);
          const userIds = (assignedUsers || []).map((u) => u.id);
          return { testId: test.id, userIds };
        } catch {
          return { testId: test.id, userIds: [] };
        }
      })
    )
      .then((results) => {
        if (!isMounted) return;
        const eMap = {};
        const uMap = {};
        results.forEach(({ testId, userIds }) => {
          uMap[testId] = userIds;
          eMap[testId] = userIds.includes(student.id);
        });
        setEnrollmentMap(eMap);
        setOriginalUserIdsMap(uMap);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [student.id, allTests]);

  const handleToggleTest = (testId) => {
    setEnrollmentMap((prev) => ({
      ...prev,
      [testId]: !prev[testId],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const assignedTests = allTests.filter((t) => t.accessType === 'ASSIGNED');
      const updatePromises = [];

      for (const test of assignedTests) {
        const currentlySelected = !!enrollmentMap[test.id];
        const originallySelected = (originalUserIdsMap[test.id] || []).includes(student.id);

        if (currentlySelected !== originallySelected) {
          let updatedUserIds = [...(originalUserIdsMap[test.id] || [])];
          if (currentlySelected) {
            if (!updatedUserIds.includes(student.id)) updatedUserIds.push(student.id);
          } else {
            updatedUserIds = updatedUserIds.filter((id) => id !== student.id);
          }

          updatePromises.push(
            testApi.updateEnrollment(test.id, {
              accessType: 'ASSIGNED',
              assignedUserIds: updatedUserIds,
            })
          );
        }
      }

      await Promise.all(updatePromises);
      setSuccessMsg(`Test enrollment successfully updated for ${student.fullName}!`);
      setTimeout(() => {
        if (onUpdated) onUpdated();
        onClose();
      }, 700);
    } catch (err) {
      setError(err.message || 'Failed to update student test access');
      setSaving(false);
    }
  };

  const assignedTests = allTests.filter((t) => t.accessType === 'ASSIGNED');
  const commonTests = allTests.filter((t) => t.accessType === 'COMMON');

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content student-access-modal-card glass" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">📋</span>
            <div>
              <h2 className="modal-title">Manage Student Test Access</h2>
              <p className="modal-subtitle">
                Student: <strong>{student.fullName}</strong> ({student.email})
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

        {successMsg && (
          <div className="enrollment-success-banner" role="alert">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="student-access-form">
          <div className="access-info-box">
            <span className="info-icon">💡</span>
            <div>
              <strong>Targeted Mock Tests:</strong> Toggle checkboxes below to enroll or withdraw this candidate from specific tests.
            </div>
          </div>

          {loading ? (
            <div className="admin-table-loading">
              <span className="spinner">⏳</span> Checking candidate test enrollments...
            </div>
          ) : assignedTests.length === 0 ? (
            <div className="admin-table-empty" style={{ padding: '20px' }}>
              <p>No targeted/assigned mock tests currently exist. All current tests are public to all students.</p>
            </div>
          ) : (
            <div className="student-test-access-list">
              {assignedTests.map((test) => {
                const isEnrolled = !!enrollmentMap[test.id];

                return (
                  <div
                    key={test.id}
                    className={`student-access-item ${isEnrolled ? 'enrolled' : ''}`}
                    onClick={() => handleToggleTest(test.id)}
                  >
                    <div className="student-access-checkbox-wrap">
                      <input
                        type="checkbox"
                        checked={isEnrolled}
                        onChange={() => handleToggleTest(test.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="candidate-checkbox"
                      />
                      <div className="test-access-meta">
                        <span className="test-access-title">{test.title}</span>
                        <span className="test-access-category">
                          {test.categoryName} • {test.durationMinutes} mins • {test.difficulty}
                        </span>
                      </div>
                    </div>

                    <span className={`access-status-pill ${isEnrolled ? 'enrolled-pill' : 'not-enrolled-pill'}`}>
                      {isEnrolled ? '✓ Enrolled' : 'Not Enrolled'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Public Tests Notice */}
          {commonTests.length > 0 && (
            <div className="public-tests-notice">
              <span>🌐 Public Mock Tests ({commonTests.length}): </span>
              <span className="public-tests-names">
                {commonTests.map((t) => t.title).join(', ')}
              </span>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                (Public tests are accessible to all registered students without individual enrollment)
              </div>
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || loading}
              style={{ minWidth: '160px' }}
            >
              {saving ? 'Saving Changes...' : 'Save Enrolled Tests ✓'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// SUB-COMPONENT: STUDENT SCORECARDS & ATTEMPTS MODAL
// ------------------------------------------------------------------
function StudentScorecardsModal({ student, attempts = [], onInspectAttempt, onClose }) {
  const totalAttempts = attempts.length;
  const passedCount = attempts.filter((a) => a.passed).length;
  const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;
  const avgScore = totalAttempts > 0
    ? (attempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / totalAttempts).toFixed(1)
    : '—';

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content student-scorecards-modal-card glass" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">📊</span>
            <div>
              <h2 className="modal-title">Student Scorecards & Examination History</h2>
              <p className="modal-subtitle">
                Candidate: <strong>{student.fullName}</strong> ({student.email})
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Student Performance Metrics Bar */}
        <div className="inspect-metrics-bar">
          <div className="inspect-metric-pill">
            <span className="label">Total Attempts:</span>
            <strong>{totalAttempts}</strong>
          </div>
          <div className="inspect-metric-pill">
            <span className="label">Passed:</span>
            <strong style={{ color: '#34d399' }}>{passedCount} / {totalAttempts}</strong>
          </div>
          <div className="inspect-metric-pill">
            <span className="label">Pass Rate:</span>
            <strong style={{ color: passRate >= 50 ? '#34d399' : '#f87171' }}>{passRate}%</strong>
          </div>
          <div className="inspect-metric-pill">
            <span className="label">Average Score:</span>
            <strong>{avgScore !== '—' ? `${avgScore}%` : '—'}</strong>
          </div>
        </div>

        {/* Attempts Table */}
        {attempts.length === 0 ? (
          <div className="admin-table-empty">
            <span className="empty-icon">📝</span>
            <h4>No exam attempts recorded</h4>
            <p>This student has not yet submitted any mock test attempts.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mock Test</th>
                  <th>Result</th>
                  <th>Score</th>
                  <th>Accuracy</th>
                  <th>Time Taken</th>
                  <th>Submitted Date</th>
                  <th style={{ textAlign: 'right' }}>Review</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((att) => {
                  const minutes = Math.floor((att.timeTakenSeconds || 0) / 60);
                  const seconds = (att.timeTakenSeconds || 0) % 60;
                  const timeStr = `${minutes}m ${seconds}s`;
                  const answered = (att.correctAnswers || 0) + (att.wrongAnswers || 0);
                  const accStr = answered > 0
                    ? `${Math.round(((att.correctAnswers || 0) / answered) * 100)}%`
                    : '0%';

                  return (
                    <tr key={att.id} className="admin-table-row">
                      <td>
                        <div className="test-cell">
                          <span className="test-cell-title">{att.testTitle}</span>
                          <span className="test-cell-category">{att.categoryName || 'General'}</span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`result-badge ${
                            att.passed ? 'result-badge-passed' : 'result-badge-failed'
                          }`}
                        >
                          {att.passed ? '✓ PASSED' : '✕ FAILED'}
                        </span>
                      </td>

                      <td>
                        <span className="score-value-bold">{att.score} pts ({att.percentage}%)</span>
                      </td>

                      <td>
                        <span className="accuracy-cell-pill">{accStr}</span>
                      </td>

                      <td>
                        <span className="time-taken-cell">⏱️ {timeStr}</span>
                      </td>

                      <td>
                        <span className="date-cell">
                          {att.submittedAt ? new Date(att.submittedAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm btn-inspect-attempt"
                          onClick={() => {
                            onInspectAttempt(att.id);
                          }}
                        >
                          <span>🔍</span>
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close Scorecards
          </button>
        </div>
      </div>
    </div>
  );
}
