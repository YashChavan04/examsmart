import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function StartExamPage() {
  const { user, isAuthenticated } = useAuth();
  const [exams, setExams] = useState([]);
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [manualExamId, setManualExamId] = useState('');
  const [showManual, setShowManual] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadExams();
  }, []);

  async function loadExams() {
    setLoading(true);
    setError(null);
    try {
      const [examsData, activeData] = await Promise.allSettled([
        api.listExams(),
        api.getActiveAttempt().catch(() => null),
      ]);

      if (examsData.status === 'fulfilled') {
        setExams(examsData.value || []);
      } else {
        setError(examsData.reason?.message || 'Failed to load examinations');
      }

      if (activeData.status === 'fulfilled' && activeData.value && activeData.value.attemptId) {
        setActiveAttempt(activeData.value);
        localStorage.setItem('active_exam_attempt_id', activeData.value.attemptId);
      } else {
        setActiveAttempt(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStart(examId) {
    setActionLoading(examId);
    setError(null);
    try {
      const attempt = await api.startAttempt(examId);
      // Persist in localStorage so it survives tab closes, network drops, and browser crashes
      localStorage.setItem('active_exam_attempt_id', attempt.attemptId);
      sessionStorage.setItem(`attempt:${attempt.attemptId}`, JSON.stringify(attempt));
      navigate(`/student/exam/${attempt.attemptId}`);
    } catch (err) {
      setError(err.message);
      loadExams();
    } finally {
      setActionLoading(null);
    }
  }

  function handleResume(attemptId) {
    navigate(`/student/exam/${attemptId}`);
  }

  function handleViewResults(attemptId) {
    navigate(`/student/results/${attemptId}`);
  }

  function formatDuration(sec) {
    if (!sec) return '0 min';
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}m ${s}s` : `${m} min`;
  }

  return (
    <div style={{ maxWidth: 900, margin: '24px auto', padding: '0 14px' }}>
      {/* Welcome Hero Banner */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 18,
          background: '#ffffff',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '24px 28px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: '#2563eb',
              color: '#fff',
              fontSize: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)',
            }}
          >
            🎓
          </div>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 21, fontWeight: 800, letterSpacing: -0.3, color: '#0f172a' }}>
              Welcome back, {user ? user.name : 'Student'}!
            </h2>
            <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
              Choose an examination below to begin. Questions and options are generated with unique server-side variants.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="secondary"
          onClick={loadExams}
          disabled={loading}
          style={{ fontSize: 13, padding: '8px 16px', background: 'var(--card)' }}
        >
          🔄 Refresh Exams
        </button>
      </div>

      {error && (
        <div
          className="card"
          style={{
            borderColor: 'var(--danger)',
            color: 'var(--danger)',
            background: 'color-mix(in srgb, var(--danger) 10%, var(--card))',
            padding: '14px 18px',
            borderRadius: 12,
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Prominent Resume After Disconnect / Active Exam Banner */}
      {activeAttempt && (
        <div
          className="card"
          style={{
            marginTop: 20,
            border: '2px solid #d97706',
            background: 'linear-gradient(135deg, color-mix(in srgb, #f59e0b 16%, var(--card)) 0%, var(--card) 100%)',
            borderRadius: 16,
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: '0 8px 24px rgba(217, 119, 6, 0.18)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
                fontSize: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
              }}
            >
              ⚡
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <strong style={{ fontSize: 16, color: '#b45309', fontWeight: 800 }}>
                  Active Examination In Progress!
                </strong>
                <span
                  className="badge"
                  style={{ background: '#d97706', color: '#fff', fontSize: 10, fontWeight: 700 }}
                >
                  RESUME READY
                </span>
              </div>
              <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>
                {activeAttempt.examTitle}
              </p>
              <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'var(--muted)', flexWrap: 'wrap' }}>
                <span>
                  ⏱ Time Remaining:{' '}
                  <strong style={{ color: '#d97706', fontFamily: 'var(--font-mono)' }}>
                    {formatDuration(activeAttempt.remainingSeconds)}
                  </strong>
                </span>
                <span>📋 {activeAttempt.questions?.length || 0} Questions</span>
                {activeAttempt.savedAnswers && (
                  <span>✓ {Object.keys(activeAttempt.savedAnswers).length} Answered</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="primary"
            onClick={() => handleResume(activeAttempt.attemptId)}
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              padding: '11px 24px',
              borderRadius: 10,
              boxShadow: '0 4px 16px rgba(217, 119, 6, 0.35)',
            }}
          >
            ▶ Resume My Exam Now
          </button>
        </div>
      )}

      {/* Available Exams Section */}
      <div style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>Available Examinations</h3>
          <span className="badge badge-accent">
            {exams.length} {exams.length === 1 ? 'Exam' : 'Exams'}
          </span>
        </div>

        {loading ? (
          <div className="card hint">Loading examinations…</div>
        ) : exams.length === 0 ? (
          <div className="card hint">
            <p style={{ margin: '0 0 10px', fontSize: 15 }}>No active exams currently scheduled.</p>
            <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>Check back soon or contact your faculty instructor.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 18 }}>
            {exams.map((exam) => {
              const status = exam.attemptStatus || 'NOT_STARTED';
              const isSubmitting = actionLoading === exam.id;
              const isSubmitted = status === 'SUBMITTED';
              const isInProgress = status === 'IN_PROGRESS';

              const topBarColor = isSubmitted
                ? 'var(--accent2)'
                : isInProgress
                ? '#d97706'
                : 'var(--accent)';

              return (
                <div
                  key={exam.id}
                  className="card card-interactive"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    margin: 0,
                    padding: 22,
                    borderRadius: 14,
                    overflow: 'hidden',
                    borderTop: `4px solid ${topBarColor}`,
                  }}
                >
                  <div>
                    {/* Top Subject & Status Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span
                        className="badge"
                        style={{
                          background: 'color-mix(in srgb, var(--accent) 12%, var(--bg))',
                          color: 'var(--accent)',
                          fontWeight: 700,
                          fontSize: 11.5,
                        }}
                      >
                        📚 {exam.subject}
                      </span>

                      {isSubmitted ? (
                        <span
                          className="badge"
                          style={{
                            background: 'color-mix(in srgb, var(--accent2) 18%, var(--bg))',
                            color: 'var(--accent2)',
                            fontWeight: 700,
                          }}
                        >
                          ✓ Completed
                        </span>
                      ) : isInProgress ? (
                        <span
                          className="badge"
                          style={{
                            background: 'color-mix(in srgb, #f59e0b 20%, var(--bg))',
                            color: '#d97706',
                            fontWeight: 700,
                          }}
                        >
                          ⏱ In Progress
                        </span>
                      ) : (
                        <span className="badge" style={{ fontWeight: 600 }}>
                          Ready
                        </span>
                      )}
                    </div>

                    <h4 style={{ margin: '0 0 10px', fontSize: 17, fontWeight: 700, lineHeight: 1.4 }}>
                      {exam.title}
                    </h4>

                    {/* Metadata chips */}
                    <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                      <span>⏱ {formatDuration(exam.durationSeconds)}</span>
                      <span>📋 {exam.questionCount} {exam.questionCount === 1 ? 'Question' : 'Questions'}</span>
                    </div>

                    {/* Completed Score Box with Mini Bar */}
                    {isSubmitted && (
                      <div
                        style={{
                          padding: '10px 14px',
                          background: 'var(--bg)',
                          borderRadius: 10,
                          marginBottom: 16,
                          fontSize: 13,
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ color: 'var(--muted)' }}>Final Score:</span>
                          <strong style={{ color: 'var(--accent2)', fontSize: 14 }}>
                            {exam.score} / {exam.totalQuestions} ({Math.round((exam.score / exam.totalQuestions) * 100)}%)
                          </strong>
                        </div>
                        <div className="progress-outer" style={{ height: 6 }}>
                          <div
                            className="progress-inner"
                            style={{
                              width: `${Math.round((exam.score / exam.totalQuestions) * 100)}%`,
                              background: 'var(--accent2)',
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {isInProgress && exam.remainingSeconds !== null && (
                      <div
                        style={{
                          padding: '10px 14px',
                          background: 'color-mix(in srgb, #f59e0b 10%, var(--bg))',
                          borderRadius: 10,
                          marginBottom: 16,
                          fontSize: 13,
                          color: '#d97706',
                          border: '1px solid color-mix(in srgb, #f59e0b 30%, transparent)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span>Time remaining:</span>
                        <strong style={{ fontFamily: 'var(--font-mono)', fontSize: 14 }}>
                          {formatDuration(exam.remainingSeconds)}
                        </strong>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 10 }}>
                    {status === 'NOT_STARTED' && (
                      <button
                        className="primary"
                        style={{ width: '100%', padding: '11px', fontSize: 14 }}
                        onClick={() => handleStart(exam.id)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Starting Exam…' : '🚀 Start Examination'}
                      </button>
                    )}

                    {isInProgress && (
                      <button
                        className="primary"
                        style={{
                          width: '100%',
                          padding: '11px',
                          fontSize: 14,
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        }}
                        onClick={() => handleResume(exam.attemptId)}
                      >
                        ▶ Resume Exam
                      </button>
                    )}

                    {isSubmitted && (
                      <button
                        className="secondary"
                        style={{ width: '100%', padding: '10px', fontSize: 13.5 }}
                        onClick={() => handleViewResults(exam.attemptId)}
                      >
                        📊 View Results &amp; Revision Plan
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Exam Code Option (Collapsed by default) */}
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <button
          type="button"
          className="secondary"
          style={{ fontSize: 12, border: 'none', background: 'transparent', textDecoration: 'underline' }}
          onClick={() => setShowManual(!showManual)}
        >
          {showManual ? 'Hide Direct Code Entry' : 'Have a direct Exam Code? Click here'}
        </button>

        {showManual && (
          <div className="card" style={{ maxWidth: 440, margin: '14px auto', textAlign: 'left' }}>
            <h4 style={{ margin: '0 0 8px' }}>Direct Exam Entry</h4>
            <p className="muted" style={{ margin: '0 0 12px', fontSize: 12 }}>
              Paste an exam UUID provided directly by your instructor.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                placeholder="Paste Exam UUID"
                value={manualExamId}
                onChange={(e) => setManualExamId(e.target.value.trim())}
              />
              <button
                className="primary"
                onClick={() => manualExamId && handleStart(manualExamId)}
                disabled={!manualExamId || actionLoading === manualExamId}
              >
                Start
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
