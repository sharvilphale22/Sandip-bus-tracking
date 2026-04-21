import { NavLink } from 'react-router-dom';

export default function Sidebar({ links, open, onClose }) {
  return (
    <>
      <div className={`sidebar-overlay ${open ? 'visible' : ''}`} onClick={onClose}></div>
      <aside className={`sidebar ${open ? 'open' : ''}`} id="main-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">🚌</div>
          <div className="sidebar-brand">
            <h2>Sandip Bus</h2>
            <span>Tracking System</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              end={link.end}
            >
              <span className="sidebar-link-icon">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            © 2026 Sandip Foundation
          </div>
        </div>
      </aside>
    </>
  );
}
