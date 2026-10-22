import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ onClose, onSuccess, initialMode = 'login' }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('ROLE_USER');

  // UI state
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let authUser;
      if (mode === 'login') {
        authUser = await login(email, password);
      } else {
        authUser = await register({ fullName, email, password, role });
      }
      if (onSuccess) onSuccess(authUser);
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="auth-brand-badge">🔐</div>
            <div>
              <h2 className="modal-title">
                {mode === 'login' ? 'Sign In to ExamPulse' : 'Create Candidate Account'}
              </h2>
              <p className="modal-subtitle">
                {mode === 'login'
                  ? 'Access and take your technical examinations'
                  : 'Register now to take tests and track your assessment scorecard'}
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Tab switchers */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setError(null);
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="auth-error-banner" role="alert">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="reg-fullname">
                <span>👤</span> Full Name
              </label>
              <input
                id="reg-fullname"
                type="text"
                className="form-control"
                placeholder="e.g. Sarah Connor"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">
              <span>✉️</span> Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              className="form-control"
              placeholder="candidate@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">
              <span>🔒</span> Password
            </label>
            <div className="password-input-wrap">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className="form-control password-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === 'register' ? 6 : 1}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
            {mode === 'register' && (
              <span className="field-hint">Minimum 6 characters</span>
            )}
          </div>

          <div className="modal-actions">
            <button id="btn-cancel-auth" type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              id="btn-submit-auth"
              type="submit"
              className="btn btn-primary btn-submit-auth"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-loading-spinner">Signing in...</span>
              ) : mode === 'login' ? (
                'Sign In →'
              ) : (
                'Create Account & Sign In →'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
