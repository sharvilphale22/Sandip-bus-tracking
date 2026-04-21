import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { timeAgo } from '../../utils/helpers';

export default function NotificationBell() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef(null);

  // Fetch existing notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        let res;
        if (user?.role === 'admin') {
          res = await api.get('/admin/notifications');
        } else if (user?.role === 'student') {
          res = await api.get('/student/notifications');
        } else {
          return;
        }
        setNotifications(res.data.notifications || []);
      } catch (err) {
        // Silently handle
      }
    };
    if (user) fetchNotifications();
  }, [user]);

  // Listen for new notifications via socket
  useEffect(() => {
    if (!socket) return;

    const handler = (data) => {
      setNotifications(prev => [data, ...prev]);
      setUnread(prev => prev + 1);
    };

    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
  }, [socket]);

  // Listen for emergency alerts
  useEffect(() => {
    if (!socket) return;

    const handler = (data) => {
      const alertNotif = {
        _id: Date.now(),
        title: '🚨 Emergency Alert',
        message: `${data.driverName}: ${data.message}`,
        createdAt: data.timestamp
      };
      setNotifications(prev => [alertNotif, ...prev]);
      setUnread(prev => prev + 1);
    };

    socket.on('emergency:alert', handler);
    return () => socket.off('emergency:alert', handler);
  }, [socket]);

  // Close panel on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <button
        className="notification-bell"
        onClick={() => {
          setShowPanel(!showPanel);
          setUnread(0);
        }}
        id="notification-bell-btn"
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && <span className="notification-count">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {showPanel && (
        <div className="notification-panel">
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, fontSize: '0.9rem' }}>
            Notifications
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No notifications yet
            </div>
          ) : (
            notifications.slice(0, 15).map((n, i) => (
              <div key={n._id || i} className="notification-item">
                <h5>{n.title}</h5>
                <p>{n.message}</p>
                <div className="time">{timeAgo(n.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
