import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import Timer from '../../components/Timer';
import QuestionCard from '../../components/QuestionCard';
import ProgressBar from '../../components/ProgressBar';
import QuestionNavigator from '../../components/QuestionNavigator';

export default function ExamPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}); // variantId -> selectedIndex
  const [reviewFlags, setReviewFlags] = useState([]); // array of variantIds flagged for review
  const [flagCount, setFlagCount] = useState(0); // proctor flags (tab-switches)
  const [isExcessiveFlag, setIsExcessiveFlag] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Network & Disconnect / Resume Reliability State
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [reconnectedToast, setReconnectedToast] = useState(false);
  const [resumedNotice, setResumedNotice] = useState(false);
  const [showNavigatorDrawer, setShowNavigatorDrawer] = useState(true);

  const questionStartRef = useRef(Date.now());
  const submittingRef = useRef(false);
  const offlineQueueRef = useRef([]);

  // Load attempt state from server (with server-side time sync, saved answers, and review flags)
  useEffect(() => {
    let mounted = true;

    // Load local backup from localStorage in case browser crashed or disconnected mid-exam
    let localBackup = null;
    try {
      const stored = localStorage.getItem(`attempt_backup_${attemptId}`);
      if (stored) localBackup = JSON.parse(stored);
    } catch {
      // ignore
    }

    api.getAttempt(attemptId)
      .then((data) => {
        if (!mounted) return;
        if (data.status === 'SUBMITTED') {
          navigate(`/student/results/${attemptId}`);
          return;
        }

        setAttempt(data);

        // Merge server saved answers with any offline unsynced answers
        const mergedAnswers = {
          ...(data.savedAnswers || {}),
          ...(localBackup?.answers || {}),
        };
        setAnswers(mergedAnswers);

        // Merge review flags from server + local backup
        const serverFlags = data.reviewFlags || [];
        const localFlags = localBackup?.reviewFlags || [];
        const mergedFlags = Array.from(new Set([...serverFlags, ...localFlags]));
        setReviewFlags(mergedFlags);

        // Restore last question position if available
        try {
          const lastQ = localStorage.getItem(`attempt_current_${attemptId}`);
          if (lastQ !== null) {
            const parsedQ = parseInt(lastQ, 10);
            if (!isNaN(parsedQ) && parsedQ >= 0 && parsedQ < (data.questions?.length || 1)) {
              setCurrent(parsedQ);
            }
          }
        } catch {
          // ignore
        }

        // Show session resumed notification if this is a reconnection or reload
        const hasExistingProgress =
          Object.keys(mergedAnswers).length > 0 ||
          mergedFlags.length > 0 ||
          data.remainingSeconds < data.durationSeconds - 5;
        if (hasExistingProgress) {
          setResumedNotice(true);
          setTimeout(() => setResumedNotice(false), 6000);
        }

        setFlagCount(data.flagCount || 0);
        setIsExcessiveFlag((data.flagCount || 0) >= 3);

        if (data.remainingSeconds <= 0) {
          handleAutoSubmit('Time limit reached.');
        }
      })
      .catch((err) => {
        if (!mounted) return;
        // If network failed but we have local backup, don't show blank screen
        if (localBackup && localBackup.attempt) {
          setAttempt(localBackup.attempt);
          setAnswers(localBackup.answers || {});
          setReviewFlags(localBackup.reviewFlags || []);
          setIsOffline(true);
        } else {
          setError(err.message || 'Failed to load exam attempt');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [attemptId]);

  // Online / Offline detection & auto-sync queue for reliable connection recovery
  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
      setReconnectedToast(true);
      setTimeout(() => setReconnectedToast(false), 5000);

      // Flush queued offline answers
      if (offlineQueueRef.current.length > 0) {
        const queue = [...offlineQueueRef.current];
        offlineQueueRef.current = [];
        queue.forEach((item) => {
          api.submitAnswer(attemptId, item).catch(console.error);
        });
      }

      // Sync review flags to server
      if (reviewFlags.length > 0) {
        api.updateReviewFlags(attemptId, reviewFlags).catch(console.error);
      }
    }

    function handleOffline() {
      setIsOffline(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [attemptId, reviewFlags]);

  // Tab-switch and focus-loss detection -> server-side flag events
  useEffect(() => {
    if (!attempt || submitting) return;

    async function handleFocusLoss() {
      if (document.hidden && !submittingRef.current && navigator.onLine) {
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

  // Sync state to local storage backup whenever answers or flags change
  function saveLocalBackup(updatedAnswers, updatedFlags) {
    try {
      localStorage.setItem(
        `attempt_backup_${attemptId}`,
        JSON.stringify({
          attempt,
          answers: updatedAnswers,
          reviewFlags: updatedFlags,
          timestamp: Date.now(),
        })
      );
    } catch {
      // ignore
    }
  }

  async function handleAutoSubmit(reason = 'Time has expired.') {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsTimeUp(true);
    setSubmitting(true);
    try {
      await api.submitExam(attemptId);
      localStorage.removeItem('active_exam_attempt_id');
      navigate(`/student/results/${attemptId}`);
    } catch {
      localStorage.removeItem('active_exam_attempt_id');
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
      localStorage.removeItem('active_exam_attempt_id');
      localStorage.removeItem(`attempt_backup_${attemptId}`);
      localStorage.removeItem(`attempt_current_${attemptId}`);
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

    const nextAnswers = { ...answers, [question.variantId]: index };
    setAnswers(nextAnswers);
    saveLocalBackup(nextAnswers, reviewFlags);

    const timeSpent = Math.round((Date.now() - questionStartRef.current) / 1000);
    const payload = {
      variantId: question.variantId,
      selectedIndex: index,
      timeSpentSeconds: timeSpent,
    };

    if (navigator.onLine) {
      try {
        await api.submitAnswer(attemptId, payload);
      } catch (err) {
        if (err.message && err.message.toLowerCase().includes('expired')) {
          handleAutoSubmit('Exam time limit expired.');
        } else {
          // Push to retry queue
          offlineQueueRef.current.push(payload);
        }
      }
    } else {
      offlineQueueRef.current.push(payload);
    }
  }

  async function clearCurrentAnswer() {
    if (!attempt || !attempt.questions[current]) return;
    const question = attempt.questions[current];

    const nextAnswers = { ...answers };
    delete nextAnswers[question.variantId];
    setAnswers(nextAnswers);
    saveLocalBackup(nextAnswers, reviewFlags);

    const payload = {
      variantId: question.variantId,
      selectedIndex: -1, // server interprets negative as clearing
      timeSpentSeconds: 0,
    };

    if (navigator.onLine) {
      try {
        await api.submitAnswer(attemptId, payload);
      } catch (err) {
        console.error('Failed to sync cleared answer', err);
      }
    } else {
      offlineQueueRef.current.push(payload);
    }
  }

  async function toggleReviewFlag(variantId) {
    const isCurrentlyFlagged = reviewFlags.includes(variantId);
    const updatedFlags = isCurrentlyFlagged
      ? reviewFlags.filter((id) => id !== variantId)
      : [...reviewFlags, variantId];

    setReviewFlags(updatedFlags);
    saveLocalBackup(answers, updatedFlags);

    if (navigator.onLine) {
      try {
        await api.updateReviewFlags(attemptId, updatedFlags);
      } catch (err) {
        console.error('Failed to sync review flag with server', err);
      }
    }
  }

  function handleJump(idx) {
    questionStartRef.current = Date.now();
    setCurrent(idx);
    try {
      localStorage.setItem(`attempt_current_${attemptId}`, String(idx));
    } catch {
      // ignore
    }
  }

  function goNext() {
    handleJump(Math.min(attempt.questions.length - 1, current + 1));
  }

  function goPrev() {
    handleJump(Math.max(0, current - 1));
  }

  if (loading) {
    return (
      <div className="card hint" style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center', padding: 32 }}>
        <h3 style={{ margin: '0 0 10px' }}>Loading Exam Session…</h3>
        <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>
          Synchronizing question variants, answers, and time remaining with the server.
        </p>
      </div>
    );
  }

  if (error || !attempt || !attempt.questions || attempt.questions.length === 0) {
    return (
      <div className="card" style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center', padding: 32 }}>
        <h3 className="error" style={{ margin: '0 0 10px' }}>Exam Unavailable</h3>
        <p style={{ margin: '0 0 18px' }}>{error || 'No active attempt found.'}</p>
        <button className="primary" onClick={() => navigate('/student')}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  const question = attempt.questions[current];
  const isLast = current === attempt.questions.length - 1;
  const totalQuestions = attempt.questions.length;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;
  const flaggedCount = reviewFlags.length;
  const isCurrentFlagged = question ? reviewFlags.includes(question.variantId) : false;
  const isCurrentAnswered = question ? answers[question.variantId] !== undefined : false;
  const pct = Math.round(((current + 1) / totalQuestions) * 100);

  return (
    <div style={{ maxWidth: 840, margin: '20px auto', padding: '0 12px' }}>
      {/* Offline Alert Sticky Banner */}
      {isOffline && (
        <div
          style={{
            background: '#b45309',
            color: '#fff',
            borderRadius: 10,
            padding: '12px 18px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 4px 12px rgba(180, 83, 9, 0.3)',
          }}
        >
          <span style={{ fontSize: 24 }}>📡</span>
          <div>
            <strong style={{ display: 'block', fontSize: 14 }}>Connection Lost — Working in Offline Mode</strong>
            <span style={{ fontSize: 12, opacity: 0.95 }}>
              Do not close this page. Your answer selections and flags are saved locally and will automatically sync once your connection returns.
            </span>
          </div>
        </div>
      )}

      {/* Reconnected Toast */}
      {reconnectedToast && (
        <div
          style={{
            background: 'var(--accent2, #10b981)',
            color: '#fff',
            borderRadius: 10,
            padding: '10px 18px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <span>🟢</span>
          <span style={{ fontWeight: 600, fontSize: 13 }}>
            Connection restored! All offline answers and review flags have been successfully synced to the server.
          </span>
        </div>
      )}

      {/* Resumed Attempt Banner */}
      {resumedNotice && (
        <div
          style={{
            background: 'color-mix(in srgb, var(--accent) 15%, var(--card))',
            border: '1.5px solid var(--accent)',
            color: 'var(--accent)',
            borderRadius: 10,
            padding: '10px 16px',
            marginBottom: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔄</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              Exam Session Resumed — Welcome back! Your questions, saved answers, and remaining time were synchronized.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setResumedNotice(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Integrity Alert Banners */}
      {isExcessiveFlag ? (
        <div
          style={{
            background: 'color-mix(in srgb, var(--danger) 15%, var(--card))',
            border: '2px solid var(--danger)',
            color: 'var(--danger)',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 24 }}>🚨</span>
          <div>
            <strong style={{ display: 'block', fontSize: 14 }}>
              Academic Integrity Alert ({flagCount} Focus Violations)
            </strong>
            <span style={{ fontSize: 12 }}>
              Repeated tab switches detected. This session has been tagged on the live proctor wall for review.
            </span>
          </div>
        </div>
      ) : flagCount > 0 ? (
        <div
          style={{
            background: 'color-mix(in srgb, #f59e0b 15%, var(--card))',
            border: '1px solid #d97706',
            color: '#b45309',
            borderRadius: 8,
            padding: '8px 14px',
            marginBottom: 14,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>⚠</span>
          <span>
            Tab switch detected ({flagCount}/3). Please remain on the exam screen to avoid academic dishonesty flags.
          </span>
        </div>
      ) : null}

      {isTimeUp && (
        <div
          style={{
            background: 'color-mix(in srgb, var(--danger) 15%, var(--card))',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 14,
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          ⏳ Time is up! Automatically submitting your answers to the server…
        </div>
      )}

      {/* FEATURE 1: QUESTION NAVIGATOR GRID WITH FLAG FOR REVIEW */}
      <QuestionNavigator
        questions={attempt.questions}
        currentIndex={current}
        answers={answers}
        reviewFlags={reviewFlags}
        onSelectQuestion={handleJump}
      />

      {/* Main Exam Card */}
      <div className="card" style={{ padding: 22, borderRadius: 12 }}>
        {/* Header with Question Position, Topic, Timer, and Early Submit button */}
        <div
          className="topbar"
          style={{
            marginBottom: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge" style={{ fontWeight: 700, fontSize: 13 }}>
              Question {current + 1} of {totalQuestions}
            </span>
            <span
              className="badge"
              style={{
                background: 'color-mix(in srgb, var(--accent) 12%, var(--bg))',
                color: 'var(--accent)',
                fontWeight: 600,
              }}
            >
              {question.topic}
            </span>

            {/* Flag for Review Toggle Button */}
            <button
              type="button"
              onClick={() => toggleReviewFlag(question.variantId)}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                borderRadius: 8,
                border: isCurrentFlagged ? '1.5px solid #d97706' : '1px solid var(--border)',
                background: isCurrentFlagged
                  ? 'color-mix(in srgb, #f59e0b 20%, var(--card))'
                  : 'var(--bg)',
                color: isCurrentFlagged ? '#b45309' : 'var(--muted)',
                fontWeight: isCurrentFlagged ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s ease',
              }}
              title="Flag this question to revisit before submitting"
            >
              <span>{isCurrentFlagged ? '🚩' : '🏳️'}</span>
              <span>{isCurrentFlagged ? 'Flagged for Review' : 'Flag for Review'}</span>
            </button>
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
                cursor: 'pointer',
              }}
              title="You can review and submit your exam whenever you are ready"
            >
              ✓ Review &amp; Submit
            </button>
          </div>
        </div>

        <ProgressBar percent={pct} />

        {/* Flagged Alert Note on Question Card */}
        {isCurrentFlagged && (
          <div
            style={{
              marginTop: 14,
              padding: '8px 12px',
              borderRadius: 8,
              background: 'color-mix(in srgb, #f59e0b 14%, var(--card))',
              border: '1px solid #f59e0b',
              color: '#b45309',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>
              🚩 <strong>Marked for review:</strong> This question is flagged so you can easily return and double-check your answer before submitting.
            </span>
            <button
              type="button"
              onClick={() => toggleReviewFlag(question.variantId)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#b45309',
                cursor: 'pointer',
                fontSize: 11,
                textDecoration: 'underline',
              }}
            >
              Remove Flag
            </button>
          </div>
        )}

        {/* Question Content */}
        <div style={{ marginTop: 20 }}>
          <QuestionCard
            question={question}
            selectedIndex={answers[question.variantId]}
            onSelect={selectOption}
          />
        </div>

        {/* Clear Selection Option */}
        {isCurrentAnswered && (
          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <button
              type="button"
              onClick={clearCurrentAnswer}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--muted)',
                fontSize: 12,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
              title="Clear your answer choice for this question"
            >
              ✕ Clear My Selected Answer
            </button>
          </div>
        )}

        {/* Navigation & Submit Buttons */}
        <div
          className="topbar"
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button className="secondary" onClick={goPrev} disabled={current === 0}>
            ← Previous Question
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
                  Review &amp; Submit
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
                {submitting ? 'Submitting…' : '✓ Review &amp; Submit Exam'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FEATURE 1: ENHANCED SUBMIT CONFIRMATION MODAL WITH SUMMARY BREAKDOWN */}
      {showSubmitModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 480,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              borderRadius: 14,
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>Confirm Exam Submission</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
              Please review your question completion status before submitting your final answers:
            </p>

            {/* Statistics Breakdown Card */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                marginBottom: 18,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  background: 'color-mix(in srgb, var(--accent2) 15%, var(--card))',
                  border: '1px solid var(--accent2)',
                  borderRadius: 8,
                  padding: '10px 8px',
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent2)' }}>
                  {answeredCount}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 500 }}>Answered</div>
              </div>

              <div
                style={{
                  background:
                    unansweredCount > 0
                      ? 'color-mix(in srgb, #f59e0b 15%, var(--card))'
                      : 'var(--bg)',
                  border: `1px solid ${unansweredCount > 0 ? '#f59e0b' : 'var(--border)'}`,
                  borderRadius: 8,
                  padding: '10px 8px',
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: unansweredCount > 0 ? '#b45309' : 'var(--muted)',
                  }}
                >
                  {unansweredCount}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 500 }}>Unanswered</div>
              </div>

              <div
                style={{
                  background:
                    flaggedCount > 0
                      ? 'color-mix(in srgb, #d97706 15%, var(--card))'
                      : 'var(--bg)',
                  border: `1px solid ${flaggedCount > 0 ? '#d97706' : 'var(--border)'}`,
                  borderRadius: 8,
                  padding: '10px 8px',
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: flaggedCount > 0 ? '#d97706' : 'var(--muted)',
                  }}
                >
                  {flaggedCount}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 500 }}>Flagged</div>
              </div>
            </div>

            {/* Flagged Questions Warning */}
            {flaggedCount > 0 && (
              <div
                style={{
                  background: 'color-mix(in srgb, #f59e0b 14%, var(--card))',
                  border: '1px solid #d97706',
                  color: '#b45309',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 13,
                  marginBottom: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>
                  🚩 You have <strong>{flaggedCount}</strong> question(s) flagged for review.
                </span>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    const firstFlaggedIdx = attempt.questions.findIndex((q) =>
                      reviewFlags.includes(q.variantId)
                    );
                    if (firstFlaggedIdx !== -1) {
                      handleJump(firstFlaggedIdx);
                      setShowSubmitModal(false);
                    }
                  }}
                  style={{ fontSize: 11, padding: '4px 8px', color: '#b45309', borderColor: '#d97706' }}
                >
                  Review Now →
                </button>
              </div>
            )}

            {/* Unanswered Questions Warning */}
            {unansweredCount > 0 && (
              <div
                style={{
                  background: 'color-mix(in srgb, var(--danger) 10%, var(--card))',
                  border: '1px solid var(--danger)',
                  color: 'var(--danger)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 13,
                  marginBottom: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>
                  ⚠️ You have <strong>{unansweredCount}</strong> unanswered question(s).
                </span>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    const firstUnansweredIdx = attempt.questions.findIndex(
                      (q) => answers[q.variantId] === undefined
                    );
                    if (firstUnansweredIdx !== -1) {
                      handleJump(firstUnansweredIdx);
                      setShowSubmitModal(false);
                    }
                  }}
                  style={{ fontSize: 11, padding: '4px 8px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                >
                  Answer Now →
                </button>
              </div>
            )}

            {unansweredCount === 0 && flaggedCount === 0 && (
              <div
                style={{
                  background: 'color-mix(in srgb, var(--accent2) 12%, var(--card))',
                  border: '1px solid var(--accent2)',
                  color: 'var(--accent2)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                ✓ All {totalQuestions} questions have been answered and none are flagged!
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="secondary"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
              >
                Keep Reviewing
              </button>
              <button
                type="button"
                className="primary"
                onClick={confirmSubmit}
                disabled={submitting}
                style={{ background: 'var(--accent2)', color: '#fff', fontWeight: 600 }}
              >
                {submitting ? 'Submitting…' : 'Yes, Submit Final Exam'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
