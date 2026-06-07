import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { login } from '../../services/authService';
import type { UserRole } from '../../models/types';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login({ email, password });
      loginUser({
        userId: res.user.userId,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role as UserRole,
        token: res.token,
      });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo">
          <h1>Clinic Flow</h1>
          <p>Hospital Management System</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              placeholder="doctor@clinic.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>

        <div style={{ marginTop: '24px', padding: '14px', background: 'rgba(6,182,212,0.08)', borderRadius: '10px', border: '1px solid rgba(6,182,212,0.15)' }}>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>Demo Credentials</p>
          <div style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.8 }}>
            <div><strong style={{ color: '#cbd5e1' }}>Admin:</strong> admin@clinic.com / admin123</div>
            <div><strong style={{ color: '#cbd5e1' }}>Clinician:</strong> clinician@clinic.com / clinician123</div>
            <div><strong style={{ color: '#cbd5e1' }}>Reception:</strong> reception@clinic.com / reception123</div>
            <div><strong style={{ color: '#cbd5e1' }}>Patient:</strong> patient@clinic.com / patient123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
