import { useParams, Link } from 'react-router-dom';
import { useProgressWall } from '../../hooks/useProgressWall';
import ProgressBar from '../../components/ProgressBar';

export default function ProgressWallPage() {
  const { examId } = useParams();
  const { snapshot, connected } = useProgressWall(examId);

  return (
    <div style={{ maxWidth: 1000, margin: '28px auto', padding: '0 16px' }} className="fade-in">
      {/* Live Proctor Header */}
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
              className={`badge ${connected ? 'badge-live' : ''}`}
              style={{
                fontWeight: 700,
                fontSize: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: connected ? '#10b981' : '#f59e0b',
                  display: 'inline-block',
                }}
              />
              {connected ? 'WebSocket Live Feed Active' : 'Connecting to Proctor Stream…'}
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Real-Time Proctor Progress Wall
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link
            to={`/faculty/analytics/${examId}`}
            className="primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              fontSize: 13.5,
              fontWeight: 600,
              boxShadow: 'var(--accent-glow)',
            }}
          >
            <span>📊</span> View Detailed Analytics
          </Link>
        </div>
      </div>

      {!snapshot ? (
        <div className="card glass-panel hint" style={{ padding: '48px 24px', borderRadius: 18, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📡</div>
          <h3 style={{ margin: '0 0 6px', fontSize: 18 }}>Awaiting Live Proctor Updates…</h3>
          <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
            Live progress snapshots sync automatically via WebSocket as candidates answer questions or switch tabs.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="stat-tile" style={{ margin: 0 }}>
              <span className="muted" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>CANDIDATE SUBMISSIONS</span>
              <div className="stat-tile-val" style={{ color: 'var(--accent)' }}>
                {snapshot.submittedCount}{' '}
                <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--muted)' }}>
                  / {snapshot.totalCount}
                </span>
              </div>
              <span className="muted" style={{ fontSize: 12 }}>
                {snapshot.totalCount - snapshot.submittedCount} active or pending
              </span>
            </div>

            <div className="stat-tile" style={{ margin: 0 }}>
              <span className="muted" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>PROCTOR INTEGRITY FLAGS</span>
              <div
                className="stat-tile-val"
                style={{
                  color: snapshot.totalFlags > 0 ? 'var(--danger)' : 'var(--accent2)',
                }}
              >
                {snapshot.totalFlags}{' '}
                <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--muted)' }}>events</span>
              </div>
              <span className="muted" style={{ fontSize: 12 }}>
                {snapshot.totalFlags > 0 ? 'Review flagged candidates below' : '✓ Clean cohort session'}
              </span>
            </div>

            <div className="stat-tile" style={{ margin: 0 }}>
              <span className="muted" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>COMPLETION PROGRESS</span>
              <div className="stat-tile-val" style={{ color: 'var(--accent2)' }}>
                {snapshot.totalCount > 0 ? Math.round((snapshot.submittedCount / snapshot.totalCount) * 100) : 0}%
              </div>
              <div className="progress-outer" style={{ height: 6, marginTop: 4 }}>
                <div
                  className="progress-inner"
                  style={{
                    width: `${snapshot.totalCount > 0 ? Math.round((snapshot.submittedCount / snapshot.totalCount) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Student Progress Table */}
          <div className="card glass-panel" style={{ padding: 24, borderRadius: 18, marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                Candidate Roster ({snapshot.students.length})
              </h3>
              <span className="badge" style={{ fontSize: 11 }}>Live Synchronized</span>
            </div>

            <div className="wide-container">
              <table>
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Status</th>
                    <th style={{ minWidth: 200 }}>Real-Time Progress</th>
                    <th>Score</th>
                    <th>Proctor Focus Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.students.map((s, i) => {
                    const isSubmitted = s.status === 'SUBMITTED';
                    const isInProgress = s.status === 'IN_PROGRESS';
                    const statusColor = isSubmitted ? 'var(--accent2)' : isInProgress ? 'var(--accent)' : 'var(--muted)';
                    const initials = s.studentName ? s.studentName.slice(0, 2).toUpperCase() : 'ST';

                    return (
                      <tr
                        key={i}
                        style={{
                          background: s.excessiveFlags
                            ? 'color-mix(in srgb, var(--danger) 10%, var(--card))'
                            : 'inherit',
                        }}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                background: 'color-mix(in srgb, var(--accent) 15%, var(--card))',
                                color: 'var(--accent)',
                                fontWeight: 700,
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                              }}
                            >
                              {initials}
                            </div>
                            <div>
                              <strong>{s.studentName}</strong>
                              {s.studentEmail && (
                                <div className="muted" style={{ fontSize: 11 }}>{s.studentEmail}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className="badge"
                            style={{
                              background: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
                              color: statusColor,
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: statusColor,
                                display: 'inline-block',
                                marginRight: 6,
                              }}
                            />
                            {s.status}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ flex: 1 }}>
                              <ProgressBar percent={s.progressPercent} />
                            </div>
                            <span
                              style={{
                                fontSize: 12.5,
                                fontWeight: 700,
                                color: 'var(--text-secondary)',
                                minWidth: 36,
                              }}
                            >
                              {s.progressPercent}%
                            </span>
                          </div>
                        </td>

                        <td>
                          {isSubmitted && s.score !== null ? (
                            <strong style={{ fontSize: 14 }}>
                              {s.score} <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>/ {s.totalQuestions}</span>
                            </strong>
                          ) : (
                            <span className="muted">&mdash;</span>
                          )}
                        </td>

                        <td>
                          {s.flags > 0 ? (
                            <span
                              className="badge"
                              style={{
                                background: s.excessiveFlags ? 'var(--danger)' : '#f59e0b',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: 12,
                              }}
                            >
                              {s.flags} ⚠️ {s.excessiveFlags ? 'EXCESSIVE' : 'alert'}
                            </span>
                          ) : (
                            <span className="muted" style={{ fontSize: 12, color: 'var(--accent2)', fontWeight: 600 }}>
                              ✓ Clean (0)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
