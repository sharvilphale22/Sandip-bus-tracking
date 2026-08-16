import { useAuth } from '../context/AuthContext';
import { LogOut, Bus } from 'lucide-react';

export default function Navbar({ title = 'Sandip Bus', subtitle, showLogout = true, actions }) {
  const { user, logout } = useAuth();

  const roleLabels = { student: 'Student', driver: 'Driver', admin: 'Administrator' };

  return (
    <header className="app-header">
      <div className="max-w-content mx-auto h-full px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
            <Bus className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-text-primary truncate">{title}</h1>
            <p className="text-xs text-text-muted truncate -mt-0.5">
              {subtitle || roleLabels[user?.role] || 'Dashboard'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
          {user && (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
              <div className="text-right">
                <p className="text-sm font-medium text-text-primary leading-tight">{user.name}</p>
                <p className="text-xs text-text-muted">{user.id}</p>
              </div>
              <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                {user.name?.charAt(0) || '?'}
              </div>
            </div>
          )}
          {showLogout && (
            <button
              type="button"
              onClick={logout}
              className="w-11 h-11 rounded-md border border-border flex items-center justify-center text-text-muted hover:text-error hover:border-error/30 hover:bg-error-bg transition-colors"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
