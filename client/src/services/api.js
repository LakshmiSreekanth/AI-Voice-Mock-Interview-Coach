const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('intervai_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  if (!res.ok) {
    let errorMsg = 'An unexpected error occurred';
    try {
      const data = await res.json();
      errorMsg = data.error || errorMsg;
    } catch (e) {
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('intervai_token', data.token);
      localStorage.setItem('intervai_user', JSON.stringify(data.user));
    }
    return data;
  },

  async register(name, email, password, targetRole) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, targetRole })
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('intervai_token', data.token);
      localStorage.setItem('intervai_user', JSON.stringify(data.user));
    }
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  logout() {
    localStorage.removeItem('intervai_token');
    localStorage.removeItem('intervai_user');
  },

  getCurrentUser() {
    try {
      const u = localStorage.getItem('intervai_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  // Sessions
  async createSession(jobTitle, jobDescription, experienceLevel, resumeText = '') {
    const res = await fetch(`${API_BASE}/sessions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ jobTitle, jobDescription, experienceLevel, resumeText })
    });
    return handleResponse(res);
  },

  async parseResume(fileBase64, fileName) {
    const res = await fetch(`${API_BASE}/sessions/parse-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ fileBase64, fileName })
    });
    return handleResponse(res);
  },

  async getSessions() {
    const res = await fetch(`${API_BASE}/sessions`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getSession(id) {
    const res = await fetch(`${API_BASE}/sessions/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async submitAnswer(sessionId, questionIndex, answerText, audioDurationSeconds = 0) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/submit-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ questionIndex, answerText, audioDurationSeconds })
    });
    return handleResponse(res);
  },

  async completeSession(sessionId) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    return handleResponse(res);
  },

  async getReport(sessionId) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/report`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async deleteSession(sessionId) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Dashboard & Analytics
  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getHistory() {
    const res = await fetch(`${API_BASE}/dashboard/history`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Scoring preview / lab
  async analyzePreview(questionText, answerText, audioDurationSeconds = 0, jobTitle = '', jobDescription = '') {
    const res = await fetch(`${API_BASE}/scoring/analyze-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ questionText, answerText, audioDurationSeconds, jobTitle, jobDescription })
    });
    return handleResponse(res);
  },

  // Presets
  async getPresets() {
    const res = await fetch(`${API_BASE}/presets`);
    return handleResponse(res);
  }
};
