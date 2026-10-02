import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';

export default function FacultyAnalyticsPage() {
  const { examId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, [examId]);

  async function loadAnalytics() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAnalytics(examId);
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="card hint" style={{ maxWidth: 600, margin: '40px auto' }}>
        <h3>Loading Exam Analytics…</h3>
        <p className="muted">Aggregating score distributions, topic performance, and student integrity flags.</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="card" style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
        <h3 className="error">Failed to Load Analytics</h3>
        <p className="muted">{error || 'No data found for this exam.'}</p>
        <Link to="/faculty" className="primary" style={{ display: 'inline-block', marginTop: 12 }}>
          Back to Faculty Portal
        </Link>
      </div>
    );
  }

  const { summary, scoreDistribution, topicAverages, hardestQuestions, flaggedStudents } = analytics;
  const maxBucketCount = Math.max(1, ...scoreDistribution.map((b) => b.count));

  return (
    <div style={{ maxWidth: 1040, margin: '28px auto', padding: '0 16px' }} className="fade-in">
      {/* Header with Title and Action Controls */}
      <div
        className="card glass-panel"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          padding: '24px 28px',
          borderRadius: 20,
          boxShadow: 'var(--shadow-md)',
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Link to="/faculty" className="secondary" style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8 }}>
              ← Faculty Portal
            </Link>
            <span
              className="badge"
              style={{
                background: 'color-mix(in srgb, var(--accent) 15%, var(--bg))',
                color: 'var(--accent)',
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              📚 {analytics.subject}
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>
            {analytics.title} <span className="muted" style={{ fontWeight: 400, fontSize: 20 }}>&middot; Analytics &amp; Integrity</span>
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            to={`/faculty/progress/${examId}`}
            className="secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 16px',
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            <span style={{ color: '#ef4444' }}>●</span> Live Proctor Wall
          </Link>
          <a
            className="primary"
            href={api.exportCsvUrl(examId)}
            download
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              fontSize: 13.5,
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: 'var(--accent-glow)',
            }}
          >
            <span>📊</span> Export CSV Dataset
          </a>
        </div>
      </div>

      {/* KPI 4-Card Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="stat-tile" style={{ margin: 0 }}>
          <span className="muted" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>AVERAGE PERFORMANCE</span>
          <div className="stat-tile-val" style={{ color: 'var(--accent)' }}>
            {summary.averageScore}{' '}
            <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--muted)' }}>
              ({summary.averagePercentage}%)
            </span>
          </div>
          <span className="muted" style={{ fontSize: 12 }}>
            High: <strong>{summary.highestScore}</strong> &middot; Low: <strong>{summary.lowestScore}</strong>
          </span>
        </div>

        <div className="stat-tile" style={{ margin: 0 }}>
          <span className="muted" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>CANDIDATE SUBMISSIONS</span>
          <div className="stat-tile-val">
            {summary.submittedAttempts}{' '}
            <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--muted)' }}>
              / {summary.totalAttempts}
            </span>
          </div>
          <span className="muted" style={{ fontSize: 12 }}>
            {summary.inProgressAttempts > 0 ? (
              <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                ⚡ {summary.inProgressAttempts} actively taking exam
              </span>
            ) : (
              'All candidate attempts processed'
            )}
          </span>
        </div>

        <div className="stat-tile" style={{ margin: 0 }}>
          <span className="muted" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>INTEGRITY VIOLATIONS</span>
          <div
            className="stat-tile-val"
            style={{
              color: summary.flaggedStudentsCount > 0 ? 'var(--danger)' : 'var(--accent2)',
            }}
          >
            {summary.flaggedStudentsCount}{' '}
            <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--muted)' }}>flagged</span>
          </div>
          <span className="muted" style={{ fontSize: 12 }}>
            {summary.totalFlags > 0 ? `${summary.totalFlags} proctor focus events` : '✓ Zero integrity incidents'}
          </span>
        </div>

        <div className="stat-tile" style={{ margin: 0 }}>
          <span className="muted" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>COMPLETION RATE</span>
          <div className="stat-tile-val" style={{ color: 'var(--accent2)' }}>
            {summary.totalAttempts > 0 ? Math.round((summary.submittedAttempts / summary.totalAttempts) * 100) : 0}%
          </div>
          <div className="progress-outer" style={{ height: 6, marginTop: 4 }}>
            <div
              className="progress-inner"
              style={{
                width: `${summary.totalAttempts > 0 ? Math.round((summary.submittedAttempts / summary.totalAttempts) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Grid: Score Distribution & Average Per Topic */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Score Distribution Histogram */}
        <div className="card glass-panel" style={{ margin: 0, padding: 24, borderRadius: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>📊 Score Distribution</h3>
            <span className="badge" style={{ fontSize: 11 }}>Histogram</span>
          </div>

          {summary.submittedAttempts === 0 ? (
            <p className="muted" style={{ padding: '24px 0', textAlign: 'center' }}>
              No completed submissions to compute score distribution yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {scoreDistribution.map((bucket, i) => {
                const barWidth = (bucket.count / maxBucketCount) * 100;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                      <span style={{ fontWeight: 600 }}>{bucket.rangeLabel}</span>
                      <span className="muted" style={{ fontWeight: 600 }}>
                        {bucket.count} candidate{bucket.count === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 14,
                        background: 'color-mix(in srgb, var(--text) 8%, transparent)',
                        borderRadius: 8,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${barWidth}%`,
                          background: '#2563eb',
                          borderRadius: 8,
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Topic Mastery / Average Per Topic */}
        <div className="card glass-panel" style={{ margin: 0, padding: 24, borderRadius: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>🎯 Topic Mastery Breakdown</h3>
            <span className="badge" style={{ fontSize: 11 }}>Cohort Accuracy</span>
          </div>

          {topicAverages.length === 0 ? (
            <p className="muted" style={{ padding: '24px 0', textAlign: 'center' }}>
              No topic response metrics accumulated yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {topicAverages.map((t, idx) => {
                const color = t.accuracyRate >= 70 ? 'var(--accent2)' : t.accuracyRate >= 45 ? '#f59e0b' : 'var(--danger)';
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 5 }}>
                      <span style={{ fontWeight: 600 }}>{t.topic}</span>
                      <span
                        style={{
                          color,
                          fontWeight: 700,
                          background: `color-mix(in srgb, ${color} 12%, transparent)`,
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                      >
                        {t.accuracyRate}% ({t.totalCorrect}/{t.totalAnswered})
                      </span>
                    </div>
                    <div
                      style={{
                        height: 10,
                        background: 'color-mix(in srgb, var(--text) 8%, transparent)',
                        borderRadius: 6,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${t.accuracyRate}%`,
                          background: color,
                          borderRadius: 6,
                          transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hardest Questions Table */}
      <div className="card glass-panel" style={{ marginBottom: 24, padding: 24, borderRadius: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
            🔥 Questions Requiring Reinforcement (Lowest Accuracy)
          </h3>
          <span className="badge" style={{ fontSize: 11 }}>Item Analysis</span>
        </div>

        {hardestQuestions.length === 0 ? (
          <p className="muted" style={{ padding: '16px 0', textAlign: 'center' }}>
            No question error metrics accumulated yet.
          </p>
        ) : (
          <div className="wide-container">
            <table>
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Question Prompt</th>
                  <th>Difficulty</th>
                  <th>Total Answers</th>
                  <th>Failure Rate</th>
                </tr>
              </thead>
              <tbody>
                {hardestQuestions.map((q) => (
                  <tr key={q.templateId}>
                    <td><strong>{q.topic}</strong></td>
                    <td style={{ maxWidth: 360, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {q.templateText}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background:
                            q.difficulty === 'HARD'
                              ? 'color-mix(in srgb, var(--danger) 15%, transparent)'
                              : 'var(--border)',
                          color: q.difficulty === 'HARD' ? 'var(--danger)' : 'var(--muted)',
                          fontWeight: 600,
                        }}
                      >
                        {q.difficulty}
                      </span>
                    </td>
                    <td>{q.timesAnswered}</td>
                    <td>
                      <strong style={{ color: q.failureRate >= 50 ? 'var(--danger)' : 'var(--text)' }}>
                        {q.failureRate}%
                      </strong>{' '}
                      <span className="muted" style={{ fontSize: 12 }}>({q.timesWrong} incorrect)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Flagged Students Integrity Review List */}
      <div className="card glass-panel" style={{ padding: 24, borderRadius: 18, marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ margin: '0 0 3px', fontSize: 17, fontWeight: 700 }}>
              🚨 Proctor Integrity Review: Flagged Candidates
            </h3>
            <span className="muted" style={{ fontSize: 12.5 }}>
              Focus losses, tab switches, and fullscreen departure events flagged during proctored sessions.
            </span>
          </div>

          <span
            className="badge"
            style={{
              background:
                flaggedStudents.length > 0
                  ? 'color-mix(in srgb, var(--danger) 18%, transparent)'
                  : 'color-mix(in srgb, var(--accent2) 18%, transparent)',
              color: flaggedStudents.length > 0 ? 'var(--danger)' : 'var(--accent2)',
              fontWeight: 700,
              padding: '6px 14px',
            }}
          >
            {flaggedStudents.length} Candidate{flaggedStudents.length === 1 ? '' : 's'} Flagged
          </span>
        </div>

        {flaggedStudents.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '24px 0',
              color: 'var(--accent2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontWeight: 600,
            }}
          >
            <span>✓</span> No suspicious proctor events or excessive tab switches recorded for this exam.
          </div>
        ) : (
          <div className="wide-container">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Flag Count</th>
                  <th>Recorded Violations</th>
                </tr>
              </thead>
              <tbody>
                {flaggedStudents.map((s) => (
                  <tr key={s.attemptId}>
                    <td>
                      <strong>{s.studentName}</strong>
                      <div className="muted" style={{ fontSize: 11 }}>{s.studentEmail}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ fontWeight: 600 }}>{s.status}</span>
                    </td>
                    <td>
                      <strong>{s.score !== null ? `${s.score}/${s.totalQuestions}` : 'In Progress'}</strong>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: s.flagCount >= 3 ? 'var(--danger)' : '#f59e0b',
                          color: '#fff',
                          fontWeight: 700,
                        }}
                      >
                        {s.flagCount} event{s.flagCount === 1 ? '' : 's'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {s.flagTypes.map((type, i) => (
                          <span
                            key={i}
                            className="badge"
                            style={{
                              fontSize: 11,
                              background: 'color-mix(in srgb, var(--danger) 12%, var(--card))',
                              color: 'var(--danger)',
                              border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)',
                            }}
                          >
                            ⚠️ {type}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
