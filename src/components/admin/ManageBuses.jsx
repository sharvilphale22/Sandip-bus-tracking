import { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { getBusStatusLabel } from '../../utils/helpers';

export default function ManageBuses() {
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ busNumber: '', licensePlate: '', capacity: '', route: '', driver: '' });

  const fetchData = async () => {
    try {
      const [busRes, driverRes, routeRes] = await Promise.all([
        api.get('/admin/buses'),
        api.get('/admin/drivers'),
        api.get('/admin/routes')
      ]);
      setBuses(busRes.data.buses);
      setDrivers(driverRes.data.drivers);
      setRoutes(routeRes.data.routes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ busNumber: '', licensePlate: '', capacity: '45', route: '', driver: '' });
    setShowModal(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({
      busNumber: b.busNumber, licensePlate: b.licensePlate, capacity: String(b.capacity),
      route: b.route?._id || '', driver: b.driver?._id || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, capacity: Number(form.capacity) };
      if (editing) {
        await api.put(`/admin/buses/${editing._id}`, payload);
      } else {
        await api.post('/admin/buses', payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving bus');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this bus?')) return;
    try {
      await api.delete(`/admin/buses/${id}`);
      fetchData();
    } catch (err) {
      alert('Error deleting bus');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Manage Buses</h2>
        <button className="btn btn-primary" onClick={openCreate} id="add-bus-btn">➕ Add Bus</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table" id="buses-table">
            <thead>
              <tr>
                <th>Bus No.</th>
                <th>License Plate</th>
                <th>Capacity</th>
                <th>Route</th>
                <th>Driver</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buses.length === 0 ? (
                <tr><td colSpan="7"><div className="empty-state"><div className="empty-state-icon">🚌</div><h3>No buses found</h3></div></td></tr>
              ) : (
                buses.map((b) => (
                  <tr key={b._id}>
                    <td style={{ fontWeight: 700 }}>{b.busNumber}</td>
                    <td>{b.licensePlate}</td>
                    <td>{b.capacity}</td>
                    <td><span className="badge badge-purple">{b.route?.name?.split('—')[0]?.trim() || 'Unassigned'}</span></td>
                    <td>{b.driver?.name || '—'}</td>
                    <td><span className={`badge ${b.status === 'moving' ? 'badge-cyan' : b.status === 'active' ? 'badge-green' : b.status === 'stopped' ? 'badge-orange' : 'badge-gray'}`}>{getBusStatusLabel(b.status)}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(b)}>✏️</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(b._id)}>🗑️</button>
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
              <h3 className="modal-title">{editing ? 'Edit Bus' : 'Add Bus'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Bus Number</label>
                    <input className="form-input" value={form.busNumber} onChange={(e) => setForm({...form, busNumber: e.target.value})} placeholder="e.g. BUS-04" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">License Plate</label>
                    <input className="form-input" value={form.licensePlate} onChange={(e) => setForm({...form, licensePlate: e.target.value})} placeholder="e.g. MH-15-XX-1234" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity</label>
                  <input className="form-input" type="number" min="1" value={form.capacity} onChange={(e) => setForm({...form, capacity: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Route</label>
                  <select className="form-select" value={form.route} onChange={(e) => setForm({...form, route: e.target.value})}>
                    <option value="">— No route —</option>
                    {routes.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Driver</label>
                  <select className="form-select" value={form.driver} onChange={(e) => setForm({...form, driver: e.target.value})}>
                    <option value="">— No driver —</option>
                    {drivers.map((d) => <option key={d._id} value={d._id}>{d.name} ({d.email})</option>)}
                  </select>
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
