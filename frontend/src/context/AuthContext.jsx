import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { testApi } from '../api/testApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('auth_token');
      if (savedToken) {
        try {
          const freshUser = await testApi.getMe();
          setUser(freshUser);
          localStorage.setItem('auth_user', JSON.stringify(freshUser));
        } catch (err) {
          console.warn('Session verification failed, logging out:', err.message);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const authData = await testApi.login({ email, password });
    if (authData && authData.token) {
      localStorage.setItem('auth_token', authData.token);
      localStorage.setItem('auth_user', JSON.stringify(authData.user));
      setToken(authData.token);
      setUser(authData.user);
      return authData.user;
    }
    throw new Error('Authentication response was invalid');
  }, []);

  const register = useCallback(async (payload) => {
    const authData = await testApi.register(payload);
    if (authData && authData.token) {
      localStorage.setItem('auth_token', authData.token);
      localStorage.setItem('auth_user', JSON.stringify(authData.user));
      setToken(authData.token);
      setUser(authData.user);
      return authData.user;
    }
    throw new Error('Registration response was invalid');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN';

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isAdmin,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
