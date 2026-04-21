import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [activeRole, setActiveRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const hints = {
    admin: { email: 'admin@sandip.edu', pass: 'admin123' },
    driver: { email: 'rajesh@sandip.edu', pass: 'driver123' },
    student: { email: 'sandip@sandip.edu', pass: 'student123' }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      navigate(`/${user.role}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-orb orb1"></div>
      <div className="login-bg-orb orb2"></div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🚌</div>
          <h1>Sandip Bus Tracker</h1>
          <p>Real-time college bus tracking system</p>
        </div>

        <div className="role-tabs" id="role-tabs">
          {['admin', 'driver', 'student'].map((role) => (
            <button
              key={role}
              className={`role-tab ${activeRole === role ? 'active' : ''}`}
              onClick={() => {
                setActiveRole(role);
                setEmail(hints[role].email);
                setPassword(hints[role].pass);
                setError('');
              }}
              id={`role-tab-${role}`}
            >
              {role === 'admin' ? '🔐' : role === 'driver' ? '🚌' : '🎓'}{' '}
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>

        {error && <div className="login-error" id="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              id="login-email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              id="login-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit"
            disabled={loading}
            id="login-submit-btn"
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
                Signing in...
              </>
            ) : (
              `Sign in as ${activeRole.charAt(0).toUpperCase() + activeRole.slice(1)}`
            )}
          </button>
        </form>

        <div className="login-hint">
          Demo: <span>{hints[activeRole].email}</span> / <span>{hints[activeRole].pass}</span>
        </div>

        <div className="signup-footer">
          Admin? <Link to="/signup" className="signup-link">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
