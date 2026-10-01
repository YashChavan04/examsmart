import { useParams, Link } from 'react-router-dom';
import { useProgressWall } from '../../hooks/useProgressWall';
import ProgressBar from '../../components/ProgressBar';

export default function ProgressWallPage() {
  const { examId } = useParams();
  const { snapshot, connected } = useProgressWall(examId);

  return (
    <div style={{ maxWidth: 960, margin: '24px auto', padding: '0 12px' }}>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Link to="/faculty" className="secondary" style={{ fontSize: 12, padding: '4px 8px' }}>
              ← Faculty Portal
            </Link>
            <span className={`badge ${connected ? 'badge-live' : ''}`} style={{ fontWeight: 600 }}>
              {connected ? '● WebSocket Live' : '○ Connecting…'}
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Live Proctor Progress Wall</h2>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Link to={`/faculty/analytics/${examId}`} className="primary" style={{ fontSize: 13 }}>
            📊 View Full Analytics &amp; CSV
          </Link>
        </div>
      </div>

      {!snapshot ? (
        <div className="card hint">
          <h3>Waiting for Live Updates…</h3>
          <p className="muted">Live progress snapshots update automatically as students answer questions or trigger focus events.</p>
        </div>
      ) : (
        <>
          <div className="grid2" style={{ marginBottom: 16 }}>
            <div className="card" style={{ margin: 0, padding: 18 }}>
              <span className="muted" style={{ fontSize: 13 }}>Submissions</span>
              <h2 style={{ margin: '4px 0 0', fontSize: 26 }}>
                {snapshot.submittedCount} <span style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 400 }}>/ {snapshot.totalCount} Candidates</span>
              </h2>
            </div>
            <div className="card" style={{ margin: 0, padding: 18 }}>
              <span className="muted" style={{ fontSize: 13 }}>Total Integrity Flags</span>
              <h2 style={{ margin: '4px 0 0', fontSize: 26, color: snapshot.totalFlags > 0 ? 'var(--danger)' : 'var(--accent2)' }}>
                {snapshot.totalFlags} <span style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 400 }}>events recorded</span>
              </h2>
            </div>
          </div>

          <div className="card wide-container" style={{ padding: 20 }}>
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Live Progress</th>
                  <th>Score</th>
                  <th>Focus Flags</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.students.map((s, i) => {
                  const isSubmitted = s.status === 'SUBMITTED';
                  const isInProgress = s.status === 'IN_PROGRESS';
                  const statusBg = isSubmitted ? 'var(--accent2)' : isInProgress ? 'var(--accent)' : 'var(--muted)';

                  return (
                    <tr
                      key={i}
                      style={{
                        background: s.excessiveFlags ? 'color-mix(in srgb, var(--danger) 8%, var(--card))' : 'inherit'
                      }}
                    >
                      <td>
                        <strong>{s.studentName}</strong>
                        {s.studentEmail && (
                          <div className="muted" style={{ fontSize: 11 }}>{s.studentEmail}</div>
                        )}
                      </td>
                      <td>
                        <span className="status-dot" style={{ background: statusBg }} />
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{s.status}</span>
                      </td>
                      <td style={{ minWidth: 160 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <ProgressBar percent={s.progressPercent} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 32 }}>
                            {s.progressPercent}%
                          </span>
                        </div>
                      </td>
                      <td>
                        {isSubmitted && s.score !== null ? (
                          <strong>{s.score} / {s.totalQuestions}</strong>
                        ) : (
                          <span className="muted">&mdash;</span>
                        )}
                      </td>
                      <td>
                        {s.flags > 0 ? (
                          <span
                            className="badge"
                            style={{
                              background: s.excessiveFlags ? 'var(--danger)' : 'color-mix(in srgb, #f59e0b 20%, transparent)',
                              color: s.excessiveFlags ? '#fff' : '#b45309',
                              fontWeight: 700
                            }}
                          >
                            {s.flags} ⚠ {s.excessiveFlags ? 'EXCESSIVE' : ''}
                          </span>
                        ) : (
                          <span className="muted">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
