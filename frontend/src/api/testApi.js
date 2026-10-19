const API_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '') + '/api';

/**
 * Standard fetch helper with error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const json = await response.json();

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
};
