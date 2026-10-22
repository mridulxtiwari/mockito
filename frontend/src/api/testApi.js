const API_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '') + '/api';

/**
 * Standard fetch helper with error handling and automatic JWT bearer attachment
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('auth_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });

    // Handle empty response or unauthorized
    if (response.status === 401) {
      // Clear token if invalid or expired
      if (token && !endpoint.includes('/auth/login')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.dispatchEvent(new CustomEvent('auth-expired'));
      }
    }

    let json;
    try {
      json = await response.json();
    } catch {
      throw new Error(`Server returned status ${response.status}`);
    }

    if (!response.ok || !json.success) {
      throw new Error(json.message || `Request failed with status ${response.status}`);
    }

    return json.data;
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, error);
    throw error;
  }
}

export const testApi = {
  // Authentication
  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => request('/auth/me'),

  // User Management (Admin only)
  getUsers: () => request('/users'),

  // Get all categories
  getCategories: () => request('/categories'),

  // Get tests (optionally filtered by categoryId)
  getTests: (categoryId) => {
    const query = categoryId ? `?categoryId=${categoryId}` : '';
    return request(`/tests${query}`);
  },

  // Get single test summary
  getTestSummary: (testId) => request(`/tests/${testId}`),

  // Start exam - loads questions without answer keys
  startExam: (testId) => request(`/tests/${testId}/start`),

  // Submit completed exam
  submitExam: (payload) =>
    request('/attempts/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Get result and review for an attempt
  getAttemptResult: (attemptId) => request(`/attempts/${attemptId}/result`),

  // Get all attempts history
  getAttemptHistory: () => request('/attempts/history'),

  // Create a new test (Admin / Creator mode)
  createTest: (payload) =>
    request('/tests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Delete test (Admin only)
  deleteTest: (testId) =>
    request(`/tests/${testId}`, {
      method: 'DELETE',
    }),

  // Get enrolled users for test (Admin only)
  getAssignedUsers: (testId) => request(`/tests/${testId}/assigned-users`),

  // Update enrollment for test (Admin only)
  updateEnrollment: (testId, payload) =>
    request(`/tests/${testId}/assigned-users`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};
