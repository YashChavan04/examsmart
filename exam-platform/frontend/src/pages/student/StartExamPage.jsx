import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function StartExamPage() {
  const { user, isAuthenticated } = useAuth();
  const [exams, setExams] = useState([]);
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
      const data = await api.listExams();
      setExams(data || []);
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
    <div style={{ maxWidth: 840, margin: '24px auto', padding: '0 12px' }}>
      {/* Welcome Banner */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: 22 }}>
            🎓 Welcome, {user ? user.name : 'Student'}!
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            Select an exam below to begin. Questions and options are randomized server-side.
          </p>
        </div>
        <button className="secondary" onClick={loadExams} disabled={loading} style={{ fontSize: 13 }}>
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', background: 'color-mix(in srgb, var(--danger) 10%, var(--card))' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Available Exams Section */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Available Examinations</h3>
          <span className="badge">{exams.length} {exams.length === 1 ? 'Exam' : 'Exams'}</span>
        </div>

        {loading ? (
          <div className="card hint">Loading examinations…</div>
        ) : exams.length === 0 ? (
          <div className="card hint">
            <p style={{ margin: '0 0 10px' }}>No active exams currently scheduled.</p>
            <p className="muted" style={{ margin: 0, fontSize: 12 }}>Check back soon or contact your faculty instructor.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
            {exams.map((exam) => {
              const status = exam.attemptStatus || 'NOT_STARTED';
              const isSubmitting = actionLoading === exam.id;

              return (
                <div key={exam.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', margin: 0, transition: 'transform 0.15s, box-shadow 0.15s' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                      <span className="badge" style={{ background: 'color-mix(in srgb, var(--accent) 15%, var(--bg))', color: 'var(--accent)', fontWeight: 600 }}>
                        {exam.subject}
                      </span>
                      {status === 'SUBMITTED' ? (
                        <span className="badge" style={{ background: 'color-mix(in srgb, var(--accent2) 20%, var(--bg))', color: 'var(--accent2)', fontWeight: 600 }}>
                          ✓ Completed
                        </span>
                      ) : status === 'IN_PROGRESS' ? (
                        <span className="badge" style={{ background: 'color-mix(in srgb, #f59e0b 20%, var(--bg))', color: '#d97706', fontWeight: 600 }}>
                          ⏱ In Progress
                        </span>
                      ) : (
                        <span className="badge">Ready</span>
                      )}
                    </div>

                    <h4 style={{ margin: '0 0 8px', fontSize: 17 }}>{exam.title}</h4>

                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
                      <span>⏱ {formatDuration(exam.durationSeconds)}</span>
                      <span>📋 {exam.questionCount} {exam.questionCount === 1 ? 'Question' : 'Questions'}</span>
                    </div>

                    {status === 'SUBMITTED' && (
                      <div style={{ padding: '8px 12px', background: 'var(--bg)', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
                        Score: <strong>{exam.score} / {exam.totalQuestions}</strong>
                        {exam.totalQuestions > 0 && ` (${Math.round((exam.score / exam.totalQuestions) * 100)}%)`}
                      </div>
                    )}

                    {status === 'IN_PROGRESS' && exam.remainingSeconds !== null && (
                      <div style={{ padding: '8px 12px', background: 'var(--bg)', borderRadius: 8, marginBottom: 14, fontSize: 13, color: '#d97706' }}>
                        Time remaining: <strong>{formatDuration(exam.remainingSeconds)}</strong>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 8 }}>
                    {status === 'NOT_STARTED' && (
                      <button
                        className="primary"
                        style={{ width: '100%' }}
                        onClick={() => handleStart(exam.id)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Starting Exam…' : 'Start Exam'}
                      </button>
                    )}

                    {status === 'IN_PROGRESS' && (
                      <button
                        className="primary"
                        style={{ width: '100%', background: '#d97706' }}
                        onClick={() => handleResume(exam.attemptId)}
                      >
                        Resume Exam
                      </button>
                    )}

                    {status === 'SUBMITTED' && (
                      <button
                        className="secondary"
                        style={{ width: '100%' }}
                        onClick={() => handleViewResults(exam.attemptId)}
                      >
                        View Results &amp; Revision Plan
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
