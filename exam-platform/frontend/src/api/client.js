const BASE = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(BASE + path, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMessage = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data && (data.message || data.error)) {
        errMessage = data.message || data.error;
      }
    } catch {
      const text = await res.text().catch(() => '');
      if (text) errMessage = text;
    }
    throw new Error(errMessage);
  }

  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('application/json') ? res.json() : null;
}

export const api = {
  // --- Auth ---
  login(email, password) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  register(payload) {
    // payload: { name, email, password, role }
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getMe() {
    return request('/auth/me');
  },

  // --- Exams ---
  listExams() {
    return request('/exams');
  },
  getExam(examId) {
    return request(`/exams/${examId}`);
  },
  createExam(payload) {
    // payload: { title, subject, durationSeconds, startWindow, endWindow, templateIdsInOrder }
    return request('/exams', { method: 'POST', body: JSON.stringify(payload) });
  },

  // --- Question Templates & Builder ---
  listTemplates() {
    return request('/question-templates');
  },
  createTemplate(payload) {
    // payload: { subject, topic, templateText, formulaKey, variableRulesJson, difficulty }
    return request('/question-templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  createTemplatesBulk(list) {
    return request('/question-templates/bulk', {
      method: 'POST',
      body: JSON.stringify(list),
    });
  },
  deleteTemplate(id) {
    return request(`/question-templates/${id}`, { method: 'DELETE' });
  },

  // --- Student Attempts & Exam Taking ---
  startAttempt(examId) {
    // Server uses authenticated student principal from JWT token
    return request('/attempts/start', {
      method: 'POST',
      body: JSON.stringify({ examId }),
    });
  },
  getAttempt(attemptId) {
    return request(`/attempts/${attemptId}`);
  },
  getActiveAttempt() {
    return request('/attempts/active');
  },
  updateReviewFlags(attemptId, flaggedVariantIds) {
    return request(`/attempts/${attemptId}/review-flags`, {
      method: 'POST',
      body: JSON.stringify({ flaggedVariantIds }),
    });
  },
  submitAnswer(attemptId, { variantId, selectedIndex, timeSpentSeconds }) {
    return request(`/attempts/${attemptId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ variantId, selectedIndex, timeSpentSeconds }),
    });
  },
  flagEvent(attemptId, eventType) {
    return request(`/attempts/${attemptId}/flag`, {
      method: 'POST',
      body: JSON.stringify({ eventType }),
    });
  },
  submitExam(attemptId) {
    return request(`/attempts/${attemptId}/submit`, { method: 'POST' });
  },
  getResults(attemptId) {
    return request(`/attempts/${attemptId}/results`);
  },
  gradePractice(attemptId, answers) {
    // answers: [ { variantId, selectedIndex } ]
    return request(`/attempts/${attemptId}/practice-grade`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },
  reportCardUrl(attemptId) {
    return `${BASE}/attempts/${attemptId}/report-card`;
  },

  // --- Faculty Analytics & Calibration ---
  getAnalytics(examId) {
    return request(`/faculty/exams/${examId}/analytics`);
  },
  exportCsvUrl(examId) {
    return `${BASE}/faculty/exams/${examId}/export-csv`;
  },
  calibrateDifficulty() {
    return request('/faculty/calibrate', { method: 'POST' });
  },
};
