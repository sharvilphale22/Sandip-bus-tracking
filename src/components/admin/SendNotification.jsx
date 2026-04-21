import { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { timeAgo } from '../../utils/helpers';

export default function SendNotification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', targetRole: 'all' });

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/admin/notifications');
      setNotifications(res.data.notifications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/admin/notifications', form);
      setForm({ title: '', message: '', targetRole: 'all' });
      fetchNotifications();
    } catch (err) {
      alert(err.response?.data?.message || 'Error sending notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">🔔 Notifications</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Send Form */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Send New Notification</h3>
          </div>
          <form onSubmit={handleSend}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                className="form-input"
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
                placeholder="e.g. Bus Delay Notice"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea
                className="form-textarea"
                value={form.message}
                onChange={(e) => setForm({...form, message: e.target.value})}
                placeholder="Type your notification message..."
                rows={4}
                required
              ></textarea>
            </div>
            <div className="form-group">
              <label className="form-label">Target Audience</label>
              <select
                className="form-select"
                value={form.targetRole}
                onChange={(e) => setForm({...form, targetRole: e.target.value})}
              >
                <option value="all">📢 All Users</option>
                <option value="students">🎓 Students Only</option>
                <option value="drivers">🚌 Drivers Only</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={sending} style={{ width: '100%' }}>
              {sending ? 'Sending...' : '📤 Send Notification'}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Notifications</h3>
            <span className="badge badge-cyan">{notifications.length}</span>
          </div>
          {loading ? (
            <LoadingSpinner />
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔕</div>
              <h3>No notifications sent yet</h3>
            </div>
          ) : (
            <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
              {notifications.map((n) => (
                <div key={n._id} className="notification-item">
                  <h5>{n.title}</h5>
                  <p>{n.message}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span className={`badge ${n.targetRole === 'all' ? 'badge-cyan' : n.targetRole === 'students' ? 'badge-purple' : 'badge-green'}`}>
                      {n.targetRole === 'all' ? '📢 All' : n.targetRole === 'students' ? '🎓 Students' : '🚌 Drivers'}
                    </span>
                    <span className="time">{timeAgo(n.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
