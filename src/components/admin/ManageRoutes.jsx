import { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

export default function ManageRoutes() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    startPoint: { name: '', lat: '', lng: '' },
    endPoint: { name: '', lat: '', lng: '' },
    stops: []
  });

  const fetchRoutes = async () => {
    try {
      const res = await api.get('/admin/routes');
      setRoutes(res.data.routes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoutes(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      startPoint: { name: '', lat: '', lng: '' },
      endPoint: { name: '', lat: '', lng: '' },
      stops: [{ name: '', lat: '', lng: '', order: 1 }]
    });
    setShowModal(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({
      name: r.name,
      startPoint: { ...r.startPoint },
      endPoint: { ...r.endPoint },
      stops: r.stops.map(s => ({ ...s }))
    });
    setShowModal(true);
  };

  const addStop = () => {
    setForm({
      ...form,
      stops: [...form.stops, { name: '', lat: '', lng: '', order: form.stops.length + 1 }]
    });
  };

  const removeStop = (idx) => {
    const newStops = form.stops.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 }));
    setForm({ ...form, stops: newStops });
  };

  const updateStop = (idx, field, value) => {
    const newStops = [...form.stops];
    newStops[idx] = { ...newStops[idx], [field]: field === 'name' ? value : Number(value) || '' };
    setForm({ ...form, stops: newStops });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        startPoint: { ...form.startPoint, lat: Number(form.startPoint.lat), lng: Number(form.startPoint.lng) },
        endPoint: { ...form.endPoint, lat: Number(form.endPoint.lat), lng: Number(form.endPoint.lng) },
        stops: form.stops.map(s => ({ ...s, lat: Number(s.lat), lng: Number(s.lng), order: Number(s.order) }))
      };
      if (editing) {
        await api.put(`/admin/routes/${editing._id}`, payload);
      } else {
        await api.post('/admin/routes', payload);
      }
      setShowModal(false);
      fetchRoutes();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving route');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this route?')) return;
    try {
      await api.delete(`/admin/routes/${id}`);
      fetchRoutes();
    } catch (err) {
      alert('Error deleting route');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Manage Routes</h2>
        <button className="btn btn-primary" onClick={openCreate} id="add-route-btn">➕ Add Route</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {routes.length === 0 ? (
          <div className="card"><div className="empty-state"><div className="empty-state-icon">🗺️</div><h3>No routes yet</h3><p>Create your first bus route</p></div></div>
        ) : (
          routes.map((r) => (
            <div className="card" key={r._id}>
              <div className="card-header">
                <h3 className="card-title" style={{ fontSize: '0.95rem' }}>{r.name}</h3>
                <div className="table-actions">
                  <button className="btn btn-sm btn-secondary" onClick={() => openEdit(r)}>✏️</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r._id)}>🗑️</button>
                </div>
              </div>
              <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                <p>📍 <strong>Start:</strong> {r.startPoint?.name}</p>
                <p>🏁 <strong>End:</strong> {r.endPoint?.name}</p>
                <p style={{ marginTop: '8px' }}>🚏 <strong>{r.stops?.length || 0} stops</strong></p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                  {r.stops?.sort((a, b) => a.order - b.order).map((s) => (
                    <span key={s.order} className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                      {s.order}. {s.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Edit Route' : 'Add Route'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Route Name</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="e.g. Route D — Igatpuri → Sandip College" required />
                </div>

                <div style={{ padding: '12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                  <label className="form-label" style={{ marginBottom: '10px' }}>📍 Start Point</label>
                  <div className="form-row" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                    <input className="form-input" placeholder="Name" value={form.startPoint.name} onChange={(e) => setForm({...form, startPoint: {...form.startPoint, name: e.target.value}})} required />
                    <input className="form-input" placeholder="Lat" value={form.startPoint.lat} onChange={(e) => setForm({...form, startPoint: {...form.startPoint, lat: e.target.value}})} required />
                    <input className="form-input" placeholder="Lng" value={form.startPoint.lng} onChange={(e) => setForm({...form, startPoint: {...form.startPoint, lng: e.target.value}})} required />
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                  <label className="form-label" style={{ marginBottom: '10px' }}>🏁 End Point</label>
                  <div className="form-row" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                    <input className="form-input" placeholder="Name" value={form.endPoint.name} onChange={(e) => setForm({...form, endPoint: {...form.endPoint, name: e.target.value}})} required />
                    <input className="form-input" placeholder="Lat" value={form.endPoint.lat} onChange={(e) => setForm({...form, endPoint: {...form.endPoint, lat: e.target.value}})} required />
                    <input className="form-input" placeholder="Lng" value={form.endPoint.lng} onChange={(e) => setForm({...form, endPoint: {...form.endPoint, lng: e.target.value}})} required />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>🚏 Stops</label>
                    <button type="button" className="btn btn-sm btn-secondary" onClick={addStop}>+ Add Stop</button>
                  </div>
                  {form.stops.map((stop, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1fr 1fr 32px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                      <span className="badge badge-cyan" style={{ justifyContent: 'center' }}>{stop.order}</span>
                      <input className="form-input" placeholder="Stop name" value={stop.name} onChange={(e) => updateStop(idx, 'name', e.target.value)} required />
                      <input className="form-input" placeholder="Lat" value={stop.lat} onChange={(e) => updateStop(idx, 'lat', e.target.value)} required />
                      <input className="form-input" placeholder="Lng" value={stop.lng} onChange={(e) => updateStop(idx, 'lng', e.target.value)} required />
                      {form.stops.length > 1 && (
                        <button type="button" className="btn btn-sm btn-danger btn-icon" onClick={() => removeStop(idx)}>✕</button>
                      )}
                    </div>
                  ))}
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
