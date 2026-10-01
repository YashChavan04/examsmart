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
            <Link to="/" style={{ textDecoration: 'none', color: '#fff' }}>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <span>📝</span>
                <span>ExamSmart</span>
              </h1>
            </Link>
            <span style={{
              fontSize: 11,
              background: 'rgba(255,255,255,0.15)',
              padding: '2px 8px',
              borderRadius: 12,
              letterSpacing: 0.5,
              fontWeight: 600
            }}>
              v2.0
            </span>
          </div>

          <nav className="tabs" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isAuthenticated ? (
              <>
                <Link
                  to="/student"
                  className={currentPath.startsWith('/student') ? 'active' : ''}
                >
                  Student Portal
                </Link>
                {isFaculty && (
                  <Link
                    to="/faculty"
                    className={currentPath.startsWith('/faculty') ? 'active' : ''}
                  >
                    Faculty Portal
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{user?.name}</span>
                  <span style={{ fontSize: 11, color: isFaculty ? '#93c5fd' : '#86efac', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {user?.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="secondary"
                  style={{
                    fontSize: 12,
                    padding: '6px 12px',
                    borderColor: 'rgba(255,255,255,0.2)',
                    color: '#e2e8f0',
                    background: 'rgba(255,255,255,0.06)'
                  }}
                >
                  Log Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="primary"
                style={{ fontSize: 13, padding: '7px 16px', textDecoration: 'none' }}
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
