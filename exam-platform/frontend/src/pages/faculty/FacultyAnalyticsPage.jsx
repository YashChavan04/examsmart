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
    <div style={{ maxWidth: 960, margin: '24px auto', padding: '0 14px' }}>
      {/* Header with Title and CSV Export */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Link to="/faculty" className="secondary" style={{ fontSize: 12, padding: '4px 8px' }}>
              ← Faculty Portal
            </Link>
            <span className="badge" style={{ background: 'color-mix(in srgb, var(--accent) 15%, var(--bg))', color: 'var(--accent)' }}>
              {analytics.subject}
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: 24 }}>{analytics.title} &mdash; Analytics</h2>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link to={`/faculty/progress/${examId}`} className="secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🔴</span> Live Progress Wall
          </Link>
          <a
            className="primary"
            href={api.exportCsvUrl(examId)}
            download
            style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
          >
            <span>⬇</span> Export CSV Report
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="card" style={{ margin: 0, padding: 18 }}>
          <span className="muted" style={{ fontSize: 13 }}>Average Score</span>
          <div style={{ fontSize: 28, fontWeight: 700, margin: '6px 0 2px', color: 'var(--accent)' }}>
            {summary.averageScore} <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--muted)' }}>({summary.averagePercentage}%)</span>
          </div>
          <span className="muted" style={{ fontSize: 12 }}>High: {summary.highestScore} &middot; Low: {summary.lowestScore}</span>
        </div>

        <div className="card" style={{ margin: 0, padding: 18 }}>
          <span className="muted" style={{ fontSize: 13 }}>Total Submissions</span>
          <div style={{ fontSize: 28, fontWeight: 700, margin: '6px 0 2px' }}>
            {summary.submittedAttempts} <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--muted)' }}>/ {summary.totalAttempts}</span>
          </div>
          <span className="muted" style={{ fontSize: 12 }}>{summary.inProgressAttempts} active in progress</span>
        </div>

        <div className="card" style={{ margin: 0, padding: 18 }}>
          <span className="muted" style={{ fontSize: 13 }}>Flagged Students</span>
          <div style={{
            fontSize: 28,
            fontWeight: 700,
            margin: '6px 0 2px',
            color: summary.flaggedStudentsCount > 0 ? 'var(--danger)' : 'var(--accent2)'
          }}>
            {summary.flaggedStudentsCount}
          </div>
          <span className="muted" style={{ fontSize: 12 }}>{summary.totalFlags} total integrity event(s)</span>
        </div>

        <div className="card" style={{ margin: 0, padding: 18 }}>
          <span className="muted" style={{ fontSize: 13 }}>Completion Rate</span>
          <div style={{ fontSize: 28, fontWeight: 700, margin: '6px 0 2px', color: 'var(--accent2)' }}>
            {summary.totalAttempts > 0 ? Math.round((summary.submittedAttempts / summary.totalAttempts) * 100) : 0}%
          </div>
          <span className="muted" style={{ fontSize: 12 }}>Of all registered candidates</span>
        </div>
      </div>

      {/* Grid: Score Distribution & Average Per Topic */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16, marginBottom: 20 }}>
        {/* Score Distribution Histogram */}
        <div className="card" style={{ margin: 0, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>📊 Score Distribution</h3>
          {summary.submittedAttempts === 0 ? (
            <p className="muted">No completed submissions to display score distribution yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scoreDistribution.map((bucket, i) => {
                const barWidth = (bucket.count / maxBucketCount) * 100;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span><strong>{bucket.rangeLabel}</strong></span>
                      <span className="muted">{bucket.count} student(s)</span>
                    </div>
                    <div style={{ height: 16, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${barWidth}%`,
                          background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
                          borderRadius: 4,
                          transition: 'width 0.5s ease',
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
        <div className="card" style={{ margin: 0, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>🎯 Accuracy Average Per Topic</h3>
          {topicAverages.length === 0 ? (
            <p className="muted">No student topic answers recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topicAverages.map((t, idx) => {
                const color = t.accuracyRate >= 70 ? 'var(--accent2)' : t.accuracyRate >= 45 ? '#f59e0b' : 'var(--danger)';
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{t.topic}</span>
                      <span style={{ color, fontWeight: 700 }}>
                        {t.accuracyRate}% ({t.totalCorrect}/{t.totalAnswered})
                      </span>
                    </div>
                    <div style={{ height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${t.accuracyRate}%`,
                          background: color,
                          borderRadius: 5,
                          transition: 'width 0.5s ease',
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
      <div className="card" style={{ marginBottom: 20, padding: 20 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 16 }}>🔥 Hardest Questions (Lowest Student Accuracy)</h3>
        {hardestQuestions.length === 0 ? (
          <p className="muted">No question statistics accumulated yet.</p>
        ) : (
          <div className="wide-container">
            <table>
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Question Template</th>
                  <th>Difficulty</th>
                  <th>Times Answered</th>
                  <th>Failure Rate</th>
                </tr>
              </thead>
              <tbody>
                {hardestQuestions.map((q) => (
                  <tr key={q.templateId}>
                    <td><strong>{q.topic}</strong></td>
                    <td style={{ maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {q.templateText}
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: q.difficulty === 'HARD' ? 'color-mix(in srgb, var(--danger) 15%, transparent)' : 'var(--border)',
                        color: q.difficulty === 'HARD' ? 'var(--danger)' : 'var(--muted)'
                      }}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td>{q.timesAnswered}</td>
                    <td>
                      <strong style={{ color: q.failureRate >= 50 ? 'var(--danger)' : 'var(--text)' }}>
                        {q.failureRate}%
                      </strong> ({q.timesWrong} wrong)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Flagged Students List */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>🚨 Integrity Review: Flagged Candidates</h3>
          <span className="badge" style={{ background: flaggedStudents.length > 0 ? 'color-mix(in srgb, var(--danger) 15%, transparent)' : 'var(--border)', color: flaggedStudents.length > 0 ? 'var(--danger)' : 'var(--muted)' }}>
            {flaggedStudents.length} Candidate(s) Flagged
          </span>
        </div>

        {flaggedStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--accent2)' }}>
            ✓ No suspicious activity or excessive focus switches recorded for this exam.
          </div>
        ) : (
          <div className="wide-container">
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Total Flags</th>
                  <th>Violation Types</th>
                </tr>
              </thead>
              <tbody>
                {flaggedStudents.map((s) => (
                  <tr key={s.attemptId}>
                    <td><strong>{s.studentName}</strong></td>
                    <td className="muted">{s.studentEmail}</td>
                    <td>
                      <span className="badge">{s.status}</span>
                    </td>
                    <td>{s.score !== null ? `${s.score}/${s.totalQuestions}` : 'N/A'}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: s.flagCount >= 3 ? 'var(--danger)' : '#f59e0b',
                          color: '#fff',
                          fontWeight: 700
                        }}
                      >
                        {s.flagCount} {s.flagCount === 1 ? 'flag' : 'flags'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {s.flagTypes.map((type, i) => (
                          <span key={i} className="badge" style={{ fontSize: 11 }}>
                            {type}
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
