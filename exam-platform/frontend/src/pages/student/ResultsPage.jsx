import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';

export default function ResultsPage() {
  const { attemptId } = useParams();
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Practice state
  const [practiceAnswers, setPracticeAnswers] = useState({}); // variantId -> selectedIndex
  const [practiceGraded, setPracticeGraded] = useState(false);
  const [practiceGradeResult, setPracticeGradeResult] = useState(null);
  const [gradingLoading, setGradingLoading] = useState(false);

  useEffect(() => {
    api.getResults(attemptId)
      .then(setResults)
      .catch((err) => setError(err.message));
  }, [attemptId]);

  function selectPracticeOption(variantId, index) {
    if (practiceGraded) return; // locked after grading until reset
    setPracticeAnswers((prev) => ({ ...prev, [variantId]: index }));
  }

  async function handleGradePractice() {
    setGradingLoading(true);
    try {
      const payload = Object.entries(practiceAnswers).map(([variantId, selectedIndex]) => ({
        variantId,
        selectedIndex,
      }));
      const res = await api.gradePractice(attemptId, payload);
      setPracticeGradeResult(res);
      setPracticeGraded(true);
    } catch (err) {
      alert('Error grading practice: ' + err.message);
    } finally {
      setGradingLoading(false);
    }
  }

  function handleResetPractice() {
    setPracticeAnswers({});
    setPracticeGraded(false);
    setPracticeGradeResult(null);
  }

  if (error) {
    return (
      <div className="card" style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center' }}>
        <h3 className="error">Unable to load results</h3>
        <p className="muted">{error}</p>
        <Link to="/student" className="primary" style={{ display: 'inline-block', marginTop: 12 }}>
          Return to Examinations
        </Link>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="card hint" style={{ maxWidth: 500, margin: '40px auto' }}>
        <h3>Loading Assessment Results…</h3>
        <p className="muted">Fetching graded submission and generating personalized revision plan.</p>
      </div>
    );
  }

  const percentage = results.total > 0 ? Math.round((results.score / results.total) * 100) : 0;
  const isPassed = percentage >= 50;
  const isDistinction = percentage >= 85;

  return (
    <div style={{ maxWidth: 840, margin: '28px auto', padding: '0 16px' }} className="fade-in">
      {/* Score Summary Hero Card */}
      <div
        className="card glass-panel"
        style={{
          padding: '28px 32px',
          boxShadow: 'var(--shadow-lg)',
          borderRadius: 20,
          border: '1px solid var(--card-border-subtle)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        {/* Clean status bar at the top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: isPassed ? '#059669' : '#dc2626',
          }}
        />

        <div className="topbar" style={{ marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                className="badge"
                style={{
                  background: isPassed
                    ? 'color-mix(in srgb, var(--accent2) 18%, var(--bg))'
                    : 'color-mix(in srgb, var(--danger) 18%, var(--bg))',
                  color: isPassed ? 'var(--accent2)' : 'var(--danger)',
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {isDistinction ? '🏆 Distinction' : isPassed ? '✓ Passed' : '⚠️ Needs Improvement'}
              </span>
              <span className="badge">Official Evaluation</span>
            </div>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>
              Assessment Results
            </h2>
          </div>

          <a
            className="primary"
            href={api.reportCardUrl(attemptId)}
            download
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              fontSize: 13.5,
              textDecoration: 'none',
              boxShadow: 'var(--accent-glow)',
            }}
          >
            <span>📄</span>
            <span>Download Official PDF Report</span>
          </a>
        </div>

        {/* 4-Tile Metric Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
          <div className="stat-tile" style={{ margin: 0 }}>
            <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>FINAL SCORE</span>
            <div
              className="stat-tile-val"
              style={{
                color: isPassed ? 'var(--accent2)' : 'var(--danger)',
                fontSize: 32,
              }}
            >
              {results.score} <span style={{ fontSize: 18, color: 'var(--muted)', fontWeight: 500 }}>/ {results.total}</span>
            </div>
            <span className="muted" style={{ fontSize: 11.5 }}>
              {results.score === results.total ? 'Full score achieved' : `${results.total - results.score} incorrect`}
            </span>
          </div>

          <div className="stat-tile" style={{ margin: 0 }}>
            <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>PERCENTAGE</span>
            <div className="stat-tile-val" style={{ color: 'var(--accent)', fontSize: 32 }}>
              {percentage}%
            </div>
            <div className="progress-outer" style={{ height: 6, marginTop: 4 }}>
              <div
                className="progress-inner"
                style={{
                  width: `${percentage}%`,
                  background: isPassed ? 'var(--accent2-gradient)' : 'var(--danger-gradient)',
                }}
              />
            </div>
          </div>

          <div className="stat-tile" style={{ margin: 0 }}>
            <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>OUTCOME STATUS</span>
            <div
              className="stat-tile-val"
              style={{
                fontSize: 22,
                color: isPassed ? 'var(--accent2)' : 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {isPassed ? 'Qualified' : 'Remedial'}
            </div>
            <span className="muted" style={{ fontSize: 11.5 }}>
              {isPassed ? 'Threshold 50% met' : 'Below 50% threshold'}
            </span>
          </div>

          <div className="stat-tile" style={{ margin: 0 }}>
            <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>REVISION PRACTICE</span>
            <div className="stat-tile-val" style={{ fontSize: 32, color: 'var(--text)' }}>
              {results.revisionQuestions?.length || 0}
            </div>
            <span className="muted" style={{ fontSize: 11.5 }}>Adaptive questions ready</span>
          </div>
        </div>
      </div>

      {/* Weak Topics / Mastery Section */}
      <div className="card glass-panel" style={{ padding: '26px 28px', borderRadius: 18, marginBottom: 24 }}>
        {results.noGaps ? (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 14,
              background: 'color-mix(in srgb, var(--accent2) 10%, var(--card))',
              border: '1px solid color-mix(in srgb, var(--accent2) 30%, transparent)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
            }}
          >
            <span style={{ fontSize: 32 }}>🎉</span>
            <div>
              <h3 style={{ margin: '0 0 4px', color: 'var(--accent2)', fontSize: 18, fontWeight: 700 }}>
                Flawless Domain Mastery!
              </h3>
              <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
                You demonstrated complete accuracy across all tested subject topics. We have attached an optional stretch question below to challenge and sharpen your high-level problem solving.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>📌</span>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                Personalized Knowledge Diagnostics
              </h3>
            </div>
            <p className="muted" style={{ margin: '0 0 14px', fontSize: 13.5 }}>
              Our adaptive diagnostic engine isolated concept vulnerabilities in the following topics:
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {results.weakTopics.map((topic, i) => (
                <span
                  key={i}
                  className="badge"
                  style={{
                    background: 'color-mix(in srgb, var(--danger) 14%, var(--card))',
                    color: 'var(--danger)',
                    border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
                    padding: '6px 14px',
                    fontSize: 13,
                    fontWeight: 700,
                    borderRadius: 10,
                  }}
                >
                  ⚠️ {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Practice Questions Interactive Area */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h4 style={{ margin: '0 0 3px', fontSize: 17, fontWeight: 700 }}>
                Targeted Practice Set ({results.revisionQuestions?.length || 0} Questions)
              </h4>
              <span className="muted" style={{ fontSize: 12.5 }}>
                Interactive instant-evaluation questions to reinforce weak concept areas.
              </span>
            </div>
            {practiceGraded && (
              <button
                type="button"
                className="secondary"
                onClick={handleResetPractice}
                style={{ fontSize: 12.5, padding: '6px 14px' }}
              >
                ↺ Retry Practice Set
              </button>
            )}
          </div>

          {practiceGraded && practiceGradeResult && (
            <div
              style={{
                background:
                  practiceGradeResult.score === practiceGradeResult.total
                    ? 'color-mix(in srgb, var(--accent2) 12%, var(--card))'
                    : 'color-mix(in srgb, var(--accent) 10%, var(--card))',
                border: `1.5px solid ${
                  practiceGradeResult.score === practiceGradeResult.total ? 'var(--accent2)' : 'var(--accent)'
                }`,
                borderRadius: 14,
                padding: '16px 20px',
                marginBottom: 22,
                boxShadow: 'var(--shadow-sm)',
              }}
              className="fade-in"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 20 }}>
                  {practiceGradeResult.score === practiceGradeResult.total ? '🌟' : '💡'}
                </span>
                <strong style={{ fontSize: 16.5, fontWeight: 800 }}>
                  Practice Grade: {practiceGradeResult.score} / {practiceGradeResult.total} Correct
                </strong>
              </div>
              <span className="muted" style={{ fontSize: 13.5, marginLeft: 30, display: 'block' }}>
                {practiceGradeResult.score === practiceGradeResult.total
                  ? 'Superb! You demonstrated full understanding across all revision items.'
                  : 'Review the green highlighted options below to reinforce your understanding of correct concepts.'}
              </span>
            </div>
          )}

          {(!results.revisionQuestions || results.revisionQuestions.length === 0) ? (
            <p className="muted" style={{ textAlign: 'center', padding: '24px 0' }}>
              No practice questions required for this submission.
            </p>
          ) : (
            results.revisionQuestions.map((q, idx) => {
              const selectedIdx = practiceAnswers[q.variantId];
              const gradeItem = practiceGradeResult?.results?.find((r) => r.variantId === q.variantId);
              const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

              return (
                <div
                  key={q.variantId || idx}
                  style={{
                    background: 'var(--card)',
                    borderRadius: 14,
                    padding: '20px 22px',
                    marginBottom: 18,
                    border: '1.5px solid var(--border)',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        className="badge"
                        style={{
                          background: 'color-mix(in srgb, var(--accent) 12%, var(--bg))',
                          color: 'var(--accent)',
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        Q{idx + 1} &middot; {q.topic}
                      </span>
                    </div>

                    {practiceGraded && gradeItem && (
                      <span
                        className="badge"
                        style={{
                          background: gradeItem.isCorrect
                            ? 'color-mix(in srgb, var(--accent2) 20%, transparent)'
                            : 'color-mix(in srgb, var(--danger) 20%, transparent)',
                          color: gradeItem.isCorrect ? 'var(--accent2)' : 'var(--danger)',
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        {gradeItem.isCorrect ? '✓ Correct' : '✕ Incorrect'}
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '0 0 16px', fontSize: 15.5, fontWeight: 600, lineHeight: 1.5 }}>
                    {q.text}
                  </p>

                  <div className="options">
                    {q.options.map((opt, optIdx) => {
                      const letter = letters[optIdx] || String(optIdx + 1);
                      const isSelected = selectedIdx === optIdx;
                      const isCorrect = q.correctIndex === optIdx;

                      let className = 'opt';
                      if (practiceGraded) {
                        if (isCorrect) className += ' correct';
                        else if (isSelected) className += ' wrong';
                      } else if (isSelected) {
                        className += ' selected';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          className={className}
                          onClick={() => selectPracticeOption(q.variantId, optIdx)}
                          disabled={practiceGraded}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            borderRadius: 11,
                            cursor: practiceGraded ? 'default' : 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 7,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 700,
                                background: practiceGraded && isCorrect
                                  ? 'var(--accent2)'
                                  : practiceGraded && isSelected && !isCorrect
                                  ? 'var(--danger)'
                                  : isSelected
                                  ? 'var(--accent)'
                                  : 'color-mix(in srgb, var(--text) 8%, transparent)',
                                color: isSelected || (practiceGraded && isCorrect) ? '#fff' : 'var(--text)',
                              }}
                            >
                              {letter}
                            </span>
                            <span style={{ fontSize: 14.5 }}>{opt}</span>
                          </div>

                          {practiceGraded && isCorrect && (
                            <span
                              style={{
                                color: 'var(--accent2)',
                                fontWeight: 700,
                                fontSize: 12.5,
                                background: 'var(--accent2-light)',
                                padding: '3px 8px',
                                borderRadius: 6,
                              }}
                            >
                              ✓ Correct Answer
                            </span>
                          )}
                          {practiceGraded && isSelected && !isCorrect && (
                            <span
                              style={{
                                color: 'var(--danger)',
                                fontWeight: 700,
                                fontSize: 12.5,
                                background: 'var(--danger-light)',
                                padding: '3px 8px',
                                borderRadius: 6,
                              }}
                            >
                              ✕ Your Choice
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {!practiceGraded && results.revisionQuestions?.length > 0 && (
            <button
              className="primary"
              onClick={handleGradePractice}
              disabled={gradingLoading || Object.keys(practiceAnswers).length === 0}
              style={{
                width: '100%',
                marginTop: 10,
                padding: '13px',
                fontSize: 14.5,
                fontWeight: 700,
                boxShadow: 'var(--accent-glow)',
              }}
            >
              {gradingLoading ? 'Submitting & Grading Practice…' : '✓ Check & Grade Practice Set'}
            </button>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 32 }}>
        <Link
          to="/student"
          className="secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 26px',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 10,
          }}
        >
          ← Return to Student Portal
        </Link>
      </div>
    </div>
  );
}
