import { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

export default function ManageDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/admin/drivers');
      setDrivers(res.data.drivers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: 'driver123', phone: '' });
    setShowModal(true);
  };

  const openEdit = (d) => {
    setEditing(d);
    setForm({ name: d.name, email: d.email, password: '', phone: d.phone || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/admin/drivers/${editing._id}`, form);
      } else {
        await api.post('/admin/drivers', form);
      }
      setShowModal(false);
      fetchDrivers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving driver');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this driver?')) return;
    try {
      await api.delete(`/admin/drivers/${id}`);
      fetchDrivers();
    } catch (err) {
      alert('Error deleting driver');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Manage Drivers</h2>
        <button className="btn btn-primary" onClick={openCreate} id="add-driver-btn">➕ Add Driver</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table" id="drivers-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Assigned Bus</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr><td colSpan="6"><div className="empty-state"><div className="empty-state-icon">👤</div><h3>No drivers found</h3></div></td></tr>
              ) : (
                drivers.map((d) => (
                  <tr key={d._id}>
                    <td style={{ fontWeight: 600 }}>{d.name}</td>
                    <td>{d.email}</td>
                    <td>{d.phone || '—'}</td>
                    <td><span className="badge badge-purple">{d.assignedBus?.busNumber || 'Unassigned'}</span></td>
                    <td>
                      <span className={`badge ${d.isOnline ? 'badge-green' : 'badge-gray'}`}>
                        <span className={`status-dot ${d.isOnline ? 'online' : 'offline'}`}></span>
                        {d.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(d)}>✏️</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(d._id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Edit Driver' : 'Add Driver'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required />
                </div>
                {!editing && (
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
