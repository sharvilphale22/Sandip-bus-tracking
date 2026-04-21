import { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', erpId: '', phone: '', assignedBus: '', pickupPoint: '', dropPoint: '' });

  const fetchData = async () => {
    try {
      const [studRes, busRes] = await Promise.all([
        api.get('/admin/students', { params: { search } }),
        api.get('/admin/buses')
      ]);
      setStudents(studRes.data.students);
      setBuses(busRes.data.buses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: 'student123', erpId: '', phone: '', assignedBus: '', pickupPoint: '', dropPoint: '' });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name, email: s.email, password: '', erpId: s.erpId || '', phone: s.phone || '',
      assignedBus: s.assignedBus?._id || '', pickupPoint: s.pickupPoint || '', dropPoint: s.dropPoint || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/admin/students/${editing._id}`, form);
      } else {
        await api.post('/admin/students', form);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving student');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this student?')) return;
    try {
      await api.delete(`/admin/students/${id}`);
      fetchData();
    } catch (err) {
      alert('Error deleting student');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Manage Students</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="student-search"
            />
          </div>
          <button className="btn btn-primary" onClick={openCreate} id="add-student-btn">➕ Add Student</button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table" id="students-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>ERP ID</th>
                <th>Phone</th>
                <th>Bus</th>
                <th>Pickup</th>
                <th>Drop</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan="8"><div className="empty-state"><div className="empty-state-icon">🎓</div><h3>No students found</h3></div></td></tr>
              ) : (
                students.map((s) => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.email}</td>
                    <td><span className="badge badge-cyan">{s.erpId || '—'}</span></td>
                    <td>{s.phone || '—'}</td>
                    <td><span className="badge badge-purple">{s.assignedBus?.busNumber || 'Unassigned'}</span></td>
                    <td>{s.pickupPoint || '—'}</td>
                    <td>{s.dropPoint || '—'}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)}>✏️</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s._id)}>🗑️</button>
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
              <h3 className="modal-title">{editing ? 'Edit Student' : 'Add Student'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input className="form-input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required />
                  </div>
                </div>
                {!editing && (
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required />
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">ERP ID</label>
                    <input className="form-input" value={form.erpId} onChange={(e) => setForm({...form, erpId: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Assigned Bus</label>
                  <select className="form-select" value={form.assignedBus} onChange={(e) => setForm({...form, assignedBus: e.target.value})}>
                    <option value="">— No bus assigned —</option>
                    {buses.map((b) => <option key={b._id} value={b._id}>{b.busNumber} ({b.licensePlate})</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Pickup Point</label>
                    <input className="form-input" value={form.pickupPoint} onChange={(e) => setForm({...form, pickupPoint: e.target.value})} placeholder="e.g. CBS" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Drop Point</label>
                    <input className="form-input" value={form.dropPoint} onChange={(e) => setForm({...form, dropPoint: e.target.value})} placeholder="e.g. Sandip College" />
                  </div>
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
