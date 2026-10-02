import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import StartExamPage from './pages/student/StartExamPage';
import ExamPage from './pages/student/ExamPage';
import ResultsPage from './pages/student/ResultsPage';
import CreateExamPage from './pages/faculty/CreateExamPage';
import ProgressWallPage from './pages/faculty/ProgressWallPage';
import FacultyAnalyticsPage from './pages/faculty/FacultyAnalyticsPage';
import AuthPage from './pages/auth/AuthPage';

function ProtectedRoute({ children, role }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="card hint" style={{ maxWidth: 400, margin: '60px auto', textAlign: 'center' }}>
        <p>Loading session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role && user.role !== 'ADMIN') {
    return (
      <div className="card" style={{ maxWidth: 500, margin: '60px auto', textAlign: 'center' }}>
        <h3 className="error">Access Restricted</h3>
        <p className="muted">This area is reserved for {role.toLowerCase()} accounts.</p>
        <Link to={user.role === 'FACULTY' ? '/faculty' : '/student'} className="primary" style={{ display: 'inline-block', marginTop: 12 }}>
          Go to your portal
        </Link>
      </div>
    );
  }

  return children;
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isFaculty, logout, loading } = useAuth();

  const isExamActive = location.pathname.includes('/student/exam/');
  const currentPath = location.pathname;

  return (
    <div>
      {!isExamActive && (
        <header>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link to="/" className="brand-logo">
              <div className="brand-icon-box">
                <span>📝</span>
              </div>
              <div>
                <h1 className="brand-title">ExamSmart</h1>
              </div>
            </Link>
            <span className="brand-badge">
              v2.5 PRO
            </span>
          </div>

          <nav className="tabs">
            {isAuthenticated ? (
              <>
                <Link
                  to="/student"
                  className={currentPath.startsWith('/student') ? 'active' : ''}
                >
                  <span>🎓</span>
                  <span>Student Portal</span>
                </Link>
                {isFaculty && (
                  <Link
                    to="/faculty"
                    className={currentPath.startsWith('/faculty') ? 'active' : ''}
                  >
                    <span>👩‍🏫</span>
                    <span>Faculty Portal</span>
                  </Link>
                )}
              </>
            ) : (
              <Link
                to="/login"
                className={currentPath === '/login' || currentPath === '/register' ? 'active' : ''}
              >
                Sign In
              </Link>
            )}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* User Avatar Chip */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: isFaculty
                        ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                        : 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}
                  >
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', fontSize: 13 }}>
                    <span style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>{user?.name}</span>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: isFaculty ? '#1d4ed8' : '#047857',
                        textTransform: 'uppercase',
                        letterSpacing: 0.6,
                      }}
                    >
                      {user?.role}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="secondary"
                  style={{
                    fontSize: 12.5,
                    padding: '6px 14px',
                    borderRadius: 7,
                    fontWeight: 600,
                  }}
                >
                  Log Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="primary"
                style={{ fontSize: 13, padding: '8px 18px', textDecoration: 'none' }}
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </header>
      )}

      <main>
        <Routes>
          <Route
            path="/"
            element={
              loading ? (
                <div className="card hint" style={{ maxWidth: 400, margin: '60px auto' }}>Loading…</div>
              ) : isAuthenticated ? (
                <Navigate to={isFaculty ? '/faculty' : '/student'} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />

          {/* Student routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute role="STUDENT">
                <StartExamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exam/:attemptId"
            element={
              <ProtectedRoute>
                <ExamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/results/:attemptId"
            element={
              <ProtectedRoute>
                <ResultsPage />
              </ProtectedRoute>
            }
          />

          {/* Faculty routes */}
          <Route
            path="/faculty"
            element={
              <ProtectedRoute role="FACULTY">
                <CreateExamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/progress/:examId"
            element={
              <ProtectedRoute role="FACULTY">
                <ProgressWallPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/analytics/:examId"
            element={
              <ProtectedRoute role="FACULTY">
                <FacultyAnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
