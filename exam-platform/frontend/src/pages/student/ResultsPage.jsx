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

  return (
    <div style={{ maxWidth: 740, margin: '24px auto', padding: '0 12px' }}>
      {/* Score Summary Card */}
      <div className="card" style={{ padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div className="topbar">
          <div>
            <span className="badge" style={{ marginBottom: 6 }}>Official Grade</span>
            <h2 style={{ margin: 0, fontSize: 24 }}>Examination Completed</h2>
          </div>
          <a
            className="secondary"
            href={api.reportCardUrl(attemptId)}
            download
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
          >
            <span>⬇</span> Download Official PDF Report Card
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 18, flexWrap: 'wrap' }}>
          <div style={{
            fontSize: 42,
            fontWeight: 800,
            color: isPassed ? 'var(--accent2)' : 'var(--danger)',
            lineHeight: 1
          }}>
            {results.score} <span style={{ fontSize: 22, color: 'var(--muted)', fontWeight: 400 }}>/ {results.total}</span>
          </div>

          <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: 18 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{percentage}% Score</div>
            <div className="muted" style={{ fontSize: 13 }}>
              {isPassed ? 'Congratulations, you passed this assessment!' : 'Review your revision questions below to reinforce key concepts.'}
            </div>
          </div>
        </div>
      </div>

      {/* Weak Topics / Mastery Card */}
      <div className="card" style={{ padding: 24 }}>
        {results.noGaps ? (
          <div>
            <h3 style={{ margin: '0 0 6px', color: 'var(--accent2)' }}>🎉 Perfect Mastery! No Weak Topics Detected</h3>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>
              Outstanding performance across all tested domains. Here is an advanced stretch practice question to challenge you further:
            </p>
          </div>
        ) : (
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>📌 Personalized Revision Plan</h3>
            <p className="muted" style={{ margin: '0 0 14px', fontSize: 14 }}>
              The algorithm identified performance gaps in:
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {results.weakTopics.map((topic, i) => (
                <span
                  key={i}
                  className="badge"
                  style={{
                    background: 'color-mix(in srgb, var(--danger) 15%, var(--card))',
                    color: 'var(--danger)',
                    border: '1px solid var(--danger)',
                    padding: '4px 12px',
                    fontSize: 13,
                    fontWeight: 600
                  }}
                >
                  ⚠ {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Practice Questions Interactive Area */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: 16 }}>
              Interactive Practice Set ({results.revisionQuestions.length} Questions)
            </h4>
            {practiceGraded && (
              <button className="secondary" onClick={handleResetPractice} style={{ fontSize: 12, padding: '4px 10px' }}>
                ↺ Retry Practice Set
              </button>
            )}
          </div>

          {practiceGraded && practiceGradeResult && (
            <div style={{
              background: practiceGradeResult.score === practiceGradeResult.total
                ? 'color-mix(in srgb, var(--accent2) 15%, var(--card))'
                : 'color-mix(in srgb, var(--accent) 12%, var(--card))',
              border: `1px solid ${practiceGradeResult.score === practiceGradeResult.total ? 'var(--accent2)' : 'var(--accent)'}`,
              borderRadius: 10,
              padding: '14px 18px',
              marginBottom: 20
            }}>
              <strong style={{ fontSize: 16, display: 'block', marginBottom: 4 }}>
                Practice Score: {practiceGradeResult.score} / {practiceGradeResult.total} Correct
              </strong>
              <span className="muted" style={{ fontSize: 13 }}>
                {practiceGradeResult.score === practiceGradeResult.total
                  ? '🌟 Excellent! You demonstrated mastery on all practice questions!'
                  : 'Review the green highlighted correct answers below to improve your understanding.'}
              </span>
            </div>
          )}

          {results.revisionQuestions.length === 0 ? (
            <p className="muted">No revision questions available.</p>
          ) : (
            results.revisionQuestions.map((q, idx) => {
              const selectedIdx = practiceAnswers[q.variantId];
              const gradeItem = practiceGradeResult?.results?.find((r) => r.variantId === q.variantId);

              return (
                <div
                  key={q.variantId || idx}
                  style={{
                    background: 'var(--bg)',
                    borderRadius: 10,
                    padding: '16px 18px',
                    marginBottom: 16,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span className="badge" style={{ fontWeight: 600 }}>
                      Practice #{idx + 1} &middot; {q.topic}
                    </span>
                    {practiceGraded && gradeItem && (
                      <span
                        className="badge"
                        style={{
                          background: gradeItem.isCorrect ? 'color-mix(in srgb, var(--accent2) 20%, transparent)' : 'color-mix(in srgb, var(--danger) 20%, transparent)',
                          color: gradeItem.isCorrect ? 'var(--accent2)' : 'var(--danger)',
                          fontWeight: 600
                        }}
                      >
                        {gradeItem.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 500 }}>{q.text}</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {q.options.map((opt, optIdx) => {
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
                            margin: 0,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span>{opt}</span>
                          {practiceGraded && isCorrect && (
                            <span style={{ color: 'var(--accent2)', fontWeight: 700, fontSize: 13 }}>✓ Correct Answer</span>
                          )}
                          {practiceGraded && isSelected && !isCorrect && (
                            <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: 13 }}>✗ Your Answer</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {!practiceGraded && results.revisionQuestions.length > 0 && (
            <button
              className="primary"
              onClick={handleGradePractice}
              disabled={gradingLoading || Object.keys(practiceAnswers).length === 0}
              style={{ width: '100%', marginTop: 8, padding: '12px' }}
            >
              {gradingLoading ? 'Grading Practice…' : '✓ Check & Grade Practice Set'}
            </button>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link to="/student" className="secondary" style={{ display: 'inline-block', padding: '10px 24px' }}>
          ← Return to All Exams
        </Link>
      </div>
    </div>
  );
}
