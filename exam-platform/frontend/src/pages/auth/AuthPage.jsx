import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('STUDENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const user = await register({ name, email, password, role });
        navigate(user.role === 'FACULTY' ? '/faculty' : '/student');
      } else {
        const user = await login(email, password);
        navigate(user.role === 'FACULTY' ? '/faculty' : '/student');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickLogin(targetEmail, targetPassword, targetRole) {
    setError(null);
    setLoading(true);
    try {
      const user = await login(targetEmail, targetPassword);
      navigate(user.role === 'FACULTY' ? '/faculty' : '/student');
    } catch (err) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 460, margin: '40px auto', padding: '0 16px' }}>
      <div className="card" style={{ padding: '30px 26px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📝</div>
          <h2 style={{ margin: '0 0 6px', fontSize: 24 }}>ExamSmart</h2>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Smart Examination & Assessment Platform
          </p>
        </div>

        {/* Tab switch between Sign In and Register */}
        <div style={{ display: 'flex', background: 'var(--border)', borderRadius: 10, padding: 4, marginBottom: 22 }}>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 8,
              fontWeight: !isRegister ? 600 : 400,
              background: !isRegister ? 'var(--card)' : 'transparent',
              color: !isRegister ? 'var(--text)' : 'var(--muted)',
              cursor: 'pointer',
              boxShadow: !isRegister ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 8,
              fontWeight: isRegister ? 600 : 400,
              background: isRegister ? 'var(--card)' : 'transparent',
              color: isRegister ? 'var(--text)' : 'var(--muted)',
              cursor: 'pointer',
              boxShadow: isRegister ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div style={{
            background: 'color-mix(in srgb, var(--danger) 12%, var(--card))',
            color: 'var(--danger)',
            border: '1px solid var(--danger)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            marginBottom: 16
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <label className="field-label">I am a</label>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <label style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `2px solid ${role === 'STUDENT' ? 'var(--accent)' : 'var(--border)'}`,
                  background: role === 'STUDENT' ? 'color-mix(in srgb, var(--accent) 8%, var(--bg))' : 'var(--bg)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: 13
                }}>
                  <input
                    type="radio"
                    name="role"
                    value="STUDENT"
                    checked={role === 'STUDENT'}
                    onChange={() => setRole('STUDENT')}
                    style={{ display: 'none' }}
                  />
                  🎓 Student
                </label>
                <label style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `2px solid ${role === 'FACULTY' ? 'var(--accent)' : 'var(--border)'}`,
                  background: role === 'FACULTY' ? 'color-mix(in srgb, var(--accent) 8%, var(--bg))' : 'var(--bg)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: 13
                }}>
                  <input
                    type="radio"
                    name="role"
                    value="FACULTY"
                    checked={role === 'FACULTY'}
                    onChange={() => setRole('FACULTY')}
                    style={{ display: 'none' }}
                  />
                  👩‍🏫 Faculty
                </label>
              </div>

              <label className="field-label">Full Name</label>
              <input
                className="input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                required
              />
            </>
          )}

          <label className="field-label">Email Address</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu"
            required
          />

          <label className="field-label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
          />

          <button
            className="primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%', marginTop: 20, padding: '12px' }}
          >
            {loading ? 'Please wait…' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
          <p className="muted" style={{ textAlign: 'center', fontSize: 12, marginBottom: 12 }}>
            Demo Quick Login
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              className="secondary"
              style={{ fontSize: 12, padding: '8px 12px', textAlign: 'left' }}
              onClick={() => handleQuickLogin('student@test.com', 'password123', 'STUDENT')}
              disabled={loading}
            >
              🎓 <strong>Test Student</strong> &middot; student@test.com
            </button>
            <button
              type="button"
              className="secondary"
              style={{ fontSize: 12, padding: '8px 12px', textAlign: 'left' }}
              onClick={() => handleQuickLogin('faculty@test.com', 'password123', 'FACULTY')}
              disabled={loading}
            >
              👩‍🏫 <strong>Test Faculty</strong> &middot; faculty@test.com
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
