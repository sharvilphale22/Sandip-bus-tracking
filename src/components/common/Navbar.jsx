import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import NotificationBell from './NotificationBell';

export default function Navbar({ title, onMenuToggle }) {
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <nav className="navbar" id="main-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="menu-toggle" onClick={onMenuToggle} aria-label="Toggle menu">
          ☰
        </button>
        <h1 className="navbar-title">{title}</h1>
      </div>

      <div className="navbar-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
          <span className={`status-dot ${connected ? 'online' : 'offline'}`}></span>
          <span style={{ color: connected ? 'var(--accent-green)' : 'var(--text-muted)', fontWeight: 500 }}>
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>

        <NotificationBell />

        <div className="navbar-user">
          <div className="navbar-avatar">{initials}</div>
          <div>
            <div className="navbar-username">{user?.name}</div>
            <div className="navbar-role">{user?.role}</div>
          </div>
        </div>

        <button className="btn btn-sm btn-secondary" onClick={logout} id="logout-btn">
          🚪 Logout
        </button>
      </div>
    </nav>
  );
}
