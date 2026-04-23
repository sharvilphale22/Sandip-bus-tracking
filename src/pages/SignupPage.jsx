import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ✅ Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    setLoading(true);

    try {
      // 🔍 Debug: what we are sending
      console.log("Sending data:", { name, email, password, phone });

      // API call
      const response = await register(name, email, password, phone);

      // 🔍 Debug: what backend returns
      console.log("Backend response:", response);

      // ❗ Check response structure
      if (!response || !response.user) {
        throw new Error("Invalid response from server");
      }

      // ✅ Success → redirect
      navigate(`/${response.user.role}`, { replace: true });

    } catch (err) {
      // 🔍 Full error debug
      console.error("Full error:", err);

      const backendMessage = err.response?.data?.message;
      const fallbackMessage = err.message;

      setError(
        backendMessage ||
        fallbackMessage ||
        'Registration failed. Please try again.'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-orb orb1"></div>
      <div className="login-bg-orb orb2"></div>

      <div className="login-card signup-card">
        <div className="login-header">
          <div className="login-logo">🔐</div>
          <h1>Admin Sign Up</h1>
          <p>Create a new administrator account</p>
        </div>

        {error && (
          <div className="login-error" id="signup-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Email + Phone */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="admin@sandip.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone (Optional)</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Passwords */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Min. 4 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={4}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={4}
              />
            </div>
          </div>

          {/* Role Info */}
          <div className="signup-role-info">
            <span className="signup-role-badge">🔐 Admin Role</span>
            <p>
              This account will have full administrative access to the bus
              tracking system.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary login-submit"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Admin Account'}
          </button>
        </form>

        {/* Footer */}
        <div className="signup-footer">
          Already have an account?{' '}
          <Link to="/login" className="signup-link">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
