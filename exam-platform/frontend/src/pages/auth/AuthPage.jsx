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
    <div style={{ maxWidth: 480, margin: '48px auto', padding: '0 16px' }} className="fade-in">
      <div
        className="card glass-panel"
        style={{
          padding: '36px 32px',
          boxShadow: 'var(--shadow-lg)',
          borderRadius: 20,
          border: '1px solid var(--card-border-subtle)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Clean top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: '#2563eb',
          }}
        />

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: '#2563eb',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              color: '#fff',
              marginBottom: 14,
            }}
          >
            🎓
          </div>
          <h2
            style={{
              margin: '0 0 6px',
              fontSize: 25,
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: '#0f172a',
            }}
          >
            ExamSmart
          </h2>
          <p className="muted" style={{ margin: 0, fontSize: 13.5, fontWeight: 500, color: '#64748b' }}>
            Smart Examination &amp; Assessment Platform
          </p>
        </div>

        {/* Modern Segmented Control Tab */}
        <div
          style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: 8,
            padding: 4,
            marginBottom: 24,
            border: '1px solid #e2e8f0',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            style={{
              flex: 1,
              padding: '9px 14px',
              border: 'none',
              borderRadius: 6,
              fontWeight: !isRegister ? 700 : 500,
              fontSize: 13.5,
              background: !isRegister ? '#ffffff' : 'transparent',
              color: !isRegister ? '#2563eb' : '#64748b',
              cursor: 'pointer',
              boxShadow: !isRegister ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            style={{
              flex: 1,
              padding: '9px 14px',
              border: 'none',
              borderRadius: 6,
              fontWeight: isRegister ? 700 : 500,
              fontSize: 13.5,
              background: isRegister ? '#ffffff' : 'transparent',
              color: isRegister ? '#2563eb' : '#64748b',
              cursor: 'pointer',
              boxShadow: isRegister ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'color-mix(in srgb, var(--danger) 10%, var(--card))',
              color: 'var(--danger)',
              border: '1.5px solid color-mix(in srgb, var(--danger) 30%, transparent)',
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: 13.5,
              fontWeight: 500,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="fade-in">
              <label className="field-label" style={{ marginTop: 0 }}>Select Your Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '14px 10px',
                    borderRadius: 12,
                    border: `2px solid ${role === 'STUDENT' ? 'var(--accent)' : 'var(--border)'}`,
                    background: role === 'STUDENT' ? 'color-mix(in srgb, var(--accent) 10%, var(--card))' : 'var(--card)',
                    cursor: 'pointer',
                    boxShadow: role === 'STUDENT' ? '0 0 0 1px var(--accent)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value="STUDENT"
                    checked={role === 'STUDENT'}
                    onChange={() => setRole('STUDENT')}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: 24 }}>🎓</span>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: role === 'STUDENT' ? 'var(--accent)' : 'var(--text)' }}>
                    Student
                  </span>
                  <span className="muted" style={{ fontSize: 11, textAlign: 'center' }}>
                    Take exams & review
                  </span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '14px 10px',
                    borderRadius: 12,
                    border: `2px solid ${role === 'FACULTY' ? 'var(--accent)' : 'var(--border)'}`,
                    background: role === 'FACULTY' ? 'color-mix(in srgb, var(--accent) 10%, var(--card))' : 'var(--card)',
                    cursor: 'pointer',
                    boxShadow: role === 'FACULTY' ? '0 0 0 1px var(--accent)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value="FACULTY"
                    checked={role === 'FACULTY'}
                    onChange={() => setRole('FACULTY')}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: 24 }}>👩‍🏫</span>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: role === 'FACULTY' ? 'var(--accent)' : 'var(--text)' }}>
                    Faculty
                  </span>
                  <span className="muted" style={{ fontSize: 11, textAlign: 'center' }}>
                    Author & proctor exams
                  </span>
                </label>
              </div>

              <label className="field-label">Full Name</label>
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <input
                  className="input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  required
                  style={{ paddingLeft: 14 }}
                />
              </div>
            </div>
          )}

          <label className="field-label" style={{ marginTop: isRegister ? 0 : 0 }}>Email Address</label>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@institution.edu"
              required
              autoComplete="email"
            />
          </div>

          <label className="field-label">Password</label>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              minLength={6}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </div>

          <button
            className="primary"
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              fontSize: 15,
              fontWeight: 700,
              boxShadow: 'var(--accent-glow)',
            }}
          >
            {loading ? 'Authenticating…' : isRegister ? 'Create Account & Continue' : 'Sign In to Portal'}
          </button>
        </form>

        {/* Demo Quick Login Section */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--muted)' }}>
              ⚡ Instant Demo Access
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              type="button"
              className="secondary"
              style={{
                fontSize: 12.5,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 8,
                borderRadius: 10,
              }}
              onClick={() => handleQuickLogin('student@test.com', 'password123', 'STUDENT')}
              disabled={loading}
            >
              <span style={{ fontSize: 18 }}>🎓</span>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <strong style={{ display: 'block', fontSize: 12.5 }}>Student Demo</strong>
                <span className="muted" style={{ fontSize: 10.5 }}>student@test.com</span>
              </div>
            </button>

            <button
              type="button"
              className="secondary"
              style={{
                fontSize: 12.5,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 8,
                borderRadius: 10,
              }}
              onClick={() => handleQuickLogin('faculty@test.com', 'password123', 'FACULTY')}
              disabled={loading}
            >
              <span style={{ fontSize: 18 }}>👩‍🏫</span>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <strong style={{ display: 'block', fontSize: 12.5 }}>Faculty Demo</strong>
                <span className="muted" style={{ fontSize: 10.5 }}>faculty@test.com</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
