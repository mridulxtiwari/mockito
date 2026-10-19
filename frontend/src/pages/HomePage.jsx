import React, { useState, useEffect } from 'react';
import { testApi } from '../api/testApi';

export default function HomePage({ onStartTest, categories, onRefreshCategories }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadTests = async (catId) => {
    setLoading(true);
    try {
      const data = await testApi.getTests(catId);
      setTests(data || []);
    } catch (err) {
      console.error('Failed to load tests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests(selectedCategory);
  }, [selectedCategory]);

  const filteredTests = tests.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <section className="hero">
        <div className="hero-tag">✨ REAL-TIME ONLINE EXAMINATION ENGINE</div>
        <h1>Master Your Technical & Aptitude Tests</h1>
        <p>
          Timed mock examinations with live countdowns, question navigation palettes, instant evaluation, and in-depth solution reviews.
        </p>

        {/* Category Filters */}
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
        <div style={{ maxWidth: '480px', margin: '0 auto 20px' }}>
          <input
            type="text"
            placeholder="🔍 Search tests by topic, framework, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: '#fff',
              fontSize: '0.95rem',
              outline: 'none',
              backdropFilter: 'blur(10px)',
            }}
          />
        </div>
      </section>

      {/* Tests Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '12px' }}>⏳</div>
          <p>Loading available mock tests...</p>
        </div>
      ) : filteredTests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            No mock tests found matching your criteria.
          </p>
        </div>
      ) : (
        <div className="test-grid">
          {filteredTests.map((test) => {
            const diffClass =
              test.difficulty === 'EASY'
                ? 'badge-easy'
                : test.difficulty === 'HARD'
                ? 'badge-hard'
                : 'badge-medium';

            return (
              <div key={test.id} className="glass test-card">
                <div>
                  <div className="test-card-top">
                    <span style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: 600 }}>
                      {test.categoryName}
                    </span>
                    <span className={`test-badge ${diffClass}`}>
                      {test.difficulty || 'MEDIUM'}
                    </span>
                  </div>

                  <h3>{test.title}</h3>
                  <p>{test.description || 'Standard technical assessment test.'}</p>
                </div>

                <div>
                  <div className="test-meta">
                    <div className="meta-item">
                      <span>⏱️</span>
                      <span><strong>{test.durationMinutes}</strong> mins</span>
                    </div>
                    <div className="meta-item">
                      <span>❓</span>
                      <span><strong>{test.totalQuestions}</strong> questions</span>
                    </div>
                    <div className="meta-item">
                      <span>🎯</span>
                      <span>Pass: <strong>{test.passingMarks}/{test.totalMarks}</strong></span>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => onStartTest(test.id)}
                  >
                    Start Mock Test 🚀
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
