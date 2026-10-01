import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import Timer from '../../components/Timer';
import QuestionCard from '../../components/QuestionCard';
import ProgressBar from '../../components/ProgressBar';

export default function ExamPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}); // variantId -> selectedIndex
  const [flagCount, setFlagCount] = useState(0);
  const [isExcessiveFlag, setIsExcessiveFlag] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const questionStartRef = useRef(Date.now());
  const submittingRef = useRef(false);

  // Load attempt state from server (with server-side time sync and saved answers)
  useEffect(() => {
    let mounted = true;
    api.getAttempt(attemptId)
      .then((data) => {
        if (!mounted) return;
        if (data.status === 'SUBMITTED') {
          navigate(`/student/results/${attemptId}`);
          return;
        }
        setAttempt(data);
        setAnswers(data.savedAnswers || {});
        setFlagCount(data.flagCount || 0);
        setIsExcessiveFlag((data.flagCount || 0) >= 3);
        if (data.remainingSeconds <= 0) {
          handleAutoSubmit('Time limit reached.');
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Failed to load exam attempt');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [attemptId]);

  // Tab-switch and focus-loss detection -> server-side flag events
  useEffect(() => {
    if (!attempt || submitting) return;

    async function handleFocusLoss() {
      if (document.hidden && !submittingRef.current) {
        try {
          const res = await api.flagEvent(attemptId, 'TAB_SWITCH');
          if (res) {
            setFlagCount(res.totalFlags);
            setIsExcessiveFlag(res.isExcessive || res.totalFlags >= 3);
          } else {
            setFlagCount((c) => {
              const next = c + 1;
              if (next >= 3) setIsExcessiveFlag(true);
              return next;
            });
          }
        } catch {
          setFlagCount((c) => c + 1);
        }
      }
    }

    document.addEventListener('visibilitychange', handleFocusLoss);
    return () => document.removeEventListener('visibilitychange', handleFocusLoss);
  }, [attemptId, attempt, submitting]);

  // Warn on browser back / refresh while exam is active
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (!submittingRef.current && attempt && attempt.status === 'IN_PROGRESS') {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [attempt]);

  async function handleAutoSubmit(reason = 'Time has expired.') {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsTimeUp(true);
    setSubmitting(true);
    try {
      await api.submitExam(attemptId);
      navigate(`/student/results/${attemptId}`);
    } catch {
      navigate(`/student/results/${attemptId}`);
    }
  }

  function promptSubmitModal() {
    setShowSubmitModal(true);
  }

  async function confirmSubmit() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setShowSubmitModal(false);

    try {
      await api.submitExam(attemptId);
      navigate(`/student/results/${attemptId}`);
    } catch (err) {
      console.error(err);
      setError('Submission error: ' + err.message);
      setSubmitting(false);
      submittingRef.current = false;
    }
  }

  async function selectOption(index) {
    if (!attempt || !attempt.questions[current]) return;
    const question = attempt.questions[current];

    setAnswers((prev) => ({ ...prev, [question.variantId]: index }));
    const timeSpent = Math.round((Date.now() - questionStartRef.current) / 1000);

    try {
      await api.submitAnswer(attemptId, {
        variantId: question.variantId,
        selectedIndex: index,
        timeSpentSeconds: timeSpent,
      });
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('expired')) {
        handleAutoSubmit('Exam time limit expired.');
      } else {
        console.error('Failed to sync answer with server', err);
      }
    }
  }

  function goNext() {
    questionStartRef.current = Date.now();
    setCurrent((c) => Math.min(attempt.questions.length - 1, c + 1));
  }

  function goPrev() {
    questionStartRef.current = Date.now();
    setCurrent((c) => Math.max(0, c - 1));
  }

  if (loading) {
    return (
      <div className="card hint" style={{ maxWidth: 500, margin: '40px auto' }}>
        <h3>Loading Exam…</h3>
        <p className="muted">Synchronizing exam timer and randomized questions with the server.</p>
      </div>
    );
  }

  if (error || !attempt || !attempt.questions || attempt.questions.length === 0) {
    return (
      <div className="card" style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
        <h3 className="error">Exam Unavailable</h3>
        <p>{error || 'No active attempt found.'}</p>
        <button className="primary" onClick={() => navigate('/student')}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  const question = attempt.questions[current];
  const isLast = current === attempt.questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = attempt.questions.length;
  const pct = Math.round(((current + 1) / totalQuestions) * 100);
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div style={{ maxWidth: 720, margin: '20px auto', padding: '0 12px' }}>
      {/* Integrity Alert Banners */}
      {isExcessiveFlag ? (
        <div style={{
          background: 'color-mix(in srgb, var(--danger) 15%, var(--card))',
          border: '2px solid var(--danger)',
          color: 'var(--danger)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <span style={{ fontSize: 24 }}>🚨</span>
          <div>
            <strong style={{ display: 'block', fontSize: 14 }}>Academic Integrity Alert ({flagCount} Focus Violations)</strong>
            <span style={{ fontSize: 12 }}>
              Repeated tab switches detected. This session has been tagged on the live proctor wall for review.
            </span>
          </div>
        </div>
      ) : flagCount > 0 ? (
        <div style={{
          background: 'color-mix(in srgb, #f59e0b 15%, var(--card))',
          border: '1px solid #d97706',
          color: '#b45309',
          borderRadius: 8,
          padding: '8px 14px',
          marginBottom: 14,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span>⚠</span>
          <span>Tab switch detected ({flagCount}/3). Please remain on the exam screen to avoid academic dishonesty flags.</span>
        </div>
      ) : null}

      {isTimeUp && (
        <div style={{
          background: 'color-mix(in srgb, var(--danger) 15%, var(--card))',
          border: '1px solid var(--danger)',
          color: 'var(--danger)',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 14,
          fontWeight: 600,
          textAlign: 'center'
        }}>
          ⏳ Time is up! Automatically submitting your answers to the server…
        </div>
      )}

      {/* Main Exam Card */}
      <div className="card" style={{ padding: 22 }}>
        {/* Header with Question Count, Topic, Timer, and Early Submit button */}
        <div className="topbar" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge" style={{ fontWeight: 600 }}>
              Question {current + 1} of {totalQuestions}
            </span>
            <span className="badge" style={{ background: 'color-mix(in srgb, var(--accent) 12%, var(--bg))', color: 'var(--accent)' }}>
              {question.topic}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Timer durationSeconds={attempt.remainingSeconds} onExpire={() => handleAutoSubmit('Time is up!')} />
            <button
              type="button"
              onClick={promptSubmitModal}
              disabled={submitting}
              style={{
                background: 'color-mix(in srgb, var(--accent2) 18%, var(--card))',
                borderColor: 'var(--accent2)',
                color: 'var(--accent2)',
                fontWeight: 600,
                fontSize: 12,
                padding: '6px 14px',
                borderRadius: 8,
                cursor: 'pointer'
              }}
              title="You can submit your exam early whenever you are ready"
            >
              ✓ Submit Exam Early
            </button>
          </div>
        </div>

        <ProgressBar percent={pct} />

        <div style={{ marginTop: 20 }}>
          <QuestionCard
            question={question}
            selectedIndex={answers[question.variantId]}
            onSelect={selectOption}
          />
        </div>

        {/* Navigation & Submit Buttons */}
        <div className="topbar" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="secondary" onClick={goPrev} disabled={current === 0}>
            ← Previous
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            {!isLast ? (
              <>
                <button
                  type="button"
                  className="secondary"
                  onClick={promptSubmitModal}
                  disabled={submitting}
                  style={{ color: 'var(--accent2)', borderColor: 'var(--accent2)' }}
                >
                  Submit Exam
                </button>
                <button className="primary" onClick={goNext}>
                  Next Question →
                </button>
              </>
            ) : (
              <button
                className="primary"
                onClick={promptSubmitModal}
                disabled={submitting}
                style={{ background: 'var(--accent2)', color: '#fff', fontWeight: 600 }}
              >
                {submitting ? 'Submitting…' : '✓ Finish & Submit Exam'}
              </button>
            )}
          </div>
        </div>

        {/* Status / Question Palette Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, fontSize: 13, color: 'var(--muted)', flexWrap: 'wrap', gap: 8 }}>
          <span>
            Answered <strong>{answeredCount}</strong> of <strong>{totalQuestions}</strong> questions
            {unansweredCount > 0 && <span style={{ color: '#f59e0b', marginLeft: 6 }}>({unansweredCount} remaining)</span>}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {attempt.questions.map((q, idx) => {
              const isAnswered = answers[q.variantId] !== undefined;
              const isCur = idx === current;
              return (
                <button
                  key={q.variantId}
                  onClick={() => setCurrent(idx)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: `1px solid ${isCur ? 'var(--accent)' : 'var(--border)'}`,
                    background: isCur
                      ? 'var(--accent)'
                      : isAnswered
                      ? 'color-mix(in srgb, var(--accent2) 25%, var(--card))'
                      : 'var(--bg)',
                    color: isCur ? '#fff' : isAnswered ? 'var(--accent2)' : 'var(--muted)',
                    fontWeight: isCur || isAnswered ? 600 : 400,
                    fontSize: 12,
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={`Jump to Question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div className="card" style={{ maxWidth: 440, width: '100%', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'fadeIn 0.2s ease' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 20 }}>Ready to Submit Exam?</h3>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
              You have answered <strong>{answeredCount}</strong> of <strong>{totalQuestions}</strong> questions.
            </p>

            {unansweredCount > 0 ? (
              <div style={{
                background: 'color-mix(in srgb, #f59e0b 12%, var(--card))',
                border: '1px solid #f59e0b',
                color: '#b45309',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 13,
                marginBottom: 20
              }}>
                ⚠️ <strong>Note:</strong> You have <strong>{unansweredCount}</strong> unanswered question(s). Unanswered questions will receive 0 marks.
              </div>
            ) : (
              <div style={{
                background: 'color-mix(in srgb, var(--accent2) 12%, var(--card))',
                border: '1px solid var(--accent2)',
                color: 'var(--accent2)',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 13,
                marginBottom: 20
              }}>
                ✓ All {totalQuestions} questions have been answered!
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="secondary"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
              >
                Keep Answering
              </button>
              <button
                type="button"
                className="primary"
                onClick={confirmSubmit}
                disabled={submitting}
                style={{ background: 'var(--accent2)', color: '#fff' }}
              >
                {submitting ? 'Submitting…' : 'Yes, Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
