import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bus, Shield, User, Truck, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { getFriendlyError } from '../utils/format';

const roles = [
  { key: 'student', label: 'Student', icon: User, placeholder: 'ERP ID (e.g. STU001)' },
  { key: 'driver', label: 'Driver', icon: Truck, placeholder: 'Driver ID (e.g. DRV001)' },
  { key: 'admin', label: 'Admin', icon: Shield, placeholder: 'Admin username' },
];

export default function Login() {
  const { login } = useAuth();
  const [activeRole, setActiveRole] = useState('student');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const currentRole = roles.find(r => r.key === activeRole);
  const RoleIcon = currentRole.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(loginId, password);
    } catch (err) {
      setError(getFriendlyError(err.response?.data?.message || 'Unable to sign in'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-primary mb-4">
            <Bus className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-text-primary mb-1">Welcome back</h1>
          <p className="text-sm text-text-secondary">Sign in to track your college bus live</p>
        </header>

        <div className="card-raised p-6">
          <div className="flex gap-1 mb-6 p-1 bg-surface-muted rounded-md border border-border" role="tablist" aria-label="Login role">
            {roles.map(role => {
              const Icon = role.icon;
              const selected = activeRole === role.key;
              return (
                <button
                  key={role.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => {
                    setActiveRole(role.key);
                    setError('');
                    setLoginId('');
                    setPassword('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-sm text-sm font-medium min-h-[44px] transition-colors ${
                    selected
                      ? 'bg-surface text-primary shadow-sm border border-border'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden xs:inline sm:inline">{role.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="loginId" className="label">
                {activeRole === 'student' ? 'ERP ID' : activeRole === 'driver' ? 'Driver ID' : 'Username'}
              </label>
              <div className="relative">
                <RoleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" aria-hidden="true" />
                <input
                  id="loginId"
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder={currentRole.placeholder}
                  className={`input-field pl-11 ${error ? 'input-error' : ''}`}
                  required
                  autoComplete="username"
                  aria-invalid={!!error}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`input-field pl-11 pr-11 ${error ? 'input-error' : ''}`}
                  required
                  autoComplete="current-password"
                  aria-invalid={!!error}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-text-muted hover:text-text-secondary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-banner" role="alert">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                `Log in as ${currentRole.label}`
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-surface-muted rounded-md border border-border">
            <p className="text-xs font-medium text-text-muted mb-2">Demo credentials</p>
            <div className="space-y-1 text-xs text-text-secondary">
              <p>Student: <span className="text-primary font-medium">STU001</span> / password123</p>
              <p>Driver: <span className="text-success font-medium">DRV001</span> / password123</p>
              <p>Admin: <span className="text-text-primary font-medium">admin</span> / admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
